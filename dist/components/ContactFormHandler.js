export class ContactFormHandler {
    static init() {
        this.form = document.getElementById('contact-form');
        this.submitButton = document.getElementById('submit-btn');
        this.messageContainer = document.getElementById('form-message');
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }
    static async handleSubmit(event) {
        event.preventDefault();
        if (!this.form || !this.submitButton || !this.messageContainer)
            return;
        const formData = new FormData(this.form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
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
            }
            else {
                this.showMessage(result.message || 'Something went wrong. Please try again.', 'error');
            }
        }
        catch (error) {
            console.error('Contact form error:', error);
            this.showMessage('Network error. Please check your connection and try again.', 'error');
        }
        finally {
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Send Message';
        }
    }
    static showMessage(message, type) {
        if (!this.messageContainer)
            return;
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
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
ContactFormHandler.form = null;
ContactFormHandler.submitButton = null;
ContactFormHandler.messageContainer = null;
//# sourceMappingURL=ContactFormHandler.js.map