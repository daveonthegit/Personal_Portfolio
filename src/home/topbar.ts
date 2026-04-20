/**
 * Top-bar runtime wiring.
 *
 * - Live clock (HH:MM:SS 24h)
 * - Mobile nav overlay toggle
 * - Scroll-spy: highlights the section whose heading has passed the activation line
 *   (below the top bar). Updates on scroll **up and down** via rAF-throttled listeners.
 *
 * All listeners are passive and safe to run on pages without any of the
 * target elements — the helpers no-op cleanly.
 */

type Cleanup = () => void;

const CLOCK_ID = 'xw-clock';
const TOGGLE_ID = 'xw-nav-toggle';
const MOBILE_NAV_ID = 'xw-mobile-nav';
const NAV_ID = 'xw-primary-nav';
const SECTION_SELECTOR = 'section[data-xw-section]';
const ACTIVE_CLASS = 'xw-nav-link--active';

function initClock(): Cleanup {
  const el = document.getElementById(CLOCK_ID);
  if (!el) return () => undefined;

  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  };
  tick();
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
}

function initMobileNav(): Cleanup {
  const toggle = document.getElementById(TOGGLE_ID);
  const nav = document.getElementById(MOBILE_NAV_ID);
  if (!toggle || !nav) return () => undefined;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      nav.hidden = false;
      requestAnimationFrame(() => nav.classList.add('xw-mobile-nav--open'));
      document.body.classList.add('xw-mobile-nav-lock');
    } else {
      nav.classList.remove('xw-mobile-nav--open');
      document.body.classList.remove('xw-mobile-nav-lock');
      // hide after transition end — keep simple
      window.setTimeout(() => {
        if (toggle.getAttribute('aria-expanded') === 'false') {
          nav.hidden = true;
        }
      }, 200);
    }
  };

  const onToggle = () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!open);
  };

  const onLinkClick = (e: Event) => {
    const t = e.target as Element | null;
    if (t && t.closest('a')) setOpen(false);
  };

  const onEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  toggle.addEventListener('click', onToggle);
  nav.addEventListener('click', onLinkClick);
  document.addEventListener('keydown', onEsc);

  return () => {
    toggle.removeEventListener('click', onToggle);
    nav.removeEventListener('click', onLinkClick);
    document.removeEventListener('keydown', onEsc);
  };
}

/** Pixels from viewport top; matches scroll-margin intent under fixed top bar. */
function getActivationOffsetPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--xw-topbar-h').trim();
  const parsed = parseFloat(raw);
  const topbar = Number.isFinite(parsed) ? parsed : 56;
  return topbar + 16;
}

/**
 * Last section (in document order) whose top edge is at or above the activation line.
 * Updates correctly when scrolling up or down (unlike IO “max ratio among intersecting”).
 */
function pickActiveSection(sections: HTMLElement[]): HTMLElement | null {
  if (sections.length === 0) return null;
  const offset = getActivationOffsetPx();
  let active: HTMLElement = sections[0]!;
  for (const s of sections) {
    const top = s.getBoundingClientRect().top;
    if (top <= offset) {
      active = s;
    }
  }
  return active;
}

/** Matches `main.css`: rail + desktop nav hidden — continuous spy only matters on wider layouts. */
const SCROLL_SPY_MIN_WIDTH_PX = 901;

function initScrollSpy(): Cleanup {
  const nav = document.getElementById(NAV_ID);
  const rail = document.getElementById('xw-section-rail');
  if (!nav && !rail) return () => undefined;

  const sections = Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR));
  if (sections.length === 0) return () => undefined;

  const links = new Map<string, HTMLAnchorElement>();
  if (nav) {
    nav.querySelectorAll<HTMLAnchorElement>('a[data-xw-nav]').forEach((a) => {
      const key = a.dataset.xwNav;
      if (key) links.set(key, a);
    });
  }

  const railLinks = new Map<string, HTMLAnchorElement>();
  if (rail) {
    rail.querySelectorAll<HTMLAnchorElement>('a[data-xw-rail]').forEach((a) => {
      const key = a.dataset.xwRail;
      if (key) railLinks.set(key, a);
    });
  }

  const setActive = (key: string | null) => {
    links.forEach((a) => {
      const isActive = a.dataset.xwNav === key;
      a.classList.toggle(ACTIVE_CLASS, isActive);
      if (isActive) {
        a.setAttribute('aria-current', 'true');
      } else {
        a.removeAttribute('aria-current');
      }
    });
    railLinks.forEach((a) => {
      const isActive = a.dataset.xwRail === key;
      if (isActive) {
        a.setAttribute('data-xw-active', 'true');
        a.setAttribute('aria-current', 'true');
      } else {
        a.removeAttribute('data-xw-active');
        a.removeAttribute('aria-current');
      }
    });
  };

  const sync = () => {
    const active = pickActiveSection(sections);
    setActive(active?.dataset.xwSection ?? null);
  };

  let raf = 0;
  const syncRaf = () => {
    raf = 0;
    sync();
  };

  const onScrollOrResize = () => {
    if (raf !== 0) return;
    raf = window.requestAnimationFrame(syncRaf);
  };

  const mq = window.matchMedia(`(min-width: ${SCROLL_SPY_MIN_WIDTH_PX}px)`);

  const removeScrollListeners = () => {
    window.removeEventListener('scroll', onScrollOrResize);
    window.removeEventListener('resize', onScrollOrResize);
    if (raf !== 0) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const applyLayout = () => {
    removeScrollListeners();
    if (mq.matches) {
      window.addEventListener('scroll', onScrollOrResize, { passive: true });
      window.addEventListener('resize', onScrollOrResize, { passive: true });
      syncRaf();
    } else {
      // Mobile / narrow: rail and desktop nav are hidden — avoid scroll listeners +
      // repeated getBoundingClientRect during touch momentum (was causing stuck/janky scroll).
      sync();
    }
  };

  applyLayout();
  mq.addEventListener('change', applyLayout);

  return () => {
    mq.removeEventListener('change', applyLayout);
    removeScrollListeners();
  };
}

export function initTopBar(): Cleanup {
  const cleanups: Cleanup[] = [initClock(), initMobileNav(), initScrollSpy()];
  return () => cleanups.forEach((fn) => fn());
}
