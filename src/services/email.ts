import emailjs from '@emailjs/browser';
import { settingsService } from './supabase';

export interface EmailConfig {
    service_id: string;
    template_id: string;
    public_key: string;
    contact_template_id?: string;
}

export const emailService = {
    async getConfig(): Promise<EmailConfig | null> {
        try {
            const config = await settingsService.getConfig('email_config');
            return config as EmailConfig;
        } catch (e) {
            console.error('Failed to load email config', e);
            return null;
        }
    },

    async sendEmail(templateParams: any, templateType: 'broadcast' | 'contact' = 'broadcast') {
        const config = await this.getConfig();
        if (!config || !config.service_id || !config.public_key) {
            throw new Error('Email configuration is missing. Please set it up in Admin Settings.');
        }

        const templateId = templateType === 'contact' ? (config.contact_template_id || config.template_id) : config.template_id;

        if (!templateId) {
            throw new Error('Template ID is missing.');
        }

        try {
            const result = await emailjs.send(
                config.service_id,
                templateId,
                templateParams,
                config.public_key
            );
            return result;
        } catch (error) {
            console.error('EmailJS Error:', error);
            throw error;
        }
    },

    async sendContactForm(data: { name: string, email: string, subject: string, message: string }) {
        return this.sendEmail({
            from_name: data.name,
            from_email: data.email,
            subject: data.subject,
            message: data.message,
            to_name: 'Lorean Care Team'
        }, 'contact');
    },

    async sendWelcomeEmail(email: string) {
        return this.sendEmail({
            to_email: email,
            welcome_message: "Welcome to the Inner Circle. The botanical secrets will find you soon.",
            subject: "Welcome to Lorean Rituals"
        });
    }
};
