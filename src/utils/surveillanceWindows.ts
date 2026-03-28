const ambientWindows = [
  {
    title: 'Projects',
    lines: ['Live builds', 'Hosted demos', 'Recent updates'],
    className: 'ambient-window ambient-window-a',
  },
  {
    title: 'Contact',
    lines: ['Response in 24h', 'Email available', 'NYC based'],
    className: 'ambient-window ambient-window-b',
  },
  {
    title: 'Stack',
    lines: ['Go', 'TypeScript', 'React'],
    className: 'ambient-window ambient-window-c',
  },
];

export function initSurveillanceWindows(): void {
  const template = document.body.dataset.template;
  if (template !== 'home') return;

  const layer = document.querySelector<HTMLElement>('.home-ambient-layer');
  if (!layer || layer.childElementCount > 0) return;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const windowsToRender = prefersReducedMotion ? ambientWindows.slice(0, 2) : ambientWindows;

  windowsToRender.forEach((item) => {
    const panel = document.createElement('section');
    panel.className = item.className;
    panel.setAttribute('aria-hidden', 'true');

    const title = document.createElement('div');
    title.className = 'ambient-window-title';
    title.textContent = item.title;
    panel.appendChild(title);

    const list = document.createElement('div');
    list.className = 'ambient-window-list';
    item.lines.forEach((line) => {
      const row = document.createElement('div');
      row.className = 'ambient-window-line';
      row.textContent = line;
      list.appendChild(row);
    });

    panel.appendChild(list);
    layer.appendChild(panel);
  });

  if (prefersReducedMotion) {
    layer.classList.add('home-ambient-layer-static');
  }
}
