// Main TypeScript entry point for the portfolio
import { SmoothScroll } from './utils/smoothScroll';
import { AnimationObserver } from './utils/animationObserver';
import { ContactFormHandler } from './components/ContactFormHandler';
import { initThemeHandler } from './utils/themeHandler';
import { initGlitchAnimations } from './utils/glitchAnimations';
import { initNetworkVisualization, createFloatingDataElements } from './utils/networkVisualization';

// Initialize utilities
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 CTOS Interface - Initializing...');
  
  // Initialize smooth scrolling
  SmoothScroll.init();
  
  // Initialize scroll animations
  AnimationObserver.init();
  
  // Initialize subtle loading animations
  initGlitchAnimations();
  
  // Initialize CTOS network visualization
  setTimeout(() => {
    initNetworkVisualization();
    createFloatingDataElements();
  }, 500);
  
  // Initialize contact form
  ContactFormHandler.init();
  
  // Initialize theme toggle
  initThemeHandler();
  
  console.log('✅ CTOS Interface - All systems operational');
});

// Export types for use in templates
export type { Project, ContactFormData } from './types';
