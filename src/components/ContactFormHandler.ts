import type { ContactFormData } from '../types';

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
      this.submitButton.textContent = 'TRANSMIT MESSAGE';
    }
  }

  private static showMessage(message: string, type: 'success' | 'error') {
    if (!this.messageContainer) return;

    const isSuccess = type === 'success';
    const borderColor = isSuccess ? '#00ff00' : '#ff0000';
    const bgColor = isSuccess ? '#00ff00' : '#ff0000';
    const textColor = isSuccess ? '#000000' : '#ffffff';
    const messageColor = isSuccess ? '#00ff00' : '#ff0000';
    const statusText = isSuccess ? 'TRANSMISSION STATUS' : 'TRANSMISSION ERROR';

    this.messageContainer.innerHTML = `
      <div style="background-color: #222222; border: 1px solid ${borderColor}; padding: 16px;">
        <div style="background-color: ${bgColor}; color: ${textColor}; padding: 4px 8px; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 12px; display: inline-block;">
          ${statusText}
        </div>
        <p style="color: ${messageColor}; font-size: 14px;">
          ${message}
        </p>
      </div>
    `;
    this.messageContainer.style.display = 'block';
    this.messageContainer.scrollIntoView({ behavior: 'smooth' });

    // Clear message after 5 seconds for success, 10 seconds for errors
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.style.display = 'none';
      }
    }, isSuccess ? 5000 : 10000);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
