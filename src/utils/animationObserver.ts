export class AnimationObserver {
  private static observer: IntersectionObserver;

  static init() {
    // Create intersection observer for scroll animations
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            entry.target.classList.remove('animate-out');
          } else {
            entry.target.classList.remove('animate-in');
            entry.target.classList.add('animate-out');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observe all elements with the 'animate-on-scroll' class
    this.observeElements();
    
    // Re-observe elements when DOM changes (useful for dynamic content)
    this.setupMutationObserver();
  }

  static observeElements() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => {
      this.observer.observe(el);
    });
  }

  static setupMutationObserver() {
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if the added element should be observed
            if (element.classList.contains('animate-on-scroll')) {
              this.observer.observe(element);
            }
            
            // Check for child elements that should be observed
            const childElements = element.querySelectorAll('.animate-on-scroll');
            childElements.forEach((child) => {
              this.observer.observe(child);
            });
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  static disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
