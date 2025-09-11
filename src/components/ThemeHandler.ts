export class ThemeHandler {
  private static isDark = false;
  private static toggleButton: HTMLButtonElement | null = null;

  static init() {
    this.toggleButton = document.getElementById('theme-toggle') as HTMLButtonElement;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    this.applyTheme();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.isDark = e.matches;
        this.applyTheme();
      }
    });

    // Add click listener to toggle button
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', this.toggle.bind(this));
    }
  }

  private static toggle() {
    this.isDark = !this.isDark;
    this.applyTheme();
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  private static applyTheme() {
    if (this.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update toggle button text/icon if it exists
    if (this.toggleButton) {
      this.toggleButton.textContent = this.isDark ? '☀️' : '🌙';
      this.toggleButton.setAttribute('aria-label', this.isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }
}
