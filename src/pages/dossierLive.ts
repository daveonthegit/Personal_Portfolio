/**
 * Living Dossier behaviors (CONTEXT.md: surveillance is ongoing, not archival).
 *
 * - OBSERVING timer: session duration, ticking — true value.
 * - ACTIVITY line: the Subject's latest public GitHub push — true value,
 *   fetched client-side; the row only appears when the fetch succeeds.
 * - Field-note redactions: hover/focus reveals something mundane and human.
 * - Observer Mirror: ONE contained panel reflecting the visitor's own session
 *   (client-side only — navigator/Intl; nothing transmitted, nothing stored).
 */

const GITHUB_USER = 'daveonthegit';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function relTime(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function browserName(): string {
  const ua = navigator.userAgent;
  if (/edg\//i.test(ua)) return 'Edge';
  if (/firefox\//i.test(ua)) return 'Firefox';
  if (/chrome\//i.test(ua)) return 'Chrome';
  if (/safari\//i.test(ua)) return 'Safari';
  return 'Browser';
}

export function mountDossierLive(root: HTMLElement): () => void {
  const timers: number[] = [];

  /* ── Observing timer ── */
  const timerRow = root.querySelector<HTMLElement>('[data-dossier-live]');
  const timerEl = root.querySelector<HTMLElement>('[data-obs-timer]');
  if (timerRow && timerEl) {
    const started = Date.now();
    const tick = () => {
      const s = Math.floor((Date.now() - started) / 1000);
      timerEl.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    };
    tick();
    timerRow.hidden = false;
    timers.push(window.setInterval(tick, 1000));
  }

  /* ── Latest public activity (real event or nothing) ── */
  const activityRow = root.querySelector<HTMLElement>('[data-dossier-activity]');
  const activityLine = root.querySelector<HTMLElement>('[data-activity-line]');
  if (activityRow && activityLine) {
    void fetch(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=10`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((events: Array<{ type: string; repo?: { name: string }; created_at: string }>) => {
        const push = events.find((e) => e.type === 'PushEvent' || e.type === 'CreateEvent');
        if (!push?.repo) return;
        const repo = push.repo.name.split('/')[1] ?? push.repo.name;
        activityLine.textContent = `New artifact activity — ${repo} · ${relTime(push.created_at)}`;
        activityRow.hidden = false;
      })
      .catch(() => {
        /* row stays hidden — no fake data */
      });
  }

  /* ── Redactions: hover/focus peeks, click pins ── */
  root.querySelectorAll<HTMLButtonElement>('.xw-redact').forEach((el) => {
    const covered = el.textContent ?? '';
    const secret = el.dataset.redact ?? '';
    let pinned = false;
    const show = () => {
      el.textContent = secret;
      el.classList.add('xw-redact--open');
    };
    const hide = () => {
      if (pinned) return;
      el.textContent = covered;
      el.classList.remove('xw-redact--open');
    };
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', show);
    el.addEventListener('blur', hide);
    el.addEventListener('click', () => {
      pinned = !pinned;
      if (pinned) show();
      else hide();
    });
  });

  /* ── Observer Mirror — client-side only, one panel, one wink ── */
  const mirror = root.querySelector<HTMLElement>('[data-observer]');
  if (mirror) {
    const rowsEl = mirror.querySelector<HTMLElement>('[data-observer-rows]');
    if (rowsEl) {
      const platform =
        (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
        navigator.platform ??
        '—';
      const row = (k: string, v: string, id = '') =>
        `<div class="xw-fact"><dt>${k}</dt><dd${id ? ` data-observer-${id}` : ''}>${v}</dd></div>`;
      rowsEl.innerHTML = [
        row('Observer', `${browserName()} on ${platform}`),
        row('Viewport', `${window.innerWidth} × ${window.innerHeight}`, 'viewport'),
        row('Locale', navigator.language),
        row('Local time', '—', 'clock'),
      ].join('');

      const clock = rowsEl.querySelector<HTMLElement>('[data-observer-clock]');
      if (clock) {
        const tickClock = () => {
          clock.textContent = new Date().toLocaleTimeString();
        };
        tickClock();
        timers.push(window.setInterval(tickClock, 1000));
      }
      const vp = rowsEl.querySelector<HTMLElement>('[data-observer-viewport]');
      const onResize = () => {
        if (vp) vp.textContent = `${window.innerWidth} × ${window.innerHeight}`;
      };
      window.addEventListener('resize', onResize);
      timers.push(window.setTimeout(() => undefined, 0)); // symmetry; resize removed below
      mirror.classList.add('xw-observer--on');

      return () => {
        timers.forEach((t) => window.clearInterval(t));
        window.removeEventListener('resize', onResize);
      };
    }
  }

  return () => {
    timers.forEach((t) => window.clearInterval(t));
  };
}
