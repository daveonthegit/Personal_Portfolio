import type { ContactFormData, ApiResponse } from '../types';

export class ContactFormHandler {
  private static form: HTMLFormElement | null = null;
  private static submitButton: HTMLButtonElement | null = null;
  private static messageContainer: HTMLDivElement | null = null;

  static init() {
    this.form = document.getElementById('contact-form') as HTMLFormElement;
    this.submitButton = document.getElementById('submit-btn') as HTMLButtonElement;
    this.messageContainer = document.getElementById('form-message') as HTMLDivElement;

    if (this.form) {
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }
  }

  private static async handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!this.form || !this.submitButton || !this.messageContainer) return;

    const formData = new FormData(this.form);
    const data: ContactFormData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    // Basic validation
    if (!data.name || !data.email || !data.message) {
      this.showMessage('Please fill in all required fields.', 'error');
      return;
    }

    if (!this.isValidEmail(data.email)) {
      this.showMessage('Please enter a valid email address.', 'error');
      return;
    }

    // Show loading state
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

      const result: ApiResponse = await response.json();

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
      this.submitButton.textContent = 'Send Message';
    }
  }

  private static showMessage(message: string, type: 'success' | 'error') {
    if (!this.messageContainer) return;

    this.messageContainer.textContent = message;
    this.messageContainer.className = `form-message ${type === 'success' ? 'form-success' : 'form-error'}`;
    this.messageContainer.style.display = 'block';

    // Clear message after 5 seconds
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.style.display = 'none';
      }
    }, 5000);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
