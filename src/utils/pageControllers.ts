import { initSurveillanceWindows } from './surveillanceWindows';

function initAboutTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-about-tab]'));
  const panes = Array.from(document.querySelectorAll<HTMLElement>('[data-about-pane]'));

  if (tabs.length === 0 || panes.length === 0) return;

  const activate = (target: string) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.aboutTab === target;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    panes.forEach((pane) => {
      const active = pane.dataset.aboutPane === target;
      pane.classList.toggle('hidden', !active);
      if (active) {
        pane.removeAttribute('hidden');
      } else {
        pane.setAttribute('hidden', 'true');
      }
    });
  };

  const initial = tabs.find((tab) => tab.classList.contains('active'))?.dataset.aboutTab ?? tabs[0]?.dataset.aboutTab;
  if (initial) activate(initial);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.aboutTab;
      if (target) activate(target);
    });

    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;

      event.preventDefault();
      const nextIndex =
        event.key === 'ArrowRight'
          ? (index + 1) % tabs.length
          : (index - 1 + tabs.length) % tabs.length;

      const nextTab = tabs[nextIndex];
      nextTab?.focus();
      const target = nextTab?.dataset.aboutTab;
      if (target) activate(target);
    });
  });
}

function initProjectsPage(): void {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-project-card]'));
  const filterButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.filter-btn'));
  const visibleCount = document.getElementById('projects-visible-count');
  const emptyState = document.getElementById('projects-empty-state');
  const overlay = document.getElementById('project-terminal-overlay');
  const modal = document.getElementById('terminal-window');
  const closeButton = document.getElementById('close-terminal-btn');
  const modalTitle = document.getElementById('term-project-title');
  const modalKicker = document.getElementById('term-header-title');
  const modalImage = document.getElementById('term-project-img') as HTMLImageElement | null;
  const modalId = document.getElementById('term-project-id');
  const modalType = document.getElementById('term-project-type');
  const modalStatus = document.getElementById('term-project-status');
  const modalDesc = document.getElementById('term-project-desc');
  const modalTech = document.getElementById('term-project-tech');
  const modalLinks = document.getElementById('term-project-links');

  if (cards.length === 0 || !overlay || !modal || !closeButton) return;

  let lastFocusedElement: HTMLElement | null = null;

  const updateVisibleState = () => {
    const visibleCards = cards.filter((card) => !card.hasAttribute('hidden'));
    if (visibleCount) visibleCount.textContent = String(visibleCards.length);
    if (emptyState) {
      const hasVisibleCards = visibleCards.length > 0;
      emptyState.classList.toggle('hidden', hasVisibleCards);
      if (hasVisibleCards) {
        emptyState.setAttribute('hidden', 'true');
      } else {
        emptyState.removeAttribute('hidden');
      }
    }
  };

  const applyFilter = (filter: string) => {
    filterButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.filter === filter);
    });

    cards.forEach((card) => {
      const matches = filter === 'all' || card.dataset.type === filter;
      if (matches) {
        card.removeAttribute('hidden');
      } else {
        card.setAttribute('hidden', 'true');
      }
    });

    updateVisibleState();
  };

  const formatStatus = (status?: string | null) => {
    switch (status) {
      case 'in-development':
        return 'In development';
      case 'archived':
        return 'Archived';
      default:
        return 'Active';
    }
  };

  const createProjectLink = (href: string, label: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'project-detail-link';
    link.textContent = label;
    return link;
  };

  const openProject = (card: HTMLElement, trigger: HTMLElement) => {
    if (!modalTitle || !modalKicker || !modalImage || !modalId || !modalType || !modalStatus || !modalDesc || !modalTech || !modalLinks) {
      return;
    }

    modalTitle.textContent = card.dataset.title ?? 'Project';
    modalKicker.textContent = card.dataset.id ?? 'project details';
    modalImage.src = card.dataset.img ?? '/static/images/wip-default.svg';
    modalImage.alt = `${card.dataset.title ?? 'Project'} preview`;
    modalId.textContent = card.dataset.id ?? '---';
    modalType.textContent = card.dataset.type ?? '---';
    modalStatus.textContent = formatStatus(card.dataset.status);
    modalDesc.textContent = card.dataset.desc ?? '';

    modalTech.innerHTML = '';
    card.querySelectorAll('.project-tech-store span').forEach((tech) => {
      const chip = document.createElement('span');
      chip.className = 'info-chip';
      chip.textContent = tech.textContent ?? '';
      modalTech.appendChild(chip);
    });

    modalLinks.innerHTML = '';
    const github = card.dataset.github?.trim();
    const live = card.dataset.live?.trim();
    const demo = card.dataset.demoUrl?.trim();

    if (github) modalLinks.appendChild(createProjectLink(github, 'Source code'));
    if (live) {
      modalLinks.appendChild(createProjectLink(live, 'Live deployment'));
    } else if (demo) {
      modalLinks.appendChild(createProjectLink(demo, 'Demo'));
    }

    lastFocusedElement = trigger;
    overlay.classList.remove('hidden');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      modal.focus();
    });
  };

  const closeProject = () => {
    overlay.classList.remove('visible');
    document.body.classList.remove('modal-open');
    window.setTimeout(() => {
      overlay.classList.add('hidden');
      if (modalImage) modalImage.src = '';
      lastFocusedElement?.focus();
      lastFocusedElement = null;
    }, 180);
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyFilter(button.dataset.filter ?? 'all');
    });
  });

  cards.forEach((card) => {
    const openButton = card.querySelector<HTMLElement>('[data-project-open]');
    openButton?.addEventListener('click', () => openProject(card, openButton));
  });

  closeButton.addEventListener('click', closeProject);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeProject();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('visible')) {
      event.preventDefault();
      closeProject();
    }
  });

  applyFilter('all');
}

function initResumePage(): void {
  const printButton = document.querySelector<HTMLButtonElement>('[data-resume-print]');
  if (!printButton) return;

  printButton.addEventListener('click', () => {
    window.print();
  });
}

export function initPageControllers(): void {
  const template = document.body.dataset.template;
  if (!template) return;

  if (template === 'about') {
    initAboutTabs();
  }

  if (template === 'projects') {
    initProjectsPage();
  }

  if (template === 'home') {
    initSurveillanceWindows();
  }

  if (template === 'resume') {
    initResumePage();
  }
}
