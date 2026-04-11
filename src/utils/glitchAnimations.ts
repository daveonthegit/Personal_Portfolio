/**
 * Glitch Animation Controller
 * Handles intersection observer and glitch effects for cards
 */

interface GlitchOptions {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  staggerDelay?: number;
}

class GlitchAnimationController {
  private observer: IntersectionObserver | null = null;
  private animatedElements = new Set<Element>();

  constructor(private options: GlitchOptions = {}) {
    this.options = {
      threshold: 0.1,
      rootMargin: '50px 0px',
      delay: 0,
      staggerDelay: 150,
      ...options
    };

    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: this.options.threshold ?? 0.1,
        rootMargin: this.options.rootMargin ?? '50px 0px'
      }
    );

    this.observeElements();
    this.setupHoverEffects();
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
        this.triggerGlitchLoad(entry.target as HTMLElement, index);
        this.animatedElements.add(entry.target);
      }
    });
  }

  private triggerGlitchLoad(_element: HTMLElement, _index: number): void {
    // No loading animations - elements appear immediately
    return;
  }

  private observeElements(): void {
    if (!this.observer) return;

    // Observe all card elements
    const cardSelectors = [
      '.skill-card',
      '.project-card',
      '.nexus-profile-card',
      '.nexus-panel',
      '.status-item'
    ];

    cardSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        this.observer!.observe(element);
      });
    });
  }

  private setupHoverEffects(): void {
    // No loading animations for titles - they appear immediately
    return;
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.animatedElements.clear();
  }
}

// Terminal-style loading effect
export function createTerminalLoader(container: HTMLElement, messages: string[]): Promise<void> {
  return new Promise((resolve) => {
    const terminal = document.createElement('div');
    terminal.className = 'xiaoos-terminal';
    terminal.style.opacity = '0';
    container.appendChild(terminal);

    // Fade in terminal
    setTimeout(() => {
      terminal.style.transition = 'opacity 0.3s ease';
      terminal.style.opacity = '1';
    }, 100);

    let messageIndex = 0;
    const typeMessage = () => {
      if (messageIndex >= messages.length) {
        setTimeout(() => {
          terminal.style.opacity = '0';
          setTimeout(() => {
            container.removeChild(terminal);
            resolve();
          }, 300);
        }, 1000);
        return;
      }

      const line = document.createElement('div');
      line.className = 'terminal-line';
      terminal.appendChild(line);

      const message = messages[messageIndex];
      if (!message) return;
      
      let charIndex = 0;

      const typeChar = () => {
        if (charIndex < message.length) {
          line.textContent += message[charIndex];
          charIndex++;
          setTimeout(typeChar, 30 + Math.random() * 20);
        } else {
          messageIndex++;
          setTimeout(typeMessage, 500);
        }
      };

      typeChar();
    };

    typeMessage();
  });
}

/** Deprecated: gimmick “corruption” undermined trust; kept as no-op for API compatibility. */
export function createDataCorruption(_element: HTMLElement, _duration: number = 2000): void {
  return;
}

// Initialize subtle loading animations when DOM is ready
export function initGlitchAnimations(): GlitchAnimationController {
  const controller = new GlitchAnimationController({
    threshold: 0.15,
    rootMargin: '30px 0px',
    delay: 100,
    staggerDelay: 50
  });

  return controller;
}

export default GlitchAnimationController;
