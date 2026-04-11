// Main TypeScript entry point for the portfolio
import { SmoothScroll } from './utils/smoothScroll';
import { AnimationObserver } from './utils/animationObserver';
import { initThemeHandler } from './utils/themeHandler';
import GlitchAnimationController, { initGlitchAnimations } from './utils/glitchAnimations';
import { initSpaRouter } from './spa/router';

let glitchController: GlitchAnimationController | null = null;

// Initialize utilities
document.addEventListener('DOMContentLoaded', () => {
  console.log('xiaoOS Interface — initializing');
  
  // Initialize smooth scrolling
  SmoothScroll.init();
  
  // Initialize scroll animations
  AnimationObserver.init();
  
  glitchController = initGlitchAnimations();

  initSpaRouter({
    getGlitchController: () => glitchController,
    setGlitchController: (c) => {
      glitchController = c;
    }
  });
  
  // Initialize theme toggle
  initThemeHandler();

  const hudTime = document.getElementById('hud-time');
  if (hudTime) {
    const tick = () => {
      hudTime.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    };
    tick();
    setInterval(tick, 1000);
  }
  
  const skip = document.querySelector<HTMLAnchorElement>('.xiaoos-skip-link');
  const mainEl = document.getElementById('main-content');
  if (skip && mainEl) {
    skip.addEventListener('click', () => {
      window.setTimeout(() => mainEl.focus(), 0);
    });
  }

  console.log('xiaoOS Interface — ready');
});

// Export types for use in templates
export type { Project, ContactFormData } from './types';
