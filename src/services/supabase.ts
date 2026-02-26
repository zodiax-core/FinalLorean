import { supabase } from "@/integrations/supabase/client";

export interface Product {
    id: number;
    name: string;
    price: number;
    old_price?: number;
    rating: number;
    reviews: number;
    image: string;
    gallery?: string[];
    category: string;
    tag?: string;
    description?: string;
    detailed_description?: string;
    stock: number;
    sku?: string;
    status: 'active' | 'draft' | 'archived' | 'out_of_stock';
    min_stock_level: number;
    highlights?: string[];
    specs?: any;
    variants?: any;
    faqs?: { q: string, a: string }[];
    reviews_list?: any[];
    created_at?: string;
    updated_at?: string;
    vendor_id?: string;
    vessel_volume?: string;
    fake_sold_count?: number;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    image?: string;
    created_at?: string;
}

export interface SupportTicket {
    id: string;
    user_id: string;
    subject: string;
    description: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_to?: string;
    internal_notes?: string;
    created_at: string;
    updated_at: string;
    user?: { full_name: string, avatar_url: string };
    assignee?: { full_name: string, avatar_url: string };
}

export interface TicketMessage {
    id: string;
    ticket_id: string;
    sender_id: string;
    message: string;
    attachments: string[];
    is_internal: boolean;
    created_at: string;
    sender?: { full_name: string, avatar_url: string };
}

export interface Notification {
    id: string;
    type: 'order' | 'inventory' | 'review' | 'vendor' | 'system' | 'refund';
    priority: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    is_read: boolean;
    related_id?: string;
    related_type?: string;
    deep_link?: string;
    metadata: any;
    created_at: string;
    read_at?: string;
    user_id?: string;
}

export interface NotificationPreference {
    user_id: string;
    email_notifications: boolean;
    push_notifications: boolean;
    order_notifications: boolean;
    inventory_notifications: boolean;
    review_notifications: boolean;
    vendor_notifications: boolean;
    system_notifications: boolean;
    refund_notifications: boolean;
}

export interface Order {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    items: any[];
    subtotal_amount: number;
    shipping_amount: number;
    tax_amount: number;
    discount_amount: number;
    discount_code?: string;
    total_amount: number;
    status: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    payment_method: string;
    created_at: string;
    tracking_number?: string;
    vendor_id?: string;
    short_id?: string;
    country?: string;
    receiver_phone?: string;
    receiver_name?: string;
    nearest_famous_place?: string;
}

export const productsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id: number) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async create(product: Partial<Product>) {
        const { error } = await supabase
            .from('products')
            .insert(product);

        if (error) throw error;
        return null;
    },

    async update(id: number, updates: Partial<Product>) {
        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return null;
    },

    async delete(id: number) {
        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        // If data is empty, it means no row was deleted (likely RLS or wrong ID)
        if (!data || data.length === 0) {
            throw new Error("Product not found or permission denied.");
        }
        return true;
    }
};

export const ordersService = {
    async getAll() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async getByUserId(userId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(order: Partial<Order>) {
        const { data, error } = await supabase
            .from('orders')
            .insert(order)
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Order>) {
        const { data, error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async updateStatus(id: string, status: string) {
        return this.update(id, { status });
    },

    subscribeToOrders(callback: (payload: any) => void) {
        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => callback(payload)
            )
            .subscribe();
        return channel;
    },

    unsubscribe(channel: any) {
        supabase.removeChannel(channel);
    },

    // Alias for backward compatibility
    async getMyOrders(userId: string) {
        return this.getByUserId(userId);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async getByShortId(shortId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('short_id', shortId)
            .maybeSingle();

        if (error) throw error;
        return data as Order | null;
    }
};

export const returnsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('returns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getByUserId(userId: string) {
        const { data, error } = await supabase
            .from('returns')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(returnRequest: any) {
        const { data, error } = await supabase
            .from('returns')
            .insert(returnRequest)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string | number, updates: any) {
        const { data, error } = await supabase
            .from('returns')
            .update(updates)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async updateStatus(id: string | number, status: string) {
        return this.update(id, { status });
    },

    // Alias for backward compatibility
    async createRequest(returnRequest: any) {
        return this.create(returnRequest);
    }
};

export const discountsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id: string | number) {
        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async getByCode(code: string) {
        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async create(discount: any) {
        const { error } = await supabase
            .from('discounts')
            .insert(discount);

        if (error) throw error;
        return null;
    },

    async update(id: string | number, updates: any) {
        const { error } = await supabase
            .from('discounts')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return null;
    },

    async delete(id: string | number) {
        const { error } = await supabase
            .from('discounts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async incrementUsage(id: string | number) {
        const discount = await this.getById(id);
        if (!discount) throw new Error('Discount not found');

        const { error } = await supabase
            .from('discounts')
            .update({
                used_count: (discount.used_count || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

export const reviewsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, products(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getByProductId(productId: number) {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', productId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(review: any) {
        const { error } = await supabase
            .from('reviews')
            .insert(review);

        if (error) throw error;
        return true;
    },

    async update(id: string, updates: any) {
        const { error } = await supabase
            .from('reviews')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async getLogs() {
        const { data, error } = await supabase
            .from('review_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};

export const vendorsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(vendor: any) {
        const { error } = await supabase
            .from('vendors')
            .insert(vendor);

        if (error) throw error;
        return true;
    },

    async update(id: string, updates: any) {
        const { error } = await supabase
            .from('vendors')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('vendors')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async getVendorProducts(vendorId: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getVendorOrders(vendorId: string) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getVendorActivityLogs(vendorId: string) {
        const { data, error } = await supabase
            .from('vendor_activity_logs')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data;
    },

    async getVendorRole(vendorId: string) {
        const { data, error } = await supabase
            .from('vendor_roles')
            .select('*')
            .eq('vendor_id', vendorId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async updateVendorRole(vendorId: string, role: any) {
        const existing = await this.getVendorRole(vendorId);

        if (existing) {
            const { error } = await supabase
                .from('vendor_roles')
                .update({ ...role, updated_at: new Date().toISOString() })
                .eq('vendor_id', vendorId);

            if (error) throw error;
            return true;
        } else {
            const { error } = await supabase
                .from('vendor_roles')
                .insert({ vendor_id: vendorId, ...role });

            if (error) throw error;
            return true;
        }
    },

    async getVendorPayouts(vendorId: string) {
        const { data, error } = await supabase
            .from('vendor_payouts')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async createPayout(payout: any) {
        const { error } = await supabase
            .from('vendor_payouts')
            .insert(payout);

        if (error) throw error;
        return true;
    },

    async updatePayoutStatus(payoutId: string, status: string) {
        const { error } = await supabase
            .from('vendor_payouts')
            .update({
                status,
                processed_at: status === 'completed' ? new Date().toISOString() : null
            })
            .eq('id', payoutId);

        if (error) throw error;
        return true;
    }
};

export const settingsService = {
    async getShipping() {
        const { data, error } = await supabase
            .from('shipping_settings')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data || { flat_rate: 15, threshold: 150 };
    },

    async updateShipping(settings: any) {
        // First try to update
        const { data: existing } = await supabase
            .from('shipping_settings')
            .select('id')
            .limit(1)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('shipping_settings')
                .update(settings)
                .eq('id', existing.id);

            if (error) throw error;
            return true;
        } else {
            // Insert if doesn't exist
            const { error } = await supabase
                .from('shipping_settings')
                .insert(settings);

            if (error) throw error;
            return true;
        }
    },

    async getConfig(category: string) {
        const { data, error } = await supabase
            .from('store_config')
            .select('settings')
            .eq('category', category)
            .maybeSingle();

        if (error) throw error;
        return data?.settings || {};
    },

    async getAllConfigs() {
        const { data, error } = await supabase
            .from('store_config')
            .select('*');

        if (error) throw error;
        return data.reduce((acc, curr) => ({
            ...acc,
            [curr.category]: curr.settings
        }), {} as Record<string, any>);
    },

    async updateConfig(category: string, settings: any) {
        const { error } = await supabase
            .from('store_config')
            .upsert({ category, settings, updated_at: new Date().toISOString() }, { onConflict: 'category' });

        if (error) throw error;
        return settings;
    },

    async getAdminLogs() {
        const { data, error } = await supabase
            .from('admin_activity_logs')
            .select(`
                *,
                admin:profiles(full_name, avatar_url)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return data;
    },

    async createAdminLog(adminId: string, action: string, details: any) {
        const { error } = await supabase
            .from('admin_activity_logs')
            .insert({ admin_id: adminId, action, details });

        if (error) throw error;
        return true;
    }
};

export const taxService = {
    async getAll() {
        const { data, error } = await supabase
            .from('tax_rules')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('tax_rules')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async getActive() {
        const { data, error } = await supabase
            .from('tax_rules')
            .select('*')
            .eq('is_active', true)
            .order('priority', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getByCountry(country: string) {
        const { data, error } = await supabase
            .from('tax_rules')
            .select('*')
            .eq('country', country)
            .eq('is_active', true)
            .order('priority', { ascending: true });

        if (error) throw error;
        return data;
    },

    async create(taxRule: any) {
        const { error } = await supabase
            .from('tax_rules')
            .insert(taxRule);

        if (error) throw error;
        return true;
    },

    async update(id: string, updates: any) {
        const { error } = await supabase
            .from('tax_rules')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('tax_rules')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async toggleActive(id: string, isActive: boolean) {
        return this.update(id, { is_active: isActive });
    },

    // Calculate tax for a given amount and country
    async calculateTax(amount: number, country: string, productId?: number) {
        const rules = await this.getByCountry(country);

        if (!rules || rules.length === 0) {
            return { taxAmount: 0, taxRate: 0, taxName: 'No Tax', breakdown: [] };
        }

        let totalTax = 0;
        const breakdown: any[] = [];

        for (const rule of rules) {
            // Check if there's a product-specific override
            if (productId && rule.product_overrides) {
                const override = rule.product_overrides[productId];
                if (override !== undefined) {
                    if (override === 0) continue; // Skip this tax for this product
                    // Use override rate
                    const taxAmount = rule.tax_type === 'percentage'
                        ? (amount * override / 100)
                        : override;
                    totalTax += taxAmount;
                    breakdown.push({
                        name: rule.tax_name,
                        rate: override,
                        type: rule.tax_type,
                        amount: taxAmount
                    });
                    continue;
                }
            }

            // Apply normal tax
            const taxAmount = rule.tax_type === 'percentage'
                ? (amount * rule.tax_rate / 100)
                : rule.tax_rate;

            totalTax += taxAmount;
            breakdown.push({
                name: rule.tax_name,
                rate: rule.tax_rate,
                type: rule.tax_type,
                amount: taxAmount
            });
        }

        return {
            taxAmount: totalTax,
            taxRate: rules[0]?.tax_rate || 0,
            taxName: rules.map(r => r.tax_name).join(' + '),
            breakdown
        };
    },

    // Get tax summary for reporting
    async getTaxSummary(startDate?: string, endDate?: string) {
        let query = supabase
            .from('orders')
            .select('tax_amount, tax_breakdown, created_at, status');

        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calculate summary
        const summary = {
            totalTaxCollected: 0,
            orderCount: 0,
            averageTax: 0,
            byTaxType: {} as Record<string, number>
        };

        data?.forEach(order => {
            if (order.status !== 'cancelled') {
                summary.totalTaxCollected += order.tax_amount || 0;
                summary.orderCount++;

                // Breakdown by tax type
                if (order.tax_breakdown) {
                    order.tax_breakdown.forEach((tax: any) => {
                        if (!summary.byTaxType[tax.name]) {
                            summary.byTaxType[tax.name] = 0;
                        }
                        summary.byTaxType[tax.name] += tax.amount;
                    });
                }
            }
        });

        summary.averageTax = summary.orderCount > 0
            ? summary.totalTaxCollected / summary.orderCount
            : 0;

        return summary;
    }
};

export const notificationService = {
    async getAll(userId?: string) {
        let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getUnread(userId?: string) {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getByType(type: string, userId?: string) {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('type', type)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getByPriority(priority: string, userId?: string) {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('priority', priority)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async create(notification: any) {
        const { error } = await supabase
            .from('notifications')
            .insert(notification);

        if (error) throw error;
        return true;
    },

    async markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async markAsUnread(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: false, read_at: null })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async bulkMarkAsRead(ids: string[]) {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', ids)
            .select();

        if (error) throw error;
        return data;
    },

    async markAllAsRead(userId?: string) {
        let query = supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('is_read', false);

        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }

        const { data, error } = await query.select();
        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async bulkDelete(ids: string[]) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .in('id', ids);

        if (error) throw error;
        return true;
    },

    async clearRead(userId?: string) {
        let query = supabase
            .from('notifications')
            .delete()
            .eq('is_read', true);

        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }

        const { error } = await query;
        if (error) throw error;
        return true;
    },

    async clearAll(userId?: string) {
        let query = supabase.from('notifications').delete();

        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        } else {
            query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        }

        const { error } = await query;
        if (error) throw error;
        return true;
    },

    async getStats(userId?: string) {
        const all = await this.getAll(userId);
        const unread = all.filter(n => !n.is_read);

        return {
            total: all.length,
            unread: unread.length,
            read: all.length - unread.length,
            byType: {
                order: all.filter(n => n.type === 'order').length,
                inventory: all.filter(n => n.type === 'inventory').length,
                review: all.filter(n => n.type === 'review').length,
                vendor: all.filter(n => n.type === 'vendor').length,
                system: all.filter(n => n.type === 'system').length,
                refund: all.filter(n => n.type === 'refund').length,
            },
            byPriority: {
                info: all.filter(n => n.priority === 'info').length,
                warning: all.filter(n => n.priority === 'warning').length,
                critical: all.filter(n => n.priority === 'critical').length,
            }
        };
    },

    // Real-time subscription
    subscribeToNotifications(userId: string | undefined, callback: (payload: any) => void) {
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    // Removing strict filter so admins can see system-wide notifications (user_id IS NULL)
                },
                (payload: any) => {
                    // We can filter locally if needed, but for now let's notify the callback
                    callback(payload);
                }
            )
            .subscribe();

        return channel;
    },

    // Unsubscribe from real-time
    unsubscribe(channel: any) {
        supabase.removeChannel(channel);
    }
};

export const supportService = {
    async getAll() {
        const { data, error } = await supabase
            .from('support_tickets')
            .select(`
                *,
                user:profiles!support_tickets_user_id_fkey(full_name, avatar_url),
                assignee:profiles!support_tickets_assigned_to_fkey(full_name, avatar_url)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SupportTicket[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('support_tickets')
            .select(`
                *,
                user:profiles!support_tickets_user_id_fkey(full_name, avatar_url),
                assignee:profiles!support_tickets_assigned_to_fkey(full_name, avatar_url)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as SupportTicket;
    },

    async getMessages(ticketId: string) {
        const { data, error } = await supabase
            .from('ticket_messages')
            .select(`
                *,
                sender:profiles(full_name, avatar_url)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as TicketMessage[];
    },

    async create(ticket: Partial<SupportTicket>) {
        const { data, error } = await supabase
            .from('support_tickets')
            .insert(ticket)
            .select()
            .single();

        if (error) throw error;
        return data as SupportTicket;
    },

    async update(id: string, updates: Partial<SupportTicket>) {
        const { data, error } = await supabase
            .from('support_tickets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as SupportTicket;
    },

    async addMessage(message: Partial<TicketMessage>) {
        const { error } = await supabase
            .from('ticket_messages')
            .insert(message);

        if (error) throw error;
        return true;
    },

    async getLogs(ticketId: string) {
        const { data, error } = await supabase
            .from('ticket_activity_logs')
            .select(`
                *,
                admin:profiles(full_name, avatar_url)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async logActivity(log: any) {
        const { error } = await supabase
            .from('ticket_activity_logs')
            .insert(log);

        if (error) throw error;
        return true;
    }
};

export const profilesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async updateFcmToken(id: string, token: string) {
        // Update without select to avoid 406/PGRST116 errors
        const { error } = await supabase
            .from('profiles')
            .update({
                fcm_token: token,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

export const categoriesService = {
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                // Check if it's a "relation does not exist" error
                if (error.code === '42P01' || error.message?.includes('not found')) {
                    throw new Error('TABLE_MISSING');
                }
                throw error;
            }
            return data;
        } catch (err: any) {
            if (err.message === 'TABLE_MISSING' || err.code === '42P01') {
                const { data: products, error: prodError } = await supabase
                    .from('products')
                    .select('category');

                if (prodError) throw prodError;
                const uniqueNames = Array.from(new Set(products?.map(p => p.category) || []));
                return uniqueNames.map((name, i) => ({
                    id: i,
                    name,
                    created_at: new Date().toISOString()
                }));
            }
            throw err;
        }
    },

    async create(category: Partial<Category>) {
        const { error } = await supabase
            .from('categories')
            .insert(category);

        if (error) throw error;
        return true;
    },

    async update(id: number, updates: Partial<Category>) {
        const { error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async delete(id: number) {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

export const marketingService = {
    async getMarketingConfig() {
        const { data, error } = await supabase
            .from('store_config')
            .select('settings')
            .eq('category', 'marketing')
            .maybeSingle();

        if (error) throw error;
        return data?.settings || {
            popup_product_id: null,
            hero_bar: { enabled: false, text: "SALE SALE SALE", bg_color: "#000000", text_color: "#ffffff" }
        };
    },

    async updateMarketingConfig(settings: any) {
        const { error } = await supabase
            .from('store_config')
            .upsert({
                category: 'marketing',
                settings,
                updated_at: new Date().toISOString()
            }, { onConflict: 'category' });

        if (error) throw error;
        return settings;
    }
};
