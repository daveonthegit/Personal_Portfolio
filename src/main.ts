// Portfolio front-end entry. Single-page architecture — no client-side router.
import { initThemeHandler } from './utils/themeHandler';
import { initGlitchAnimations } from './utils/glitchAnimations';
import { initBootOverlay } from './home/bootOverlay';
import { initResumePdfPrint } from './home/resumePrint';
import { initTopBar } from './home/topbar';
import { initRevealer } from './home/revealer';
import { ContactFormHandler } from './components/ContactFormHandler';

function mountContactForm(): void {
  if (document.getElementById('contact-form')) {
    ContactFormHandler.bind();
  }
}

async function mountProjectsPanel(): Promise<void> {
  // Only /projects ships the filter/modal panel.
  if (document.body.dataset.page !== 'projects') return;
  const root =
    document.querySelector<HTMLElement>('[data-projects-root]') ??
    document.getElementById('main-content');
  if (!root) return;
  try {
    const mod = await import('./pages/projectsPanel');
    mod.mountProjectsPage(root);
  } catch (error) {
    console.error('projectsPanel: failed to load', error);
  }
}

function bindSkipLink(): void {
  const skip = document.querySelector<HTMLAnchorElement>('.xiaoos-skip-link');
  const mainEl = document.getElementById('main-content');
  if (!skip || !mainEl) return;
  skip.addEventListener('click', () => {
    window.setTimeout(() => mainEl.focus(), 0);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initBootOverlay();

  // Keep the root scroller native on touch devices.
  initGlitchAnimations();
  initThemeHandler();

  initTopBar();
  initRevealer();
  initResumePdfPrint();
  mountContactForm();
  void mountProjectsPanel();

  bindSkipLink();
});

export type { Project, ContactFormData } from './types';
