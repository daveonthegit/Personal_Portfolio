import { StartupAnimation } from '../components/StartupAnimation';

/**
 * Boot overlay coordinator.
 *
 * The startup animation runs only on the apex URL `/` (same home template as `/home`).
 * After the intro finishes, the client navigates to `/home` (history replace — no extra back-step).
 *
 * Visiting `/home` directly never shows the overlay. Other routes clear the placeholder.
 *
 * Skips the animation (still redirects `/` → `/home`) when the user prefers reduced motion,
 * when a hash is present (deep links), or when `?noboot=1` is set.
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

/** True only for the site root path `/` (not `/home`, not other pages). */
function isRootPath(): boolean {
  return normalizePathname() === '/';
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function hasSkipBootIntent(): boolean {
  if (window.location.hash && window.location.hash.length > 1) return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('noboot') === '1') return true;
  } catch {
    /* noop */
  }
  return false;
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

  // Same template as `/`, but canonical URL without splash — never show intro on /home.
  if (!isRootPath()) {
    clearOverlay();
    markBooted();
    return;
  }

  // `/` — splash entry
  if (prefersReducedMotion() || hasSkipBootIntent()) {
    clearOverlay();
    markBooted();
    goHome();
    return;
  }

  document.body.classList.add(BODY_BOOTING_CLASS);

  try {
    // eslint-disable-next-line no-new
    new StartupAnimation({
      onFinish: () => {
        markBooted();
        goHome();
      },
    });
  } catch (error) {
    console.error('bootOverlay: failed to start animation', error);
    clearOverlay();
    markBooted();
    goHome();
  }
}
