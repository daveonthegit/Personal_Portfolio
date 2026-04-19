import { StartupAnimation } from '../components/StartupAnimation';

/**
 * Boot overlay coordinator.
 *
 * Plays on the home template at **`/`** or **`/home`** (same HTML; most visitors use `/home`
 * from nav). After the intro, if the user landed on **`/`**, we `replace('/home')` so the
 * address bar matches deep links and nav.
 *
 * Skips the animation when `?noboot=1` or when `prefers-reduced-motion: reduce` is set
 * (apex `/` still redirects to `/home` without the intro). We intentionally do **not** skip
 * just because there is a `#hash` — otherwise every `/home#about` style link would hide
 * the splash forever.
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
  document.body.classList.add(BODY_READY_CLASS);
}

function normalizePathname(): string {
  let path = window.location.pathname || '/';
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/+$/, '') || '/';
  return path;
}

/** Home entry URLs that show the splash (not `/projects`, etc.). */
function isHomeSplashPath(): boolean {
  const p = normalizePathname();
  return p === '/' || p === '/home';
}

/** User hit apex `/` — after splash we normalize to `/home`. */
function isApexPath(): boolean {
  return normalizePathname() === '/';
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function hasNobootQuery(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('noboot') === '1';
  } catch {
    return false;
  }
}

function goHome(): void {
  window.location.replace('/home');
}

export function initBootOverlay(): void {
  const page = document.body?.dataset?.page;

  if (page !== 'home') {
    clearOverlay();
    markBooted();
    return;
  }

  if (!isHomeSplashPath()) {
    clearOverlay();
    markBooted();
    return;
  }

  const enteredFromApex = isApexPath();

  if (prefersReducedMotion() || hasNobootQuery()) {
    clearOverlay();
    markBooted();
    if (enteredFromApex) goHome();
    return;
  }

  document.body.classList.add(BODY_BOOTING_CLASS);

  try {
    // eslint-disable-next-line no-new
    new StartupAnimation({
      onFinish: () => {
        markBooted();
        if (enteredFromApex) goHome();
      },
    });
  } catch (error) {
    console.error('bootOverlay: failed to start animation', error);
    clearOverlay();
    markBooted();
    if (enteredFromApex) goHome();
  }
}
