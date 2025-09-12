/**
 * Glitch Animation Controller
 * Handles intersection observer and glitch effects for cards
 */
class GlitchAnimationController {
    constructor(options = {}) {
        this.options = options;
        this.observer = null;
        this.animatedElements = new Set();
        this.options = {
            threshold: 0.1,
            rootMargin: '50px 0px',
            delay: 0,
            staggerDelay: 150,
            ...options
        };
        this.init();
    }
    init() {
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            return;
        }
        this.observer = new IntersectionObserver((entries) => this.handleIntersection(entries), {
            threshold: this.options.threshold ?? 0.1,
            rootMargin: this.options.rootMargin ?? '50px 0px'
        });
        this.observeElements();
        this.setupHoverEffects();
    }
    handleIntersection(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                this.triggerGlitchLoad(entry.target, index);
                this.animatedElements.add(entry.target);
            }
        });
    }
    triggerGlitchLoad(element, index) {
        const delay = this.options.delay + (index * this.options.staggerDelay);
        setTimeout(() => {
            // Add subtle loading animation
            element.classList.add('ctos-load');
            // Add hover effects after animation completes
            setTimeout(() => {
                element.classList.add('ctos-hover');
            }, 800);
        }, delay);
    }
    observeElements() {
        if (!this.observer)
            return;
        // Observe all card elements
        const cardSelectors = [
            '.skill-card',
            '.project-card',
            '.ctos-profile-card',
            '.ctos-panel',
            '.status-item'
        ];
        cardSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.observer.observe(element);
            });
        });
    }
    setupHoverEffects() {
        // Simple fade-in effects for titles
        const titles = document.querySelectorAll('.project-title, .section-title, .ctos-title');
        titles.forEach((title, index) => {
            setTimeout(() => {
                title.classList.add('fade-in-up');
            }, index * 100);
        });
    }
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.animatedElements.clear();
    }
}
// Terminal-style loading effect
export function createTerminalLoader(container, messages) {
    return new Promise((resolve) => {
        const terminal = document.createElement('div');
        terminal.className = 'ctos-terminal';
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
            if (!message)
                return;
            let charIndex = 0;
            const typeChar = () => {
                if (charIndex < message.length) {
                    line.textContent += message[charIndex];
                    charIndex++;
                    setTimeout(typeChar, 30 + Math.random() * 20);
                }
                else {
                    messageIndex++;
                    setTimeout(typeMessage, 500);
                }
            };
            typeChar();
        };
        typeMessage();
    });
}
// Data corruption effect
export function createDataCorruption(element, duration = 2000) {
    const originalText = element.textContent || '';
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    let currentText = originalText;
    const interval = setInterval(() => {
        if (Math.random() < 0.3) {
            const randomIndex = Math.floor(Math.random() * currentText.length);
            const randomChar = chars[Math.floor(Math.random() * chars.length)];
            currentText = currentText.substring(0, randomIndex) + randomChar + currentText.substring(randomIndex + 1);
            element.textContent = currentText;
        }
    }, 50);
    setTimeout(() => {
        clearInterval(interval);
        element.textContent = originalText;
    }, duration);
}
// Initialize subtle loading animations when DOM is ready
export function initGlitchAnimations() {
    const controller = new GlitchAnimationController({
        threshold: 0.15,
        rootMargin: '30px 0px',
        delay: 100,
        staggerDelay: 50
    });
    return controller;
}
export default GlitchAnimationController;
//# sourceMappingURL=glitchAnimations.js.map