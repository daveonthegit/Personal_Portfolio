/**
 * Section reveal animations.
 *
 * Elements marked with `data-xw-reveal` slide up and fade in when they intersect
 * the viewport. Leaving the viewport removes `xw-reveal-shown` so scrolling back
 * retriggers the transition — on all viewport widths.
 */

const REVEAL_ATTR = 'data-xw-reveal';
const READY_CLASS = 'xw-reveal-ready';
const SHOWN_CLASS = 'xw-reveal-shown';

const revealTimers = new WeakMap<HTMLElement, number>();

function initReplayRevealer(targets: HTMLElement[]): () => void {
  const scheduleShow = (el: HTMLElement) => {
    const prev = revealTimers.get(el);
    if (prev !== undefined) {
      window.clearTimeout(prev);
    }
    const delay = Number(el.dataset.xwRevealDelay ?? '0');
    const id = window.setTimeout(() => {
      revealTimers.delete(el);
      el.classList.add(SHOWN_CLASS);
    }, delay);
    revealTimers.set(el, id);
  };

  const hide = (el: HTMLElement) => {
    const prev = revealTimers.get(el);
    if (prev !== undefined) {
      window.clearTimeout(prev);
      revealTimers.delete(el);
    }
    el.classList.remove(SHOWN_CLASS);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          scheduleShow(el);
        } else {
          hide(el);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: [0, 0.05, 0.1] },
  );

  targets.forEach((el) => io.observe(el));
  return () => {
    targets.forEach((el) => {
      hide(el);
      io.unobserve(el);
    });
    io.disconnect();
  };
}

export function initRevealer(): () => void {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}]`));
  if (targets.length === 0) return () => undefined;

  targets.forEach((el) => el.classList.add(READY_CLASS));

  return initReplayRevealer(targets);
}
