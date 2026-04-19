/**
 * Top-bar runtime wiring.
 *
 * - Live clock (HH:MM:SS 24h)
 * - Mobile nav overlay toggle
 * - Scroll-spy underline that tracks the in-view section on /home
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

  const observer = new IntersectionObserver(
    (entries) => {
      // Pick the most-visible intersecting section.
      let best: IntersectionObserverEntry | null = null;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
      }
      if (best) {
        const key = (best.target as HTMLElement).dataset.xwSection ?? null;
        setActive(key);
      }
    },
    {
      rootMargin: '-40% 0px -50% 0px',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    },
  );

  sections.forEach((s) => observer.observe(s));
  return () => observer.disconnect();
}

export function initTopBar(): Cleanup {
  const cleanups: Cleanup[] = [initClock(), initMobileNav(), initScrollSpy()];
  return () => cleanups.forEach((fn) => fn());
}
