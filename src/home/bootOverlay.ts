import { StartupAnimation } from '../components/StartupAnimation';

/**
 * Boot overlay coordinator.
 *
 * - **`/`** — full startup animation, then `location.replace('/home')` when done.
 * - **`/home`** — no splash, no redirect (nav / bookmarks land here without intro).
 *
 * Skip animation on **`/`** only when `?noboot=1` (still redirects to `/home`).
 *
 * We do **not** gate on `prefers-reduced-motion` here: that preference often matches
 * Windows “Animations” / accessibility settings and was skipping the intro entirely
 * while still redirecting — felt like a broken instant redirect. Use `?noboot=1` to
 * skip the splash when needed.
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
