// Main TypeScript entry point for the portfolio
import { SmoothScroll } from './utils/smoothScroll';
import { AnimationObserver } from './utils/animationObserver';
import { ContactFormHandler } from './components/ContactFormHandler';
import { ThemeHandler } from './components/ThemeHandler';

// Initialize utilities
document.addEventListener('DOMContentLoaded', () => {
  // Initialize smooth scrolling
  SmoothScroll.init();
  
  // Initialize scroll animations
  AnimationObserver.init();
  
  // Initialize contact form
  ContactFormHandler.init();
  
  // Initialize theme toggle
  ThemeHandler.init();
  
  console.log('Portfolio frontend initialized with TypeScript!');
});

// Export types for use in templates
export type { Project, ContactFormData } from './types';
