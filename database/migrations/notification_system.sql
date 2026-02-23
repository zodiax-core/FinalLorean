-- Notifications System Database Schema

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('order', 'inventory', 'review', 'vendor', 'system', 'refund')),
    priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_id TEXT,  -- ID of related entity (order_id, product_id, etc.)
    related_type TEXT,  -- Type of related entity (order, product, review, etc.)
    deep_link TEXT,  -- URL to navigate to when clicked
    metadata JSONB DEFAULT '{}',  -- Additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    order_notifications BOOLEAN DEFAULT true,
    inventory_notifications BOOLEAN DEFAULT true,
    review_notifications BOOLEAN DEFAULT true,
    vendor_notifications BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    refund_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for notification_preferences
CREATE TRIGGER notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_type TEXT,
    p_priority TEXT,
    p_title TEXT,
    p_message TEXT,
    p_related_id TEXT DEFAULT NULL,
    p_related_type TEXT DEFAULT NULL,
    p_deep_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        type, priority, title, message, 
        related_id, related_type, deep_link, metadata, user_id
    ) VALUES (
        p_type, p_priority, p_title, p_message,
        p_related_id, p_related_type, p_deep_link, p_metadata, p_user_id
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk mark notifications as read
CREATE OR REPLACE FUNCTION bulk_mark_notifications_read(p_notification_ids UUID[])
RETURNS VOID AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE id = ANY(p_notification_ids);
END;
$$ LANGUAGE plpgsql;

-- Function to clear all read notifications for a user
CREATE OR REPLACE FUNCTION clear_read_notifications(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE user_id = p_user_id AND is_read = true;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger: New order notification
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        'order',
        'info',
        'New Order Received',
        'Order #' || NEW.id || ' has been placed for $' || NEW.total_amount,
        NEW.id::TEXT,
        'order',
        '/admin/orders',
        jsonb_build_object('order_id', NEW.id, 'total', NEW.total_amount)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_created_notification
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();

-- Trigger: Low stock notification
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock <= 5 AND (OLD.stock IS NULL OR OLD.stock > 5) THEN
        PERFORM create_notification(
            'inventory',
            CASE 
                WHEN NEW.stock = 0 THEN 'critical'
                WHEN NEW.stock <= 2 THEN 'warning'
                ELSE 'info'
            END,
            CASE 
                WHEN NEW.stock = 0 THEN 'Out of Stock Alert'
                ELSE 'Low Stock Alert'
            END,
            'Product "' || NEW.name || '" has ' || 
            CASE 
                WHEN NEW.stock = 0 THEN 'run out of stock'
                ELSE 'only ' || NEW.stock || ' units remaining'
            END,
            NEW.id::TEXT,
            'product',
            '/admin/inventory',
            jsonb_build_object('product_id', NEW.id, 'stock', NEW.stock, 'product_name', NEW.name)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_low_stock_notification
    AFTER INSERT OR UPDATE OF stock ON products
    FOR EACH ROW
    EXECUTE FUNCTION notify_low_stock();

-- Trigger: New review notification
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
    v_product_name TEXT;
BEGIN
    SELECT name INTO v_product_name FROM products WHERE id = NEW.product_id;
    
    PERFORM create_notification(
        'review',
        CASE 
            WHEN NEW.rating <= 2 THEN 'warning'
            ELSE 'info'
        END,
        'New Review Submitted',
        'A ' || NEW.rating || '-star review was posted for "' || v_product_name || '"',
        NEW.id::TEXT,
        'review',
        '/admin/reviews',
        jsonb_build_object('review_id', NEW.id, 'rating', NEW.rating, 'product_name', v_product_name)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_created_notification
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_review();

-- Trigger: Vendor status change notification
CREATE OR REPLACE FUNCTION notify_vendor_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        PERFORM create_notification(
            'vendor',
            CASE 
                WHEN NEW.status = 'suspended' THEN 'warning'
                WHEN NEW.status = 'disabled' THEN 'critical'
                ELSE 'info'
            END,
            'Vendor Status Changed',
            'Vendor "' || NEW.name || '" status changed to ' || NEW.status,
            NEW.id::TEXT,
            'vendor',
            '/admin/vendors',
            jsonb_build_object('vendor_id', NEW.id, 'status', NEW.status, 'vendor_name', NEW.name)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_status_notification
    AFTER UPDATE OF status ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION notify_vendor_status_change();

-- Trigger: Return/Refund request notification
CREATE OR REPLACE FUNCTION notify_return_request()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        'refund',
        'warning',
        'New Return Request',
        'Return request #' || NEW.id || ' has been submitted',
        NEW.id::TEXT,
        'return',
        '/admin/returns',
        jsonb_build_object('return_id', NEW.id, 'status', NEW.status)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER return_created_notification
    AFTER INSERT ON returns
    FOR EACH ROW
    EXECUTE FUNCTION notify_return_request();

-- Insert some sample system notifications
INSERT INTO notifications (type, priority, title, message, deep_link) VALUES
('system', 'info', 'Welcome to Lorean Admin', 'Your notification system is now active and monitoring all activities.', '/admin'),
('system', 'info', 'Database Optimized', 'All database indexes have been created for optimal performance.', '/admin')
ON CONFLICT DO NOTHING;
