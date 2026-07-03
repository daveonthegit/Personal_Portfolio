import { StartupAnimation } from '../components/StartupAnimation';
import { mountZoomInCover, playZoomIn, removeZoomIn } from '../os/zoomIn';

/**
 * Boot overlay coordinator — the front-door cinematic chain.
 *
 * - **`/`** — boot sequence → Zoom-In (map → NYC → subject file) → desktop
 *   reveal. The page beneath is the same home template the OS shell already
 *   mounted, so the finale is a dissolve + `history.replaceState('/home')`,
 *   not a reload. The full intro always plays (project rule); Bypass/Escape
 *   are the visitor's way out at any moment.
 * - **`/home`** — no splash, no redirect (nav / bookmarks land here without intro).
 *
 * Skip animation on **`/`** only when `?noboot=1` (still canonicalizes to `/home`).
 */
const BODY_READY_CLASS = 'xw-boot-done';
const BODY_BOOTING_CLASS = 'xw-booting';

function clearOverlay(): void {
  const overlay = document.getElementById('startup-animation');
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

function markBooted(): void {
  document.body.classList.remove(BODY_BOOTING_CLASS);
  // Apex first-paint cover class — previously cleared by the full-page redirect;
  // with the in-place reveal it must be removed explicitly.
  document.body.classList.remove('xw-boot-pending');
  // Intro veil (hides OS chrome while the 3D flight plays over the canvas).
  document.body.classList.remove('xw-introing');
  document.body.classList.add(BODY_READY_CLASS);
}

function normalizePathname(): string {
  let path = window.location.pathname || '/';
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/+$/, '') || '/';
  return path;
}

function isApexPath(): boolean {
  return normalizePathname() === '/';
}

function hasNobootQuery(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('noboot') === '1';
  } catch {
    return false;
  }
}

/** Canonicalize `/` → `/home` without reloading the already-rendered page. */
function canonicalizeToHome(): void {
  try {
    window.history.replaceState(null, '', '/home');
  } catch {
    window.location.replace('/home');
  }
}

export function initBootOverlay(): void {
  const page = document.body?.dataset?.page;

  if (page !== 'home') {
    clearOverlay();
    markBooted();
    return;
  }

  // /home — never show splash, never client-redirect (canonical browsing URL).
  if (!isApexPath()) {
    clearOverlay();
    markBooted();
    return;
  }

  // Only `/` from here on (same home template as /home).

  if (hasNobootQuery()) {
    clearOverlay();
    markBooted();
    canonicalizeToHome();
    return;
  }

  document.body.classList.add(BODY_BOOTING_CLASS);

  const finish = () => {
    markBooted();
    canonicalizeToHome();
  };

  // The full intro ALWAYS plays (project rule — owner's decision overrides the
  // reduced-motion skip). Bypass/Escape remain the visitor's way out.
  // 3D City intro (ADR 0002) on fine-pointer desktops; SVG ladder elsewhere.
  const wants3D = window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;
  // Warm the chunk during the boot animation; the shell mounts the scene.
  const cityP = wants3D
    ? import('../os/city3d').catch(() => null)
    : Promise.resolve(null);
  if (wants3D) document.body.classList.add('xw-introing');

  const runSvgFallback = (existingCover: HTMLElement | null) => {
    const cover = existingCover ?? mountZoomInCover();
    playZoomIn(cover, finish);
  };

  try {
    // For the SVG path the cover pre-mounts beneath the boot layer so the boot
    // fade lands black-on-black. The 3D path renders under a transparent HUD
    // (the canvas is the desktop plane), so no cover is needed.
    const svgCover = wants3D ? null : mountZoomInCover();

    // eslint-disable-next-line no-new
    new StartupAnimation({
      onFinish: (skipped) => {
        if (skipped) {
          if (svgCover) removeZoomIn(svgCover);
          void cityP.then((m) => m?.settleDesktop());
          finish();
          return;
        }
        void cityP.then((m) => {
          if (m && m.cityMounted()) {
            const hud = document.createElement('div');
            hud.className = 'xw-zoomin xw-zoomin--clear';
            document.body.appendChild(hud);
            if (m.playIntro(hud, finish)) return;
            hud.remove();
          }
          runSvgFallback(svgCover);
        });
      },
    });
  } catch (error) {
    console.error('bootOverlay: failed to start animation', error);
    clearOverlay();
    markBooted();
    canonicalizeToHome();
  }
}
