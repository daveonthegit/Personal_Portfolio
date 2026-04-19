import { StartupAnimation } from '../components/StartupAnimation';

/**
 * Boot overlay coordinator.
 *
 * The startup animation now lives on /home (and /, which renders /home).
 * It plays once per session. On subsequent navigations within the same
 * tab, the `#startup-animation` container is removed immediately so the
 * overlay never flashes.
 *
 * The intro is skipped entirely when the user prefers reduced motion,
 * when a deep-link hash is present (so section scroll lands cleanly),
 * or when the page is loaded with ?noboot=1.
 */
const BOOT_FLAG = 'xw:booted';
const BODY_READY_CLASS = 'xw-boot-done';
const BODY_BOOTING_CLASS = 'xw-booting';

function clearOverlay(): void {
  const overlay = document.getElementById('startup-animation');
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

function markBooted(): void {
  try {
    sessionStorage.setItem(BOOT_FLAG, '1');
  } catch {
    /* storage disabled — best-effort only */
  }
  document.body.classList.remove(BODY_BOOTING_CLASS);
  document.body.classList.add(BODY_READY_CLASS);
}

function alreadyBootedThisSession(): boolean {
  try {
    return sessionStorage.getItem(BOOT_FLAG) === '1';
  } catch {
    return false;
  }
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

/**
 * True when the server rendered the home template (see base.html data-page).
 * Also accepts common pathname variants so the intro still runs when the host
 * rewrites `/` → `/index.html`, adds trailing slashes, or strips the leading slash.
 */
function isHomeBootSurface(): boolean {
  const page = document.body?.dataset?.page;
  if (page === 'home') return true;

  let path = window.location.pathname || '/';
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/+$/, '') || '/';
  const lower = path.toLowerCase();
  return (
    path === '/' ||
    path === '/home' ||
    lower === '/index.html' ||
    lower === '/index.htm'
  );
}

export function initBootOverlay(): void {
  // Intro is only meaningful on the home surface (/, /home, or same template under rewrites).
  if (!isHomeBootSurface()) {
    clearOverlay();
    markBooted();
    return;
  }

  if (alreadyBootedThisSession() || prefersReducedMotion() || hasSkipBootIntent()) {
    clearOverlay();
    markBooted();
    return;
  }

  document.body.classList.add(BODY_BOOTING_CLASS);

  try {
    // eslint-disable-next-line no-new
    new StartupAnimation({
      onFinish: () => {
        markBooted();
      },
    });
  } catch (error) {
    console.error('bootOverlay: failed to start animation', error);
    clearOverlay();
    markBooted();
  }
}
