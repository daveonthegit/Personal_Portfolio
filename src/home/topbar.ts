/**
 * Top-bar runtime wiring.
 *
 * - Live clock (HH:MM:SS 24h)
 * - Mobile nav overlay toggle
 * - Scroll-spy: highlights the active section via IntersectionObserver + sync on resize
 *
 * Helpers no-op cleanly when targets are missing.
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
    nav.setAttribute('aria-hidden', open ? 'false' : 'true');

    if (open) {
      nav.hidden = false;
      document.body.classList.add('xw-mobile-nav-lock');
      requestAnimationFrame(() => nav.classList.add('xw-mobile-nav--open'));
      return;
    }

    nav.classList.remove('xw-mobile-nav--open');
    document.body.classList.remove('xw-mobile-nav-lock');
  };

  const onToggle = () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  };

  const onLinkClick = (e: Event) => {
    const t = e.target as Element | null;
    if (t?.closest('a')) setOpen(false);
  };

  const onEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  const onTransitionEnd = (e: TransitionEvent) => {
    if (e.target !== nav || e.propertyName !== 'opacity') return;
    if (toggle.getAttribute('aria-expanded') !== 'true') {
      nav.hidden = true;
    }
  };

  nav.hidden = true;
  nav.setAttribute('aria-hidden', 'true');

  toggle.addEventListener('click', onToggle);
  nav.addEventListener('click', onLinkClick);
  nav.addEventListener('transitionend', onTransitionEnd);
  document.addEventListener('keydown', onEsc);

  return () => {
    toggle.removeEventListener('click', onToggle);
    nav.removeEventListener('click', onLinkClick);
    nav.removeEventListener('transitionend', onTransitionEnd);
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

function initScrollSpy(): Cleanup {
  const nav = document.getElementById(NAV_ID);
  const rail = document.getElementById('xw-section-rail');
  if (!nav && !rail) return () => undefined;

  const sections = Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR));
  if (sections.length === 0) return () => undefined;

  const links = new Map<string, HTMLAnchorElement>();
  nav?.querySelectorAll<HTMLAnchorElement>('a[data-xw-nav]').forEach((a) => {
    const key = a.dataset.xwNav;
    if (key) links.set(key, a);
  });

  const railLinks = new Map<string, HTMLAnchorElement>();
  rail?.querySelectorAll<HTMLAnchorElement>('a[data-xw-rail]').forEach((a) => {
    const key = a.dataset.xwRail;
    if (key) railLinks.set(key, a);
  });

  const setActive = (key: string | null) => {
    links.forEach((a) => {
      const active = a.dataset.xwNav === key;
      a.classList.toggle(ACTIVE_CLASS, active);
      if (active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });

    railLinks.forEach((a) => {
      const active = a.dataset.xwRail === key;
      if (active) {
        a.setAttribute('data-xw-active', 'true');
        a.setAttribute('aria-current', 'true');
      } else {
        a.removeAttribute('data-xw-active');
        a.removeAttribute('aria-current');
      }
    });
  };

  let observer: IntersectionObserver | null = null;
  let raf = 0;

  const sync = () => {
    raf = 0;
    const offset = getActivationOffsetPx();

    // At the bottom of the page the last section's top may never reach the
    // activation line, so pin it explicitly once we've scrolled to the end.
    const scroller = document.scrollingElement ?? document.documentElement;
    const atBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 4;
    if (atBottom) {
      setActive(sections[sections.length - 1]?.dataset.xwSection ?? null);
      return;
    }

    // Active section is the last one whose top has crossed the activation line.
    // Sections are in DOM (top-to-bottom) order, so we can stop at the first
    // one still below the line. This is symmetric for scrolling up and down.
    let active: HTMLElement | null = sections[0] ?? null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top - offset <= 1) active = section;
      else break;
    }

    setActive(active?.dataset.xwSection ?? null);
  };

  const queueSync = () => {
    if (raf !== 0) return;
    raf = window.requestAnimationFrame(sync);
  };

  const observe = () => {
    observer?.disconnect();
    observer = new IntersectionObserver(queueSync, {
      root: null,
      rootMargin: `-${getActivationOffsetPx()}px 0px -55% 0px`,
      threshold: [0, 0.01, 0.15, 0.35, 0.6],
    });
    sections.forEach((section) => observer?.observe(section));
    queueSync();
  };

  const onResize = () => observe();

  observe();
  window.addEventListener('resize', onResize, { passive: true });

  return () => {
    window.removeEventListener('resize', onResize);
    observer?.disconnect();
    if (raf !== 0) window.cancelAnimationFrame(raf);
  };
}

export function initTopBar(): Cleanup {
  const cleanups: Cleanup[] = [initClock(), initMobileNav(), initScrollSpy()];
  return () => cleanups.forEach((fn) => fn());
}
