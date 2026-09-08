/**
 * xiaoOS desktop shell — Phase 1 (see CONTEXT.md for the ubiquitous language).
 *
 * Progressive enhancement over the server-rendered pages:
 *  - Desktop (fine pointer, ≥900px): the route's `[data-xw-app]` article is adopted
 *    into a draggable Window on a fixed desktop plane; the dock opens further Apps
 *    by fetching their route and adopting that route's article. URLs stay canonical
 *    via pushState, so every App remains a real, crawlable page.
 *  - Mobile: no windowing — the dock becomes a bottom tab bar and routes navigate
 *    natively (the Companion App presentation).
 *  - No JS / unknown pages: nothing activates; documents render as plain pages.
 */

import { gsap } from 'gsap';
import { ContactFormHandler } from '../components/ContactFormHandler';
import { wallpaperSvg } from './map';

type AppId = 'dossier' | 'projects' | 'resume' | 'contact' | 'arcade';

interface AppSpec {
  id: AppId;
  title: string;
  route: string;
  /** Default position as % of the desktop plane. */
  x: number;
  y: number;
}

interface OpenWindow {
  spec: AppSpec;
  el: HTMLElement;
  body: HTMLElement;
  minimized: boolean;
  /** App-specific teardown (projects panel disposer, contact form unbind). */
  dispose?: () => void;
  ready?: Promise<void>;
}

const APPS: AppSpec[] = [
  // Origins staggered so newly opened windows never bury an earlier titlebar.
  { id: 'dossier', title: 'Dossier', route: '/home', x: 5, y: 3 },
  { id: 'projects', title: 'Projects', route: '/projects', x: 17, y: 9 },
  { id: 'resume', title: 'Resume', route: '/resume', x: 29, y: 4 },
  { id: 'contact', title: 'Contact', route: '/contact', x: 38, y: 16 },
  { id: 'arcade', title: 'Arcade', route: '/arcade', x: 46, y: 7 },
];

const APP_BY_ID = new Map(APPS.map((a) => [a.id, a]));

/** Set once the 3D City mounts; the shell talks back for room exits etc. */
let cityRef: typeof import('./city3d') | null = null;

function decodeFragment(value: string): string {
  try { return decodeURIComponent(value); }
  catch { return value; } // A malformed bookmark should leave the document usable.
}

function appForPath(pathname: string): AppSpec | null {
  const path = (pathname.replace(/\/+$/, '') || '/').toLowerCase();
  if (path === '/' || path === '/home') return APP_BY_ID.get('dossier') ?? null;
  const found = APPS.find((a) => a.route === path);
  return found ?? null;
}

/** App content that arrives via fetch never got the revealer's ready class on this
 *  document, except elements the initial page load already marked. Strip the marker
 *  classes so nothing mounts invisible inside a window. */
function neutralizeReveals(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-xw-reveal]').forEach((el) => {
    el.classList.remove('xw-reveal-ready');
    el.classList.add('xw-reveal-shown');
  });
}

export class OSShell {
  private plane: HTMLElement;
  private windows = new Map<AppId, OpenWindow>();
  private zCounter = 10;
  private focused: AppId | null = null;
  private openRequest = 0;
  private readonly loadingStatus: HTMLElement;
  private readonly contentCache = new Map<AppId, HTMLElement>();

  constructor(plane: HTMLElement) {
    this.plane = plane;
    this.loadingStatus = document.createElement('p');
    this.loadingStatus.className = 'xw-app-loading';
    this.loadingStatus.setAttribute('role', 'status');
    this.loadingStatus.hidden = true;
    plane.appendChild(this.loadingStatus);
  }

  /* ────────────────────────────── window lifecycle ───────────────────────── */

  async openApp(id: AppId, opts: { push?: boolean; originRect?: DOMRect | undefined } = {}): Promise<void> {
    const spec = APP_BY_ID.get(id);
    if (!spec) return;

    const request = ++this.openRequest;
    this.loadingStatus.hidden = true;
    const existing = this.windows.get(id);
    if (existing) {
      if (existing.minimized) this.setMinimized(existing, false);
      this.focusWindow(id);
      existing.body.focus({ preventScroll: true });
      if (opts.push !== false) this.syncUrl(spec);
      return;
    }

    this.loadingStatus.textContent = `Opening ${spec.title}…`;
    this.loadingStatus.hidden = false;
    const article = await this.resolveContent(spec);
    // Latest navigation wins. A slow response cannot reopen an abandoned app.
    if (request !== this.openRequest) return;
    this.loadingStatus.hidden = true;
    if (!article) {
      // Fetch failed — fall back to a real navigation so the user still lands there.
      window.location.href = spec.route;
      return;
    }

    // Keep the current document available while its replacement is loading.
    for (const otherId of Array.from(this.windows.keys())) {
      if (otherId !== id) this.closeApp(otherId);
    }
    const win = this.createWindow(spec, article);
    this.windows.set(id, win);
    this.plane.appendChild(win.el);
    this.initAppRuntime(win);
    this.focusWindow(id);
    win.body.focus({ preventScroll: true });
    this.updateDock();
    if (opts.originRect) this.growFrom(win, opts.originRect);
    if (opts.push !== false) this.syncUrl(spec);
  }

  /** Window entrance growing out of a map tag/panel (City open motion). */
  private growFrom(win: OpenWindow, origin: DOMRect): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const planeR = this.plane.getBoundingClientRect();
    const final = win.el.getBoundingClientRect();
    win.el.style.animation = 'none'; // suppress the default keyframe entrance
    gsap.fromTo(
      win.el,
      {
        left: origin.left - planeR.left,
        top: origin.top - planeR.top,
        width: origin.width,
        height: origin.height,
        opacity: 0.65,
      },
      {
        left: final.left - planeR.left,
        top: final.top - planeR.top,
        width: final.width,
        height: final.height,
        opacity: 1,
        duration: 0.38,
        ease: 'power3.out',
        onComplete: () => {
          gsap.set(win.el, { clearProps: 'width,height,opacity' });
        },
      },
    );
  }

  /** Adopt the server-rendered article for the current route, or fetch another App's. */
  adoptInitial(article: HTMLElement, id: AppId): void {
    const spec = APP_BY_ID.get(id);
    if (!spec) return;
    const win = this.createWindow(spec, article);
    this.windows.set(id, win);
    this.plane.appendChild(win.el);
    this.initAppRuntime(win);
    this.focusWindow(id);
    this.updateDock();
  }

  private async resolveContent(spec: AppSpec): Promise<HTMLElement | null> {
    const cached = this.contentCache.get(spec.id);
    if (cached) return cached;
    try {
      const res = await fetch(spec.route, { credentials: 'same-origin' });
      if (!res.ok) return null;
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const found = doc.querySelector<HTMLElement>(`[data-xw-app="${spec.id}"]`);
      if (!found) return null;
      const adopted = document.importNode(found, true);
      neutralizeReveals(adopted);
      this.contentCache.set(spec.id, adopted);
      return adopted;
    } catch {
      return null;
    }
  }

  private createWindow(spec: AppSpec, article: HTMLElement): OpenWindow {
    const el = document.createElement('section');
    el.className = 'xw-window';
    el.dataset.app = spec.id;
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', spec.title);

    const titlebar = document.createElement('header');
    titlebar.className = 'xw-window-titlebar';
    titlebar.innerHTML = `
      <span class="xw-window-dot" aria-hidden="true"></span>
      <span class="xw-window-title">${spec.title}</span>
      <span class="xw-window-actions">
        <button type="button" class="xw-window-btn" data-xw-win="minimize" aria-label="Minimize ${spec.title}">–</button>
        <button type="button" class="xw-window-btn" data-xw-win="close" aria-label="Close ${spec.title}">×</button>
      </span>`;

    this.contentCache.set(spec.id, article);
    const body = document.createElement('div');
    body.className = 'xw-window-body';
    body.tabIndex = -1;
    body.appendChild(article);

    el.appendChild(titlebar);
    el.appendChild(body);

    // Cascade slightly per already-open window so stacks never fully overlap.
    const offset = this.windows.size * 3;
    el.style.left = `${spec.x + offset}%`;
    el.style.top = `${spec.y + offset}%`;

    const win: OpenWindow = { spec, el, body, minimized: false };

    titlebar.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-xw-win]');
      if (!btn) return;
      if (btn.dataset.xwWin === 'close') this.closeApp(spec.id);
      if (btn.dataset.xwWin === 'minimize') this.setMinimized(win, true);
    });
    el.addEventListener('pointerdown', () => this.focusWindow(spec.id), true);
    this.makeDraggable(win.el, titlebar);

    return win;
  }

  private initAppRuntime(win: OpenWindow): void {
    if (win.spec.id === 'projects') {
      win.ready = import('../pages/projectsPanel')
        .then((mod) => {
          if (win.el.isConnected) win.dispose = mod.mountProjectsPage(win.body);
        })
        .catch((error) => console.error('shell: projects panel failed to mount', error));
    }
    if (win.spec.id === 'contact') {
      ContactFormHandler.bind();
      win.dispose = () => ContactFormHandler.unbind();
    }
    if (win.spec.id === 'resume') {
      void import('../pages/resumeTimeline')
        .then((mod) => {
          if (win.el.isConnected) win.dispose = mod.mountResumeLens(win.body);
        })
        .catch((error) => console.error('shell: resume lens failed to mount', error));
    }
    if (win.spec.id === 'dossier') {
      void import('../pages/dossierLive')
        .then((mod) => {
          if (win.el.isConnected) win.dispose = mod.mountDossierLive(win.body);
        })
        .catch((error) => console.error('shell: dossier live failed to mount', error));
    }
  }

  closeApp(id: AppId): void {
    const win = this.windows.get(id);
    if (!win) return;
    const restoreFocus = win.el.contains(document.activeElement);
    win.dispose?.();
    win.el.remove();
    if (restoreFocus) document.querySelector<HTMLElement>(`[data-xw-dock="${id}"]`)?.focus();
    // The article is cached by createWindow; reopening retains document state.
    this.windows.delete(id);
    if (this.focused === id) this.focused = null;
    this.updateDock();
    // Closing the last window means leaving the building (exit grammar).
    if (this.windows.size === 0) cityRef?.exitRoom();
  }

  /** Open the Projects app and jump straight to one record (room displays). */
  openProjectRecord(projectId: string): void {
    void this.openApp('projects').then(async () => {
      const win = this.windows.get('projects');
      if (!win) return;
      await win.ready;
      if (!win.el.isConnected) return;
      // Open once, only after listeners exist. Retry-clicking could reopen a
      // record the visitor had already dismissed with Escape.
      const card = Array.from(win.body.querySelectorAll<HTMLElement>('.project-card'))
        .find(card => card.dataset.category === projectId);
      card?.click();
    });
  }

  private setMinimized(win: OpenWindow, minimized: boolean): void {
    win.minimized = minimized;
    win.el.classList.toggle('xw-window--minimized', minimized);
    if (minimized && this.focused === win.spec.id) {
      this.focused = null;
      document.querySelector<HTMLElement>(`[data-xw-dock="${win.spec.id}"]`)?.focus();
    }
    if (!minimized) this.focusWindow(win.spec.id);
    this.updateDock();
  }

  focusWindow(id: AppId): void {
    const win = this.windows.get(id);
    if (!win || win.minimized) return;
    this.zCounter += 1;
    win.el.style.zIndex = String(this.zCounter);
    this.focused = id;
    this.windows.forEach((w) => {
      w.el.classList.toggle('xw-window--focused', w.spec.id === id);
    });
    this.updateDock();
  }

  get focusedApp(): AppId | null {
    return this.focused;
  }

  /* ─────────────────────────── live capture windows ───────────────────────── */

  private captureCount = 0;

  /** Open the Subject's running software in a child window (Live Capture). */
  openCapture(title: string, url: string): void {
    this.captureCount += 1;
    const el = document.createElement('section');
    // Captures keep the focused styling; they sit outside app focus bookkeeping.
    el.className = 'xw-window xw-window--capture xw-window--focused';
    el.dataset.app = 'capture';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', `Live capture — ${title}`);

    const titlebar = document.createElement('header');
    titlebar.className = 'xw-window-titlebar';
    titlebar.innerHTML = `
      <span class="xw-window-dot" aria-hidden="true"></span>
      <span class="xw-window-title">Live capture — ${title}</span>
      <span class="xw-window-actions">
        <button type="button" class="xw-window-btn" data-xw-win="close" aria-label="Close capture">×</button>
      </span>`;

    const body = document.createElement('div');
    body.className = 'xw-window-body xw-window-body--capture';
    const frame = document.createElement('iframe');
    frame.src = url;
    frame.className = 'xw-window-iframe';
    frame.title = `${title} — running live`;
    body.appendChild(frame);

    el.appendChild(titlebar);
    el.appendChild(body);
    el.style.left = `${18 + ((this.captureCount * 4) % 20)}%`;
    el.style.top = `${8 + ((this.captureCount * 5) % 18)}%`;

    titlebar.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-xw-win="close"]')) el.remove();
    });
    el.addEventListener('pointerdown', () => {
      this.zCounter += 1;
      el.style.zIndex = String(this.zCounter);
    }, true);
    this.makeDraggable(el, titlebar);

    this.plane.appendChild(el);
    this.zCounter += 1;
    el.style.zIndex = String(this.zCounter);
  }

  /* ──────────────────────────────── dragging ─────────────────────────────── */

  private makeDraggable(el: HTMLElement, handle: HTMLElement): void {
    let startX = 0;
    let startY = 0;
    let baseLeft = 0;
    let baseTop = 0;

    const onMove = (e: PointerEvent) => {
      const planeRect = this.plane.getBoundingClientRect();
      const winRect = el.getBoundingClientRect();
      const maxLeft = Math.max(0, planeRect.width - winRect.width);
      const maxTop = Math.max(0, planeRect.height - Math.min(winRect.height, 120));
      const left = Math.min(Math.max(baseLeft + (e.clientX - startX), 0), maxLeft);
      const top = Math.min(Math.max(baseTop + (e.clientY - startY), 0), maxTop);
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    };

    handle.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('[data-xw-win]')) return;
      if (e.button !== 0) return;
      const planeRect = this.plane.getBoundingClientRect();
      const winRect = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      baseLeft = winRect.left - planeRect.left;
      baseTop = winRect.top - planeRect.top;
      handle.setPointerCapture(e.pointerId);
      handle.addEventListener('pointermove', onMove);
      const stop = () => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', stop);
        handle.removeEventListener('pointercancel', stop);
      };
      handle.addEventListener('pointerup', stop);
      handle.addEventListener('pointercancel', stop);
    });
  }

  /* ─────────────────────────────── dock / url ────────────────────────────── */

  private updateDock(): void {
    document.querySelectorAll<HTMLAnchorElement>('#xw-dock [data-xw-dock]').forEach((item) => {
      const id = item.dataset.xwDock as AppId | undefined;
      if (!id) return;
      const win = this.windows.get(id);
      item.classList.toggle('xw-dock-item--open', Boolean(win));
      item.classList.toggle('xw-dock-item--minimized', Boolean(win?.minimized));
      if (this.focused === id) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }

  private syncUrl(spec: AppSpec): void {
    if (window.location.pathname !== spec.route) {
      window.history.pushState({ xwApp: spec.id }, '', spec.route);
    }
    const title = document.querySelector('title');
    if (title) document.title = `${spec.title} - David Xiao`;
  }
}

/* ─────────────────────────────── bootstrapping ─────────────────────────────── */

function activateDesktop(initialApp: AppSpec, article: HTMLElement): void {
  document.body.classList.add('xw-os');

  const plane = document.createElement('div');
  plane.className = 'xw-desktop';
  plane.id = 'xw-desktop';
  // SVG wallpaper paints instantly; the 3D City replaces it when it mounts.
  plane.innerHTML = wallpaperSvg();
  document.body.appendChild(plane);

  const shell = new OSShell(plane);
  shell.adoptInitial(article, initialApp.id);
  if (location.hash && !location.hash.startsWith('#record=')) {
    requestAnimationFrame(() => document.getElementById(decodeFragment(location.hash.slice(1)))?.scrollIntoView({ behavior: 'instant' }));
  }

  // Reduced motion retains the static wallpaper and direct application controls.
  // No WebGL download or automatic camera movement is needed for the quiet path.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) void import('./city3d')
    .then((m) => {
      const ok = m.mountCity(plane, {
        openApp: (id, rect) => {
          void shell.openApp(id as AppId, { originRect: rect ?? undefined });
        },
        openCapture: (title, url) => shell.openCapture(title, url),
        openProjectRecord: (projectId) => shell.openProjectRecord(projectId),
      });
      if (ok) cityRef = m;
      // During the apex intro the flight reveals the tags itself.
      if (ok && !document.body.classList.contains('xw-introing')) m.showTags();
    })
    .catch(() => {
      /* keep the SVG wallpaper */
    });

  // Dock opens apps in place.
  document.querySelectorAll<HTMLAnchorElement>('#xw-dock [data-xw-dock]').forEach((item) => {
    item.addEventListener('click', (e) => {
      const id = item.dataset.xwDock as AppId | undefined;
      if (!id || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      // Dock: dive into the room, then the window opens from its screen.
      const dove = cityRef?.dockDive(id, (rect) => {
        void shell.openApp(id, { originRect: rect ?? undefined });
      });
      if (!dove) void shell.openApp(id);
    });
  });

  // In-window links: app routes open windows; hash links scroll within the window.
  plane.addEventListener('click', (e) => {
    const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!anchor || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const href = anchor.getAttribute('href') ?? '';

    // Live capture: run the subject's software in a child window, not a tab.
    if (anchor.classList.contains('xw-observe-live')) {
      e.preventDefault();
      shell.openCapture(anchor.dataset.captureTitle ?? 'Capture', href);
      return;
    }

    if (href.startsWith('#')) {
      const target = document.getElementById(decodeFragment(href.slice(1)));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
      }
      return;
    }

    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    const app = appForPath(url.pathname);
    // Only intercept plain app-route clicks; /resume/pdf etc. navigate normally.
    if (!app || (url.pathname !== app.route && !(app.id === 'dossier' && (url.pathname === '/' || url.pathname === '/home')))) return;
    e.preventDefault();
    if (app.id === 'projects' && url.hash.startsWith('#record=')) {
      shell.openProjectRecord(decodeFragment(url.hash.slice(8)));
      return;
    }
    void shell.openApp(app.id).then(() => {
      if (url.hash) {
        document.getElementById(decodeFragment(url.hash.slice(1)))?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
      }
    });
  });

  // Escape closes the focused window — unless the projects modal is open (it owns
  // Escape) or the boot/zoom cinematic is still running (Escape means "skip" there).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!document.body.classList.contains('xw-boot-done')) return;
    if (document.querySelector('#project-terminal-overlay.is-open')) return;
    const id = shell.focusedApp;
    if (id) shell.closeApp(id);
    else cityRef?.exitRoom(); // no window in focus: Escape leaves the room
  });

  // Back/forward re-opens the matching app without pushing.
  window.addEventListener('popstate', () => {
    const app = appForPath(window.location.pathname);
    if (app) void shell.openApp(app.id, { push: false });
  });
}

export function initOSShell(): void {
  const page = document.body?.dataset?.page ?? '';
  const initialApp = appForPath(window.location.pathname);
  const article = document.querySelector<HTMLElement>('#main-content [data-xw-app]');
  if (!initialApp || !article || !['home', 'projects', 'resume', 'contact', 'arcade'].includes(page)) return;

  const desktopMode = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;
  if (desktopMode) {
    activateDesktop(initialApp, article);
  } else {
    // Companion App: the dock owns navigation, including Map. The intro
    // arrives in /home#file; a direct /home visit opens the city hub.
    document.body.classList.add('xw-os-mobile');
    if (initialApp.id === 'dossier' && !matchMedia('(prefers-reduced-motion: reduce)').matches) mountMobileMapHome();
  }
}

/** Fullscreen map hub on mobile /home; the dossier doc toggles via #file. */
function mountMobileMapHome(): void {
  document.body.classList.add('xw-map-home');

  const panel = document.createElement('div');
  panel.className = 'xw-city-mobile';
  panel.setAttribute('aria-label', 'City map — app locations');
  document.body.appendChild(panel);

  const setView = (map: boolean, sync = true) => {
    document.body.classList.toggle('xw-map-view', map);
    const mapTab = document.querySelector('.xw-dock-item--mob');
    const fileTab = document.querySelector('[data-xw-dock="dossier"]');
    if (map) { mapTab?.setAttribute('aria-current', 'page'); fileTab?.removeAttribute('aria-current'); }
    else { fileTab?.setAttribute('aria-current', 'page'); mapTab?.removeAttribute('aria-current'); }
    if (sync) {
      try {
        const url = new URL(window.location.href);
        url.pathname = '/home';
        url.hash = map ? '' : 'file';
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      } catch {
        /* URL cosmetics only */
      }
    }
    if (!map) window.scrollTo(0, 0);
  };

  setView(!window.location.hash, false);
  window.addEventListener('hashchange', () => setView(!window.location.hash, false));
  window.addEventListener('xw:intro-ready', e => {
    if (e instanceof CustomEvent && e.detail?.apex && !window.location.hash) setView(false);
  }, { once: true });
  document.querySelector('.xw-dock-item--mob')?.addEventListener('click', e => {
    if (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
    e.preventDefault();
    setView(true);
  });

  void import('./city3d')
    .then((m) => {
      const ok = m.mountCity(panel, {
        openApp: (id) => {
          if (id === 'dossier') {
            setView(false);
            return;
          }
          const spec = APP_BY_ID.get(id as AppId);
          if (spec) window.location.href = spec.route;
        },
        // No windowing on mobile — in-room surfaces navigate instead.
        openProjectRecord: (projectId) => {
          window.location.href = `/projects#record=${encodeURIComponent(projectId)}`;
        },
        openCapture: (_title, url) => {
          window.location.href = url;
        },
      });
      if (ok) {
        if (!document.body.classList.contains('xw-introing')) m.showTags();
        setView(!window.location.hash, false);
      } else {
        // No WebGL: plain document companion, no map hub.
        panel.remove();
        document.body.classList.remove('xw-map-home');
        document.body.classList.remove('xw-map-view');
      }
    })
    .catch(() => {
      panel.remove();
      document.body.classList.remove('xw-map-home');
      document.body.classList.remove('xw-map-view');
    });
}
