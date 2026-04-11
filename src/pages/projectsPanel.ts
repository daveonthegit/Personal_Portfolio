/**
 * Projects grid filters + project detail modal (ported from former inline template script).
 */

export function mountProjectsPage(root: HTMLElement): () => void {
  const filterButtons = root.querySelectorAll<HTMLButtonElement>('.filter-btn');
  const projectCards = root.querySelectorAll<HTMLElement>('.project-card');

  const overlay = root.querySelector<HTMLElement>('#project-terminal-overlay');
  const terminalWindow = root.querySelector<HTMLElement>('#terminal-window');
  const closeBtn = root.querySelector<HTMLButtonElement>('#close-terminal-btn');
  const contentArea = root.querySelector<HTMLElement>('#term-content-area');
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
    !terminalWindow ||
    !closeBtn ||
    !contentArea ||
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

  let lastFocus: Element | null = null;

  const closeTerminal = () => {
    contentArea.classList.add('opacity-0');
    overlay.classList.add('opacity-0');
    terminalWindow.classList.remove('scale-100');
    terminalWindow.classList.add('scale-95');
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
    closeTerminal();
  };
  document.addEventListener('keydown', onEscape);

  const filterDisposers: (() => void)[] = [];
  filterButtons.forEach((button) => {
    const onFilterClick = () => {
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      const filter = button.getAttribute('data-filter');
      projectCards.forEach((card) => {
        const cardType = card.getAttribute('data-type');
        card.style.display = filter === 'all' || cardType === filter ? '' : 'none';
      });
    };
    button.addEventListener('click', onFilterClick);
    filterDisposers.push(() => button.removeEventListener('click', onFilterClick));
  });

  const cardDisposers: (() => void)[] = [];
  projectCards.forEach((card) => {
    const onCardClick = (e: MouseEvent) => {
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
      termType.textContent = (type || '—').toUpperCase();
      termStatus.textContent =
        status === 'active' ? 'ACTIVE' : status === 'in-development' ? 'IN DEV' : 'DEPLOYED';
      termStatus.className = 'project-modal__meta-value project-modal__meta-value--status';
      if (status === 'active') {
        termStatus.classList.add('project-modal__status--active');
      } else if (status === 'in-development') {
        termStatus.classList.add('project-modal__status--dev');
      } else {
        termStatus.classList.add('project-modal__status--neutral');
      }
      termCmdTarget.textContent = `mod_${categoryId}`;
      termHeaderTitle.textContent = `Registry · ${categoryId}`;
      if (termImgCaption) {
        termImgCaption.textContent = categoryId.replace(/-/g, ' · ');
      }

      termTech.innerHTML = '';
      if (techStore) {
        techStore.querySelectorAll('span').forEach((span) => {
          const el = document.createElement('span');
          el.className = 'project-modal__tech-tag';
          el.textContent = span.textContent;
          termTech.appendChild(el);
        });
      }

      termLinks.innerHTML = '';
      if (githubUrl) {
        termLinks.innerHTML += `<a href="${githubUrl}" target="_blank" rel="noopener noreferrer" class="project-modal__link"><span class="project-modal__link-label">Source code</span><span class="material-symbols-outlined project-modal__link-icon" aria-hidden="true">code</span></a>`;
      }
      if (liveUrl || demoUrl) {
        const targetUrl = liveUrl || demoUrl;
        const label = liveUrl ? 'Live deployment' : 'Run demo';
        const icon = liveUrl ? 'public' : 'play_arrow';
        termLinks.innerHTML += `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="project-modal__link"><span class="project-modal__link-label">${label}</span><span class="material-symbols-outlined project-modal__link-icon" aria-hidden="true">${icon}</span></a>`;
      }

      lastFocus = document.activeElement;
      overlay.classList.remove('hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.classList.remove('opacity-0');
          terminalWindow.classList.remove('scale-95');
          terminalWindow.classList.add('scale-100');
          contentArea.classList.remove('opacity-0');
          closeBtn.focus();
        });
      });
    };
    card.addEventListener('click', onCardClick);
    cardDisposers.push(() => card.removeEventListener('click', onCardClick));
  });

  const onCloseClick = () => closeTerminal();
  closeBtn.addEventListener('click', onCloseClick);

  const onOverlayClick = (e: MouseEvent) => {
    if (e.target === overlay) closeTerminal();
  };
  overlay.addEventListener('click', onOverlayClick);

  return () => {
    document.removeEventListener('keydown', onEscape);
    filterDisposers.forEach((d) => d());
    cardDisposers.forEach((d) => d());
    closeBtn.removeEventListener('click', onCloseClick);
    overlay.removeEventListener('click', onOverlayClick);
  };
}
