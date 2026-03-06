import { supabase } from "@/integrations/supabase/client";
import { settingsService } from './supabase';

export interface EmailConfig {
    service_id: string;
    template_id: string;
    public_key: string; // This is the Resend API key
    contact_template_id?: string;
}

export const emailService = {
    async getConfig(): Promise<EmailConfig | null> {
        try {
            const config = await settingsService.getConfig('email_config');
            if (config && (config.public_key || config.service_id)) {
                return { ...config, public_key: config.public_key || config.service_id } as EmailConfig;
            }
            return null;
        } catch (e: any) {
            console.error('Failed to load email config', e);
            return null;
        }
    },

    async sendEmail(params: any, type: 'broadcast' | 'order_confirmation' | 'contact' = 'broadcast') {
        const config = await this.getConfig();
        const apiKey = config?.public_key || 're_R7J4Krco_LVt9uQQEAAueihF7NYiRGYkS';

        if (!apiKey || apiKey === 're_xxxxxxxxx') {
            throw new Error('Resend API key is missing. Please set it in Admin Settings.');
        }

        const logoUrl = params.logo_url || 'https://lorean.online/logo.png';
        const heroUrl = params.hero_url || params.event_image || 'https://images.unsplash.com/photo-1557177324-56c5421653ce?q=80&w=1200&auto=format&fit=crop';
        let html = '';

        // === BROADCAST TEMPLATE ===
        if (type === 'broadcast') {
            const plainText = `${params.event_title || params.subject}\n\n${params.event_description || params.message || ''}\n\nVisit Store: ${params.shop_link || 'https://lorean.online/shop'}\n\nLorean | lorean.online`;

            html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${params.event_title || 'Lorean Ritual'}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f2ed;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

<!-- Header -->
<tr>
<td align="center" style="padding:40px 40px 30px;background:#ffffff;border-bottom:1px solid #f0ebe3;">
<img src="${logoUrl}" width="120" height="auto" style="display:block;margin:0 auto 16px;" alt="Lorean">
<p style="margin:0;font-size:10px;letter-spacing:4px;color:#c9a24c;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Exclusive Arrival</p>
</td>
</tr>

<!-- Hero Image -->
<tr><td><img src="${heroUrl}" width="600" style="display:block;width:100%;max-height:400px;object-fit:cover;" alt="Lorean Ritual"></td></tr>

<!-- Content -->
<tr>
<td style="padding:50px 48px;text-align:center;">
<h1 style="margin:0 0 20px;font-weight:400;color:#c9a24c;font-size:30px;line-height:1.3;">${params.event_title || params.subject}</h1>
<p style="margin:0 0 36px;color:#555555;line-height:1.9;font-size:15px;font-style:italic;">${(params.event_description || params.message || '').replace(/\n/g, '<br>')}</p>
<a href="${params.primary_button_link || params.button_link || 'https://lorean.online'}" style="display:inline-block;background:#c9a24c;color:#ffffff;padding:16px 38px;text-decoration:none;border-radius:50px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;font-family:Arial,sans-serif;">${params.primary_button_text || params.button_text || 'Explore Rituals'}</a>
</td>
</tr>

<!-- Links -->
<tr>
<td style="padding:28px 40px;text-align:center;border-top:1px solid #f0ebe3;background:#faf7f2;">
<a href="${params.shop_link || 'https://lorean.online/shop'}" style="display:inline-block;margin:0 10px;color:#c9a24c;text-decoration:none;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Shop</a>
<a href="${params.about_link || 'https://lorean.online/about'}" style="display:inline-block;margin:0 10px;color:#c9a24c;text-decoration:none;font-size:12px;letter-spacing:1px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">About</a>
</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:30px 40px;background:#ffffff;font-size:11px;color:#aaaaaa;line-height:1.6;font-family:Arial,sans-serif;border-top:1px solid #f0ebe3;">
<p style="margin:0 0 6px;">lorean.online &bull; Premium Botanical Hair Rituals</p>
<p style="margin:0;">You received this email because you joined the Lorean Inner Circle.<br>To unsubscribe, <a href="https://lorean.online/unsubscribe" style="color:#aaaaaa;">click here</a>.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;

            return this._send(params, apiKey, html, plainText);

        } else if (type === 'order_confirmation') {

            const itemsHtml = Array.isArray(params.items) ? params.items.map((item: any) => `
<tr>
<td style="padding:12px 0;border-bottom:1px solid #f0ebe3;color:#333333;font-size:14px;">${item.name}</td>
<td style="padding:12px 0;border-bottom:1px solid #f0ebe3;text-align:center;color:#777777;font-size:13px;font-family:Arial,sans-serif;">x${item.quantity}</td>
<td style="padding:12px 0;border-bottom:1px solid #f0ebe3;text-align:right;font-weight:bold;font-size:14px;font-family:Arial,sans-serif;">Rs. ${Number(item.price).toLocaleString()}</td>
</tr>`).join('') : `<tr><td colspan="3" style="padding:10px 0;color:#555;">Order items</td></tr>`;

            const itemsPlain = Array.isArray(params.items) ? params.items.map((item: any) => `- ${item.name} x${item.quantity}: Rs. ${item.price}`).join('\n') : '';
            const plainText = `Order Confirmed - #${params.order_id}\n\nHello ${params.customer_name || ''},\n\nYour order has been received!\n\nOrder ID: #${params.order_id}\nDate: ${params.order_date}\nPayment: ${params.payment_method}\n\n${itemsPlain}\n\nSubtotal: Rs. ${params.subtotal}\nShipping: Rs. ${params.shipping}\nTax: Rs. ${params.tax}\nTotal: Rs. ${params.total}\n\nTrack your order: ${params.tracking_link || 'https://lorean.online/account/orders'}\n\nLorean | lorean.online | Support: +92 325 7978051`;

            html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Order Confirmed - #${params.order_id}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f2ed;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

<!-- Header -->
<tr>
<td align="center" style="padding:40px 40px 28px;background:#ffffff;border-bottom:1px solid #f0ebe3;">
<img src="${logoUrl}" width="120" height="auto" style="display:block;margin:0 auto 16px;" alt="Lorean">
<p style="margin:0;font-size:10px;letter-spacing:4px;color:#c9a24c;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Order Confirmation</p>
</td>
</tr>

<!-- Gold Banner -->
<tr>
<td style="padding:32px 48px 28px;text-align:center;background:linear-gradient(135deg,#c9a24c,#e8c97a);">
<h1 style="margin:0 0 10px;color:#ffffff;font-weight:400;font-size:26px;">Your Ritual Has Been Confirmed</h1>
<p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;font-style:italic;">Hello ${params.customer_name || 'Patron'}, your order is being lovingly prepared.</p>
</td>
</tr>

<!-- Order Meta -->
<tr>
<td style="padding:32px 48px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:13px;">
<tr>
<td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#888888;">Order ID</td>
<td style="padding:10px 0;border-bottom:1px solid #f0ebe3;text-align:right;font-weight:bold;color:#333333;">#${params.order_id}</td>
</tr>
<tr>
<td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#888888;">Order Date</td>
<td style="padding:10px 0;border-bottom:1px solid #f0ebe3;text-align:right;color:#333333;">${params.order_date || new Date().toLocaleDateString()}</td>
</tr>
<tr>
<td style="padding:10px 0;color:#888888;">Payment</td>
<td style="padding:10px 0;text-align:right;color:#333333;font-weight:bold;text-transform:uppercase;">${params.payment_method || 'Cash on Delivery'}</td>
</tr>
</table>
</td>
</tr>

<!-- Order Items -->
<tr>
<td style="padding:28px 48px;background:#faf7f2;border-top:1px solid #f0ebe3;border-bottom:1px solid #f0ebe3;margin-top:24px;">
<p style="margin:0 0 18px;color:#c9a24c;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Order Summary</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${itemsHtml}
</table>
</td>
</tr>

<!-- Totals -->
<tr>
<td style="padding:28px 48px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;">
<tr>
<td style="padding:7px 0;color:#888888;">Subtotal</td>
<td style="text-align:right;color:#333333;">Rs. ${Number(params.subtotal || 0).toLocaleString()}</td>
</tr>
<tr>
<td style="padding:7px 0;color:#888888;">Shipping</td>
<td style="text-align:right;color:#333333;">Rs. ${Number(params.shipping || 0).toLocaleString()}</td>
</tr>
<tr>
<td style="padding:7px 0;color:#888888;">Tax</td>
<td style="text-align:right;color:#333333;">Rs. ${Number(params.tax || 0).toLocaleString()}</td>
</tr>
<tr>
<td style="padding:18px 0 0;font-size:18px;font-weight:bold;color:#c9a24c;border-top:2px solid #f0ebe3;">Total</td>
<td style="padding:18px 0 0;text-align:right;font-size:20px;font-weight:bold;color:#c9a24c;border-top:2px solid #f0ebe3;">Rs. ${Number(params.total || 0).toLocaleString()}</td>
</tr>
</table>
</td>
</tr>

<!-- CTA -->
<tr>
<td align="center" style="padding:10px 48px 36px;text-align:center;">
<a href="${params.tracking_link || 'https://lorean.online/account/orders'}" style="display:inline-block;background:#c9a24c;color:#ffffff;padding:15px 36px;text-decoration:none;border-radius:50px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;font-family:Arial,sans-serif;">Track Your Order</a>
<p style="margin:20px 0 0;font-size:13px;color:#777777;font-style:italic;">Your botanical ritual is being prepared with care.</p>
</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:28px 40px;background:#faf7f2;border-top:1px solid #f0ebe3;font-size:11px;color:#aaaaaa;line-height:1.7;font-family:Arial,sans-serif;">
<p style="margin:0 0 4px;"><strong style="color:#888888;">Lorean Boutique Rituals</strong></p>
<p style="margin:0 0 4px;">lorean.online &bull; Support: +92 325 7978051</p>
<p style="margin:0;">You received this because you placed an order with us.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;

            return this._send(params, apiKey, html, plainText);

        } else {
            // Contact type
            const plainText = `Message from ${params.from_name}: ${params.message}`;
            html = `<!DOCTYPE html><html><body style="padding:20px;font-family:Arial,sans-serif;"><h2>New Contact Message</h2><p><strong>From:</strong> ${params.from_name} &lt;${params.from_email}&gt;</p><p>${params.message}</p></body></html>`;
            return this._send(params, apiKey, html, plainText);
        }
    },

    async _send(params: any, apiKey: string, html: string, text: string) {

        const { data, error } = await supabase.functions.invoke('resend-ritual', {
            body: {
                action: 'send_email',
                apiKey: apiKey,
                payload: {
                    from: 'Lorean <hello@lorean.online>',
                    to: params.to_email || 'loreanpk@gmail.com',
                    subject: params.subject || 'Lorean Boutique Ritual',
                    html: html,
                    text: text || ''
                }
            }
        });

        if (error) throw error;
        return data;
    },

    async sendContactForm(data: { name: string, email: string, subject: string, message: string }) {
        return this.sendEmail({
            from_name: data.name,
            from_email: data.email,
            subject: data.subject,
            message: data.message,
            to_email: 'loreanpk@gmail.com'
        }, 'contact');
    },

    async sendWelcomeEmail(email: string) {
        return this.sendEmail({
            to_email: email,
            subject: "Welcome to Lorean Rituals",
            message: "The botanical secrets will find you soon."
        }, 'broadcast');
    },

    async sendOrderConfirmation(order: any) {
        return this.sendEmail({
            customer_name: order.full_name,
            order_id: (order.short_id || order.id).slice(0, 8),
            order_date: new Date(order.created_at).toLocaleDateString(),
            payment_method: order.payment_method,
            items: order.items, // Expecting array of {name, quantity, price}
            subtotal: order.subtotal_amount,
            shipping: order.shipping_amount,
            tax: order.tax_amount,
            total: order.total_amount,
            to_email: order.email,
            subject: `Ritual Confirmed - #${(order.short_id || order.id).slice(0, 8)}`
        }, 'order_confirmation');
    },

    async addToAudience(email: string, firstName?: string, lastName?: string) {
        const config = await this.getConfig();
        const apiKey = config?.public_key || 're_R7J4Krco_LVt9uQQEAAueihF7NYiRGYkS';

        // Use default General Audience ID discovered or allow override
        const audienceId = 'e18399b4-4d3d-4b09-a26f-c768d5f678ec';

        try {
            const { data, error } = await supabase.functions.invoke('resend-ritual', {
                body: {
                    action: 'add_to_audience',
                    apiKey: apiKey,
                    payload: {
                        email,
                        firstName,
                        lastName,
                        audienceId
                    }
                }
            });

            if (error) {
                // If contact already exists, we can ignore or return success
                if (error.message?.includes('already exists')) {
                    return { success: true, message: 'Existing Ritual Soul' };
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Resend Audience Sync Error:', error);
            return null;
        }
    }
};
