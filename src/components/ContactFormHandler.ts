import type { ContactFormData } from '../types';

export class ContactFormHandler {
  private static form: HTMLFormElement | null = null;
  private static submitButton: HTMLButtonElement | null = null;
  private static messageContainer: HTMLElement | null = null;
  private static boundSubmit: ((e: Event) => void) | null = null;

  /** Bind to #contact-form if present (initial load or SPA navigation to contact). */
  static bind() {
    this.unbind();
    this.form = document.getElementById('contact-form') as HTMLFormElement;
    this.submitButton =
      this.form?.querySelector<HTMLButtonElement>('button[type="submit"]') ?? null;
    this.messageContainer = document.getElementById('contact-form-status');

    if (this.form) {
      this.boundSubmit = this.handleSubmit.bind(this);
      this.form.addEventListener('submit', this.boundSubmit);
    }
  }

  static unbind() {
    if (this.form && this.boundSubmit) {
      this.form.removeEventListener('submit', this.boundSubmit);
    }
    this.boundSubmit = null;
    this.form = null;
    this.submitButton = null;
    this.messageContainer = null;
  }

  /** @deprecated Use {@link bind} — kept for call sites that expect init(). */
  static init() {
    this.bind();
  }

  private static async handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!this.form || !this.submitButton || !this.messageContainer) return;

    const formData = new FormData(this.form);
    const data: ContactFormData = {
      name: (formData.get('name') as string)?.trim() ?? '',
      email: (formData.get('email') as string)?.trim() ?? '',
      subject: (formData.get('subject') as string)?.trim() ?? '',
      message: (formData.get('message') as string)?.trim() ?? '',
      website: (formData.get('website') as string)?.trim() ?? '',
    };

    if (data.website) {
      this.showMessage('Unable to send. Please try again.', 'error');
      return;
    }

    // Basic validation
    if (!data.name || !data.email || !data.message) {
      this.showMessage('Please fill in all required fields.', 'error');
      return;
    }

    if (!this.isValidEmail(data.email)) {
      this.showMessage('Please enter a valid email address.', 'error');
      return;
    }

    const defaultBtnHtml = this.submitButton.innerHTML;
    this.submitButton.disabled = true;
    this.submitButton.textContent = 'Sending...';

    try {
      const response = await fetch('/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        this.showMessage(result.message, 'success');
        this.form.reset();
      } else {
        this.showMessage(result.message || 'Something went wrong. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      this.showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
      this.submitButton.disabled = false;
      this.submitButton.innerHTML = defaultBtnHtml;
    }
  }

  private static getScrollBehavior(): ScrollBehavior {
    if (typeof window === 'undefined') return 'auto';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    return !reduce && fine ? 'smooth' : 'auto';
  }

  private static showMessage(message: string, type: 'success' | 'error') {
    if (!this.messageContainer) return;

    const isSuccess = type === 'success';
    this.messageContainer.textContent = message;
    this.messageContainer.dataset.state = type;
    this.messageContainer.hidden = false;
    this.messageContainer.scrollIntoView({
      behavior: ContactFormHandler.getScrollBehavior(),
      block: 'nearest',
    });

    // Clear message after 5 seconds for success, 10 seconds for errors
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.hidden = true;
        delete this.messageContainer.dataset.state;
      }
    }, isSuccess ? 5000 : 10000);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
