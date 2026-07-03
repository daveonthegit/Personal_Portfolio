// Portfolio front-end entry. Single-page architecture — no client-side router.
import { initThemeHandler } from './utils/themeHandler';
import { initGlitchAnimations } from './utils/glitchAnimations';
import { initBootOverlay } from './home/bootOverlay';
import { initOSShell } from './os/shell';
import { initResumePdfPrint } from './home/resumePrint';
import { initTopBar } from './home/topbar';
import { initRevealer } from './home/revealer';
import { ContactFormHandler } from './components/ContactFormHandler';

async function mountPageDepth(): Promise<void> {
  // OS-desktop mode mounts these per-window via the shell instead.
  if (document.body.classList.contains('xw-os')) return;
  const page = document.body.dataset.page;
  if (page === 'home') {
    const mod = await import('./pages/dossierLive');
    mod.mountDossierLive(document.body);
  }
  if (page === 'resume') {
    const mod = await import('./pages/resumeTimeline');
    mod.mountResumeLens(document.body);
  }
}

function mountContactForm(): void {
  if (document.getElementById('contact-form')) {
    ContactFormHandler.bind();
  }
}

async function mountProjectsPanel(): Promise<void> {
  // Only /projects ships the filter/modal panel.
  if (document.body.dataset.page !== 'projects') return;
  // In desktop OS mode the shell mounts the panel inside its window instead.
  if (document.body.classList.contains('xw-os')) return;
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

  // Desktop shell (windows/dock) or Companion App (tab bar) — before anything
  // that assumes document-flow content, so page modules see the final DOM shape.
  initOSShell();

  // Keep the root scroller native on touch devices.
  initGlitchAnimations();
  initThemeHandler();

  initTopBar();
  initRevealer();
  initResumePdfPrint();
  mountContactForm();
  void mountProjectsPanel();
  void mountPageDepth();

  bindSkipLink();
});

export type { Project, ContactFormData } from './types';
