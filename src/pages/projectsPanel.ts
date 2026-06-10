/**
 * Projects page controller — filters, year-group scroll-spy, and detail modal.
 *
 * The template exposes a stable DOM contract this module relies on:
 *   - `.filter-btn[data-filter]`    : type filters (first one is `all`)
 *   - `.xw-year-group[data-year]`   : year sections that should hide when empty
 *   - `.project-card[data-type]`    : individual project cards
 *   - `.project-data-store`/`tech`  : hidden data stores read when opening the modal
 *   - `#project-terminal-overlay` + friends : modal scaffolding
 */

export function mountProjectsPage(root: HTMLElement): () => void {
  const filterButtons = root.querySelectorAll<HTMLButtonElement>('.filter-btn');
  const projectCards = root.querySelectorAll<HTMLElement>('.project-card');
  const yearGroups = root.querySelectorAll<HTMLElement>('.xw-year-group');
  const yearTicks = root.querySelectorAll<HTMLAnchorElement>('.xw-year-tick');
  const featuredSection = root.querySelector<HTMLElement>('.xw-featured-projects');

  const overlay = root.querySelector<HTMLElement>('#project-terminal-overlay');
  const modalEl = root.querySelector<HTMLElement>('#terminal-window');
  const closeBtn = root.querySelector<HTMLButtonElement>('#close-terminal-btn');
  const termTitle = root.querySelector<HTMLElement>('#term-project-title');
  const termDesc = root.querySelector<HTMLElement>('#term-project-desc');
  const termImg = root.querySelector<HTMLImageElement>('#term-project-img');
  const termTech = root.querySelector<HTMLElement>('#term-project-tech');
  const termId = root.querySelector<HTMLElement>('#term-project-id');
  const termType = root.querySelector<HTMLElement>('#term-project-type');
  const termStatus = root.querySelector<HTMLElement>('#term-project-status');
  const termLinks = root.querySelector<HTMLElement>('#term-project-links');
  const termCmdTarget = root.querySelector<HTMLElement>('#term-cmd-target');
  const termHeaderTitle = root.querySelector<HTMLElement>('#term-header-title');
  const termImgCaption = root.querySelector<HTMLElement>('#term-img-id');

  if (
    !overlay ||
    !modalEl ||
    !closeBtn ||
    !termTitle ||
    !termDesc ||
    !termImg ||
    !termTech ||
    !termId ||
    !termType ||
    !termStatus ||
    !termLinks ||
    !termCmdTarget ||
    !termHeaderTitle
  ) {
    return () => undefined;
  }

  /* ──────────────────────────────── filters ──────────────────────────────── */

  const applyFilter = (filter: string) => {
    projectCards.forEach((card) => {
      const type = card.getAttribute('data-type');
      card.style.display = filter === 'all' || type === filter ? '' : 'none';
    });
    // Collapse year groups that have no visible cards so headers don't leave orphans.
    yearGroups.forEach((group) => {
      const anyVisible = Array.from(
        group.querySelectorAll<HTMLElement>('.project-card'),
      ).some((c) => c.style.display !== 'none');
      group.style.display = anyVisible ? '' : 'none';
    });
    // Year strip ticks should mirror visibility of their matching group.
    yearTicks.forEach((tick) => {
      const year = tick.getAttribute('data-year');
      const group = root.querySelector<HTMLElement>(
        `.xw-year-group[data-year="${year}"]`,
      );
      tick.style.display = group && group.style.display !== 'none' ? '' : 'none';
    });
    if (featuredSection) {
      const anyFeaturedVisible = Array.from(
        featuredSection.querySelectorAll<HTMLElement>('.project-card'),
      ).some((c) => c.style.display !== 'none');
      featuredSection.style.display = anyFeaturedVisible ? '' : 'none';
    }
  };

  const filterDisposers: (() => void)[] = [];
  filterButtons.forEach((button) => {
    const onClick = () => {
      filterButtons.forEach((b) => b.classList.remove('is-active'));
      button.classList.add('is-active');
      applyFilter(button.getAttribute('data-filter') ?? 'all');
    };
    button.addEventListener('click', onClick);
    filterDisposers.push(() => button.removeEventListener('click', onClick));
  });

  /* ───────────────────────── year-strip scroll-spy ───────────────────────── */

  let spyObserver: IntersectionObserver | null = null;
  if (yearGroups.length > 0 && yearTicks.length > 0 && 'IntersectionObserver' in window) {
    const setActiveTick = (year: string) => {
      yearTicks.forEach((tick) => {
        tick.classList.toggle('is-active', tick.getAttribute('data-year') === year);
      });
    };
    spyObserver = new IntersectionObserver(
      (entries) => {
        // Pick the entry nearest the top of the viewport among currently intersecting groups.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = visible[0];
        if (!first) return;
        const year = (first.target as HTMLElement).getAttribute('data-year');
        if (year) setActiveTick(year);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );
    yearGroups.forEach((g) => spyObserver?.observe(g));
  }

  /* ────────────────────────────── modal open/close ───────────────────────── */

  let lastFocus: Element | null = null;

  const showModal = () => {
    overlay.classList.remove('hidden');
    // Force reflow before toggling the open class so the transition plays.
    void overlay.offsetWidth;
    overlay.classList.add('is-open');
  };

  const closeModal = () => {
    overlay.classList.remove('is-open');
    window.setTimeout(() => {
      overlay.classList.add('hidden');
      termImg.src = '';
      if (lastFocus && typeof (lastFocus as HTMLElement).focus === 'function') {
        (lastFocus as HTMLElement).focus();
      }
      lastFocus = null;
    }, 180);
  };

  const onEscape = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (overlay.classList.contains('hidden')) return;
    e.preventDefault();
    closeModal();
  };
  document.addEventListener('keydown', onEscape);

  /* ─────────────────────────────── card clicks ───────────────────────────── */

  const cardDisposers: (() => void)[] = [];
  projectCards.forEach((card) => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('a')) return;

      const dataStore = card.querySelector('.project-data-store');
      const techStore = card.querySelector('.project-tech-store');
      if (!dataStore) return;

      const categoryId = card.getAttribute('data-category') ?? '';
      const type = card.getAttribute('data-type');
      const status = card.getAttribute('data-status');
      const title = dataStore.getAttribute('data-title') ?? '';
      const desc = dataStore.getAttribute('data-desc') ?? '';
      const imgUrl = dataStore.getAttribute('data-img') ?? '';
      const githubUrl = dataStore.getAttribute('data-github');
      const liveUrl = dataStore.getAttribute('data-live');
      const demoUrl = dataStore.getAttribute('data-demo-url');

      termTitle.textContent = title;
      termDesc.textContent = desc;
      termImg.src = imgUrl;
      termImg.alt = title ? `${title} preview` : 'Project preview';
      termId.textContent = categoryId;
      termType.textContent = type ?? '—';

      const statusLabel =
        status === 'active' ? 'Live' : status === 'in-development' ? 'In development' : 'Archived';
      termStatus.textContent = statusLabel;
      termStatus.className = 'xw-modal-status';
      termStatus.classList.add(
        status === 'active'
          ? 'xw-modal-status--live'
          : status === 'in-development'
            ? 'xw-modal-status--dev'
            : 'xw-modal-status--muted',
      );

      termCmdTarget.textContent = `mod_${categoryId}`;
      termHeaderTitle.textContent = `Registry · ${categoryId}`;
      if (termImgCaption) {
        termImgCaption.textContent = categoryId.replace(/-/g, ' · ');
      }

      termTech.innerHTML = '';
      if (techStore) {
        techStore.querySelectorAll('span').forEach((span) => {
          const el = document.createElement('span');
          el.className = 'xw-modal-tech-tag';
          el.textContent = span.textContent;
          termTech.appendChild(el);
        });
      }

      termLinks.innerHTML = '';
      if (githubUrl) {
        const a = document.createElement('a');
        a.href = githubUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'xw-modal-link';
        a.innerHTML = '<span>Source code</span><span aria-hidden="true">→</span>';
        termLinks.appendChild(a);
      }
      if (liveUrl || demoUrl) {
        const href = (liveUrl || demoUrl) ?? '';
        const label = liveUrl ? 'Live deployment' : 'Run demo';
        const a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'xw-modal-link xw-modal-link--accent';
        a.innerHTML = `<span>${label}</span><span aria-hidden="true">→</span>`;
        termLinks.appendChild(a);
      }

      lastFocus = document.activeElement;
      showModal();
      requestAnimationFrame(() => closeBtn.focus());
    };
    card.addEventListener('click', onClick);
    cardDisposers.push(() => card.removeEventListener('click', onClick));
  });

  const onCloseClick = () => closeModal();
  closeBtn.addEventListener('click', onCloseClick);

  const onOverlayClick = (e: MouseEvent) => {
    if (e.target === overlay) closeModal();
  };
  overlay.addEventListener('click', onOverlayClick);

  // Initial filter state: everything visible.
  applyFilter('all');

  return () => {
    document.removeEventListener('keydown', onEscape);
    filterDisposers.forEach((d) => d());
    cardDisposers.forEach((d) => d());
    closeBtn.removeEventListener('click', onCloseClick);
    overlay.removeEventListener('click', onOverlayClick);
    spyObserver?.disconnect();
  };
}
