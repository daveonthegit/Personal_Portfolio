import type { ContactFormData } from '../types';
export declare function ContactForm(): {
    formData: ContactFormData;
    isSubmitting: boolean;
    submitMessage: string;
    submitStatus: "success" | "error" | "";
    submitForm(): Promise<void>;
    showMessage(message: string, status: "success" | "error"): void;
    resetForm(): void;
    isValidEmail(email: string): boolean;
};
//# sourceMappingURL=ContactForm.d.ts.map