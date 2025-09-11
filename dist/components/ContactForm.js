export function ContactForm() {
    return {
        formData: {
            name: '',
            email: '',
            subject: '',
            message: ''
        },
        isSubmitting: false,
        submitMessage: '',
        submitStatus: '',
        async submitForm() {
            if (this.isSubmitting)
                return;
            // Basic validation
            if (!this.formData.name || !this.formData.email || !this.formData.message) {
                this.showMessage('Please fill in all required fields.', 'error');
                return;
            }
            if (!this.isValidEmail(this.formData.email)) {
                this.showMessage('Please enter a valid email address.', 'error');
                return;
            }
            this.isSubmitting = true;
            this.submitMessage = '';
            try {
                const response = await fetch('/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.formData),
                });
                const result = await response.json();
                if (response.ok && result.status === 'success') {
                    this.showMessage(result.message, 'success');
                    this.resetForm();
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
                this.isSubmitting = false;
            }
        },
        showMessage(message, status) {
            this.submitMessage = message;
            this.submitStatus = status;
            // Clear message after 5 seconds
            setTimeout(() => {
                this.submitMessage = '';
                this.submitStatus = '';
            }, 5000);
        },
        resetForm() {
            this.formData = {
                name: '',
                email: '',
                subject: '',
                message: ''
            };
        },
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }
    };
}
//# sourceMappingURL=ContactForm.js.map