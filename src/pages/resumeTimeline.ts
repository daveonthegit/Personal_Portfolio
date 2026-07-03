/**
 * Resume timeline lens — the alternate view of the Resume app.
 *
 * Renders career history as an era track from the career-ops export
 * (static/data/cv.json — see docs/adr/0001). The printable document stays the
 * default view; this is optional depth. Scrubbing the track shows which roles
 * were active at any month; records cross-link into the Projects app.
 */

interface CvExperience {
  id: string;
  company: string;
  location: string;
  role: string;
  start: string; // YYYY-MM
  end: string | null;
  bullets: string[];
}

interface CvEducation {
  institution: string;
  degree: string;
  location: string;
  end: string;
  honors: string[];
}

interface CvData {
  name: string;
  experience: CvExperience[];
  education: CvEducation[];
  skills: Array<{ category: string; items: string[] }>;
}

const monthIndex = (ym: string): number => {
  const [y, m] = ym.split('-').map(Number);
  return (y ?? 0) * 12 + ((m ?? 1) - 1);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const labelFor = (idx: number): string => `${MONTHS[idx % 12]} ${Math.floor(idx / 12)}`;

export function mountResumeLens(root: HTMLElement): () => void {
  const buttons = root.querySelectorAll<HTMLButtonElement>('.lens-btn');
  const pane = root.querySelector<HTMLElement>('[data-cv-timeline]');
  const grid = root.querySelector<HTMLElement>('.xw-resume-grid');
  if (buttons.length === 0 || !pane || !grid) return () => undefined;

  let built = false;
  let scrubDispose: (() => void) | null = null;

  const build = async (): Promise<void> => {
    if (built) return;
    built = true;
    try {
      const res = await fetch('/static/data/cv.json', { credentials: 'same-origin' });
      if (!res.ok) throw new Error(String(res.status));
      const cv = (await res.json()) as CvData;
      render(cv);
    } catch {
      pane.innerHTML =
        '<p class="xw-caps xw-caps--muted">Timeline data unavailable — the document view has everything.</p>';
    }
  };

  const render = (cv: CvData): void => {
    const now = new Date();
    const nowIdx = now.getFullYear() * 12 + now.getMonth();
    const starts = cv.experience.map((e) => monthIndex(e.start));
    // Axis hugs the roles (12mo lead-in); education pins clamp into range so
    // the track isn't mostly empty years.
    const axisStart = Math.min(...starts) - 12;
    const axisEnd = nowIdx + 2;
    const span = axisEnd - axisStart;
    const pos = (idx: number) => ((idx - axisStart) / span) * 100;

    // Year gridlines
    const firstYear = Math.ceil(axisStart / 12);
    const years: string[] = [];
    for (let y = firstYear; y * 12 <= axisEnd; y++) {
      years.push(
        `<span class="xw-cvtl-year" style="left:${pos(y * 12).toFixed(2)}%"><i></i>${y}</span>`,
      );
    }

    const rows = cv.experience
      .map((e) => {
        const s = monthIndex(e.start);
        const en = e.end ? monthIndex(e.end) : nowIdx;
        const ongoing = e.end === null;
        return `
        <div class="xw-cvtl-row" data-start="${s}" data-end="${en}">
          <button type="button" class="xw-cvtl-bar${ongoing ? ' xw-cvtl-bar--ongoing' : ''}"
                  style="left:${pos(s).toFixed(2)}%;width:${Math.max(2.5, pos(en) - pos(s)).toFixed(2)}%"
                  data-cvtl-open="${e.id}">
            <span class="xw-cvtl-bar-role">${e.role}</span>
            <span class="xw-cvtl-bar-org">${e.company}${ongoing ? ' · ongoing' : ''}</span>
          </button>
        </div>`;
      })
      .join('');

    const eduMarks = cv.education
      .map((ed) => {
        const idx = Math.min(Math.max(monthIndex(ed.end), axisStart), axisEnd - 1);
        return `
        <div class="xw-cvtl-edu" style="left:${pos(idx).toFixed(2)}%">
          <span class="xw-cvtl-edu-pin" aria-hidden="true"></span>
          <span class="xw-cvtl-edu-label">${ed.degree} — ${ed.institution}</span>
        </div>`;
      })
      .join('');

    const details = cv.experience
      .map(
        (e) => `
        <article class="xw-cvtl-detail hidden" data-cvtl-detail="${e.id}">
          <h3 class="xw-cvtl-detail-title">${e.role} <span class="xw-timeline-at">at ${e.company}</span></h3>
          <p class="xw-caps xw-caps--muted">${e.location} · ${e.start}${e.end ? ` — ${e.end}` : ' — present'}</p>
          <ul class="xw-timeline-bullets" role="list">${e.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
        </article>`,
      )
      .join('');

    const skills = cv.skills
      .map(
        (s) => `
        <div class="xw-skill-block">
          <span class="xw-caps xw-caps--muted xw-skill-cat">${s.category}</span>
          <ul class="xw-skill-items" role="list">${s.items.map((i) => `<li class="xw-skill-item">${i}</li>`).join('')}</ul>
        </div>`,
      )
      .join('');

    pane.innerHTML = `
      <p class="xw-caps xw-caps--muted xw-cvtl-hint">Subject history — reconstructed from verified records · generated from the career data export</p>
      <div class="xw-cvtl-track" data-cvtl-track>
        <div class="xw-cvtl-years">${years.join('')}</div>
        ${rows}
        ${eduMarks}
        <span class="xw-cvtl-scrub" data-cvtl-scrub hidden><i class="xw-cvtl-scrub-label" data-cvtl-scrub-label></i></span>
      </div>
      <div class="xw-cvtl-details">${details}</div>
      <p class="xw-cvtl-foot">
        <a href="/projects" class="xw-link">Open the evidence records<span aria-hidden="true"> →</span></a>
      </p>`;

    // Bar click → detail card
    pane.querySelectorAll<HTMLElement>('[data-cvtl-open]').forEach((bar) => {
      bar.addEventListener('click', () => {
        const id = bar.dataset.cvtlOpen;
        pane.querySelectorAll<HTMLElement>('[data-cvtl-detail]').forEach((d) => {
          d.classList.toggle('hidden', d.dataset.cvtlDetail !== id);
        });
      });
    });
    // First detail open by default
    pane.querySelector<HTMLElement>('[data-cvtl-detail]')?.classList.remove('hidden');

    // Scrub: pointer over the track shows the month + lights active bars.
    const track = pane.querySelector<HTMLElement>('[data-cvtl-track]');
    const scrub = pane.querySelector<HTMLElement>('[data-cvtl-scrub]');
    const scrubLabel = pane.querySelector<HTMLElement>('[data-cvtl-scrub-label]');
    if (track && scrub && scrubLabel) {
      const onMove = (e: PointerEvent) => {
        const r = track.getBoundingClientRect();
        const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const idx = Math.floor(axisStart + frac * span);
        scrub.hidden = false;
        scrub.style.left = `${(frac * 100).toFixed(2)}%`;
        scrubLabel.textContent = labelFor(idx);
        track.querySelectorAll<HTMLElement>('.xw-cvtl-row').forEach((row) => {
          const s = Number(row.dataset.start);
          const en = Number(row.dataset.end);
          row.classList.toggle('xw-cvtl-row--active', idx >= s && idx <= en);
        });
      };
      const onLeave = () => {
        scrub.hidden = true;
        track.querySelectorAll('.xw-cvtl-row--active').forEach((r) => r.classList.remove('xw-cvtl-row--active'));
      };
      track.addEventListener('pointermove', onMove);
      track.addEventListener('pointerleave', onLeave);
      scrubDispose = () => {
        track.removeEventListener('pointermove', onMove);
        track.removeEventListener('pointerleave', onLeave);
      };
    }

    pane.appendChild(document.createElement('div')).className = 'xw-cvtl-skills-wrap';
    const wrap = pane.lastElementChild as HTMLElement;
    wrap.innerHTML = `<p class="xw-caps xw-caps--muted">Signatures on record</p><div class="xw-hero-skills xw-cvtl-skills">${skills}</div>`;
  };

  const setLens = (lens: string) => {
    buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.lens === lens));
    const timeline = lens === 'timeline';
    if (timeline) void build();
    pane.classList.toggle('hidden', !timeline);
    grid.classList.toggle('hidden', timeline);
  };

  const disposers: (() => void)[] = [];
  buttons.forEach((b) => {
    const onClick = () => setLens(b.dataset.lens ?? 'document');
    b.addEventListener('click', onClick);
    disposers.push(() => b.removeEventListener('click', onClick));
  });

  return () => {
    disposers.forEach((d) => d());
    scrubDispose?.();
  };
}
