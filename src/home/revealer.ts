/**
 * Section reveal animations.
 *
 * Elements marked with `data-xw-reveal` slide up and fade in the first time
 * they intersect the viewport. Gated by `prefers-reduced-motion` — reduced-
 * motion users see the final state immediately.
 */

const REVEAL_ATTR = 'data-xw-reveal';
const READY_CLASS = 'xw-reveal-ready';
const SHOWN_CLASS = 'xw-reveal-shown';

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initRevealer(): () => void {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}]`));
  if (targets.length === 0) return () => undefined;

  if (prefersReducedMotion()) {
    targets.forEach((el) => el.classList.add(READY_CLASS, SHOWN_CLASS));
    return () => undefined;
  }

  targets.forEach((el) => el.classList.add(READY_CLASS));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const delay = Number(el.dataset.xwRevealDelay ?? '0');
        window.setTimeout(() => el.classList.add(SHOWN_CLASS), delay);
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.15 },
  );

  targets.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
