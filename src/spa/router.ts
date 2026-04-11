import { mountProjectsPage } from '../pages/projectsPanel';
import { ContactFormHandler } from '../components/ContactFormHandler';
import { AnimationObserver } from '../utils/animationObserver';
import GlitchAnimationController, { initGlitchAnimations } from '../utils/glitchAnimations';

export type SpaPage = 'home' | 'about' | 'projects' | 'contact' | 'resume';

const SPA_PATHS = new Set(['/home', '/about', '/projects', '/contact', '/resume']);

const PATH_TO_PAGE: Record<string, SpaPage> = {
  '/home': 'home',
  '/about': 'about',
  '/projects': 'projects',
  '/contact': 'contact',
  '/resume': 'resume',
};

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function pathToPage(path: string): SpaPage | null {
  return PATH_TO_PAGE[normalizePath(path)] ?? null;
}

function updateMetaDescription(content: string) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta) meta.setAttribute('content', content);
  const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', content);
  const twDesc = document.querySelector<HTMLMetaElement>('meta[property="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', content);
}

function updateOgTitle(title: string) {
  const og = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
  if (og) og.setAttribute('content', title);
  const tw = document.querySelector<HTMLMetaElement>('meta[property="twitter:title"]');
  if (tw) tw.setAttribute('content', title);
}

function updatePageLabel(page: SpaPage) {
  const el = document.getElementById('spa-page-label');
  if (el) el.textContent = page;
}

function shouldInterceptAnchor(a: HTMLAnchorElement, e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const target = a.getAttribute('target');
  if (target && target !== '_self') return false;
  const hrefAttr = a.getAttribute('href');
  if (!hrefAttr || hrefAttr.startsWith('#')) return false;

  let url: URL;
  try {
    url = new URL(a.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  return SPA_PATHS.has(normalizePath(url.pathname));
}

export type SpaControllerOptions = {
  getGlitchController: () => GlitchAnimationController | null;
  setGlitchController: (c: GlitchAnimationController | null) => void;
};

export function initSpaRouter(opts: SpaControllerOptions): void {
  const main = document.getElementById('main-content');
  if (!main) return;

  const initialPath = normalizePath(window.location.pathname);
  if (!SPA_PATHS.has(initialPath)) return;

  let pageUnmount: (() => void) | null = null;

  const disposePageScripts = () => {
    pageUnmount?.();
    pageUnmount = null;
    ContactFormHandler.unbind();
  };

  const mountPageScripts = (page: SpaPage, root: HTMLElement) => {
    if (page === 'contact') {
      ContactFormHandler.bind();
    }
    if (page === 'projects') {
      pageUnmount = mountProjectsPage(root);
    }
  };

  const refreshGlobals = () => {
    opts.getGlitchController()?.destroy();
    opts.setGlitchController(initGlitchAnimations());
    AnimationObserver.observeElements();
  };

  mountPageScripts(pathToPage(initialPath)!, main);

  const loadPartial = async (path: string, push: boolean): Promise<void> => {
    const page = pathToPage(path);
    if (!page) return;

    disposePageScripts();
    opts.getGlitchController()?.destroy();

    const url = `/partials/${page}`;
    let res: Response;
    try {
      res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
    } catch {
      window.location.assign(path);
      return;
    }

    if (!res.ok) {
      window.location.assign(path);
      return;
    }

    const html = await res.text();
    const title = res.headers.get('X-Page-Title');
    const desc = res.headers.get('X-Page-Description');

    main.innerHTML = html;
    if (title) {
      document.title = title;
      updateOgTitle(title);
    }
    if (desc) updateMetaDescription(desc);
    updatePageLabel(page);
    if (push) {
      history.pushState({ spa: true, page }, '', path);
    }

    refreshGlobals();
    mountPageScripts(page, main);
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  };

  document.addEventListener('click', (e) => {
    const t = e.target as Element | null;
    const a = t?.closest?.('a');
    if (!a || !(a instanceof HTMLAnchorElement)) return;
    if (!shouldInterceptAnchor(a, e)) return;
    e.preventDefault();
    const next = normalizePath(new URL(a.href).pathname);
    if (next === normalizePath(window.location.pathname)) return;
    void loadPartial(next, true);
  });

  window.addEventListener('popstate', () => {
    const p = pathToPage(normalizePath(window.location.pathname));
    if (!p) return;
    void loadPartial(normalizePath(window.location.pathname), false);
  });
}
