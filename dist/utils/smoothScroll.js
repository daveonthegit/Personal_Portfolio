export class SmoothScroll {
    static init() {
        // Handle smooth scrolling for anchor links
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
                e.preventDefault();
                const targetId = target.getAttribute('href')?.slice(1);
                const targetElement = targetId ? document.getElementById(targetId) : null;
                if (targetElement) {
                    this.scrollToElement(targetElement);
                }
            }
        });
    }
    static scrollToElement(element, offset = 80) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
    static scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}
//# sourceMappingURL=smoothScroll.js.map