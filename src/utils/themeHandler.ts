/**
 * Theme Handler
 * Manages light/dark mode switching
 */

class ThemeHandler {
  private currentTheme: 'light' | 'dark' = 'dark';
  private themeToggle: HTMLElement | null = null;
  private mobileThemeToggle: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // Get saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      // Default to dark mode
      this.currentTheme = 'dark';
    }

    // Apply initial theme
    this.applyTheme();

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Desktop theme toggle
    this.themeToggle = document.getElementById('theme-toggle');
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Mobile theme toggle
    this.mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    if (this.mobileThemeToggle) {
      this.mobileThemeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.currentTheme = e.matches ? 'light' : 'dark';
          this.applyTheme();
        }
      });
    }
  }

  private toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    localStorage.setItem('theme', this.currentTheme);
  }

  private applyTheme(): void {
    const html = document.documentElement;
    
    if (this.currentTheme === 'light') {
      html.classList.add('light-mode');
    } else {
      html.classList.remove('light-mode');
    }

    // Update theme icons
    this.updateThemeIcons();
  }

  private updateThemeIcons(): void {
    const darkIcons = document.querySelectorAll('.theme-icon-dark');
    const lightIcons = document.querySelectorAll('.theme-icon-light');

    darkIcons.forEach(icon => {
      if (this.currentTheme === 'dark') {
        icon.classList.remove('opacity-0');
        icon.classList.add('opacity-100');
      } else {
        icon.classList.remove('opacity-100');
        icon.classList.add('opacity-0');
      }
    });

    lightIcons.forEach(icon => {
      if (this.currentTheme === 'light') {
        icon.classList.remove('opacity-0');
        icon.classList.add('opacity-100');
      } else {
        icon.classList.remove('opacity-100');
        icon.classList.add('opacity-0');
      }
    });
  }

  public getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }
}

// Initialize theme handler when DOM is loaded
export function initThemeHandler(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new ThemeHandler();
    });
  } else {
    new ThemeHandler();
  }
}
