# 🔔 Notification System - Complete Implementation Guide

## Overview
The Lorean Notification System provides real-time alerts for all critical admin activities including orders, inventory, reviews, vendors, refunds, and system events.

## Features Implemented

### ✅ Admin Notification Center (`/admin/notifications`)
- **Central Dashboard** - All notifications in one place
- **Real-Time Updates** - Instant notifications via Supabase Realtime
- **Smart Filtering** - By type, priority, status, and search
- **Bulk Actions** - Mark multiple as read, delete selected
- **Deep Linking** - Click notification → navigate to related page
- **Priority Levels** - Info, Warning, Critical
- **Read/Unread Status** - Track what you've seen
- **Timestamps** - Relative time display (e.g., "2 minutes ago")

### ✅ Notification Types
1. **Orders** 🛒 - New order placed
2. **Inventory** 📦 - Low stock, out of stock
3. **Reviews** ⭐ - New review submitted
4. **Vendors** 🏪 - Vendor status changes
5. **Refunds** 🔄 - Return/refund requests
6. **System** ⚠️ - System alerts, security notices

### ✅ Auto-Alerts (Database Triggers)
The system automatically creates notifications for:
- ✅ **New Order** - When order is placed
- ✅ **Low Stock** - When product stock ≤ 5 units
- ✅ **Out of Stock** - When product stock = 0
- ✅ **New Review** - When review is submitted
- ✅ **Low Rating** - When review rating ≤ 2 stars
- ✅ **Vendor Status Change** - When vendor is suspended/disabled
- ✅ **Return Request** - When return is submitted

### ✅ Priority System
- **Info** (Blue) - General notifications
- **Warning** (Amber) - Needs attention
- **Critical** (Red) - Urgent action required

## Database Schema

### `notifications` Table
```sql
- id (UUID)
- type (TEXT) - order, inventory, review, vendor, system, refund
- priority (TEXT) - info, warning, critical
- title (TEXT) - Notification headline
- message (TEXT) - Detailed message
- is_read (BOOLEAN) - Read status
- related_id (TEXT) - ID of related entity
- related_type (TEXT) - Type of related entity
- deep_link (TEXT) - URL to navigate to
- metadata (JSONB) - Additional data
- created_at (TIMESTAMP)
- read_at (TIMESTAMP)
- user_id (UUID) - Optional user assignment
```

### `notification_preferences` Table
```sql
- id (UUID)
- user_id (UUID)
- email_notifications (BOOLEAN)
- push_notifications (BOOLEAN)
- order_notifications (BOOLEAN)
- inventory_notifications (BOOLEAN)
- review_notifications (BOOLEAN)
- vendor_notifications (BOOLEAN)
- system_notifications (BOOLEAN)
- refund_notifications (BOOLEAN)
```

## Setup Instructions

### 1. Run the Database Migration

Execute in Supabase SQL Editor:

```bash
# File location
database/migrations/notification_system.sql
```

This creates:
- ✅ `notifications` table
- ✅ `notification_preferences` table
- ✅ Indexes for performance
- ✅ RLS policies
- ✅ Auto-trigger functions for all notification types
- ✅ Helper functions (create, mark read, bulk actions)

### 2. Install Dependencies

```bash
npm install date-fns
```

### 3. Verify Setup

Check in Supabase:
1. **Tables** - `notifications` and `notification_preferences` exist
2. **Functions** - `create_notification`, `mark_notification_read`, etc.
3. **Triggers** - Check triggers on orders, products, reviews, vendors, returns

## Backend Service (`notificationService`)

### Methods Available

```typescript
// Fetch notifications
notificationService.getAll(userId?)
notificationService.getUnread(userId?)
notificationService.getByType(type, userId?)
notificationService.getByPriority(priority, userId?)

// Create notification
notificationService.create(notification)

// Mark as read/unread
notificationService.markAsRead(id)
notificationService.markAsUnread(id)
notificationService.bulkMarkAsRead(ids[])
notificationService.markAllAsRead(userId?)

// Delete notifications
notificationService.delete(id)
notificationService.bulkDelete(ids[])
notificationService.clearRead(userId?)
notificationService.clearAll(userId?)

// Statistics
notificationService.getStats(userId?)

// Real-time
notificationService.subscribeToNotifications(userId, callback)
notificationService.unsubscribe(channel)
```

## Usage Examples

### Create Manual Notification

```typescript
await notificationService.create({
  type: 'system',
  priority: 'critical',
  title: 'Security Alert',
  message: 'Unusual login activity detected',
  deep_link: '/admin/security',
  metadata: { ip: '192.168.1.1' }
});
```

### Subscribe to Real-Time Updates

```typescript
useEffect(() => {
  const channel = notificationService.subscribeToNotifications(
    userId,
    (payload) => {
      if (payload.eventType === 'INSERT') {
        toast({
          title: payload.new.title,
          description: payload.new.message
        });
      }
    }
  );

  return () => notificationService.unsubscribe(channel);
}, [userId]);
```

### Mark All as Read

```typescript
await notificationService.markAllAsRead();
```

### Clear Read Notifications

```typescript
await notificationService.clearRead();
```

## Auto-Trigger Examples

### New Order Notification
Automatically created when order is inserted:

```sql
-- Trigger fires on INSERT to orders table
-- Creates notification with:
- Type: 'order'
- Priority: 'info'
- Title: 'New Order Received'
- Message: 'Order #123 has been placed for $99.99'
- Deep Link: '/admin/orders'
```

### Low Stock Alert
Automatically created when product stock ≤ 5:

```sql
-- Trigger fires on UPDATE to products table
-- Creates notification with:
- Type: 'inventory'
- Priority: 'warning' (or 'critical' if stock = 0)
- Title: 'Low Stock Alert' (or 'Out of Stock Alert')
- Message: 'Product "Mystic Candle" has only 3 units remaining'
- Deep Link: '/admin/inventory'
```

### New Review Notification
Automatically created when review is submitted:

```sql
-- Trigger fires on INSERT to reviews table
-- Creates notification with:
- Type: 'review'
- Priority: 'warning' (if rating ≤ 2) or 'info'
- Title: 'New Review Submitted'
- Message: 'A 5-star review was posted for "Mystic Candle"'
- Deep Link: '/admin/reviews'
```

## Deep Linking

Notifications automatically navigate to relevant pages:

| Type | Deep Link | Description |
|------|-----------|-------------|
| Order | `/admin/orders` | View all orders |
| Inventory | `/admin/inventory` | Manage stock |
| Review | `/admin/reviews` | Review management |
| Vendor | `/admin/vendors` | Vendor dashboard |
| Refund | `/admin/returns` | Return requests |
| System | `/admin` | Admin dashboard |

## Real-Time Features

### Automatic Updates
- New notifications appear instantly
- No page refresh needed
- Toast notifications for new alerts
- Badge count updates in real-time

### Subscription Management
```typescript
// Component automatically subscribes on mount
useEffect(() => {
  const channel = notificationService.subscribeToNotifications(
    undefined, // null = all notifications
    handleNotification
  );

  return () => notificationService.unsubscribe(channel);
}, []);
```

## UI Features

### Stats Dashboard
- Total notifications
- Unread count
- Critical alerts count
- Order notifications count

### Filtering
- **By Type**: Orders, Inventory, Reviews, Vendors, Refunds, System
- **By Priority**: Info, Warning, Critical
- **By Status**: All, Unread, Read
- **Search**: Title and message content

### Bulk Actions
- Select all/none
- Mark selected as read
- Delete selected
- Mark all as read
- Clear all read notifications

### Visual Indicators
- **Unread**: Blue dot + left border
- **Priority Colors**:
  - Info: Blue
  - Warning: Amber
  - Critical: Red
- **Type Icons**: Each type has unique icon
- **Timestamps**: Relative time (e.g., "5 minutes ago")

## Performance Optimizations

### Database Indexes
```sql
- idx_notifications_user_id
- idx_notifications_type
- idx_notifications_priority
- idx_notifications_is_read
- idx_notifications_created_at
- idx_notifications_user_unread (composite)
```

### Query Optimization
- Filtered queries use indexes
- Real-time subscriptions are scoped
- Bulk operations use single queries

## Security (RLS Policies)

### Notifications Table
- ✅ Users can view their own notifications
- ✅ System can insert notifications
- ✅ Users can update their own notifications
- ✅ Users can delete their own notifications

### Notification Preferences
- ✅ Users can view/edit their own preferences
- ✅ Isolated per user

## Troubleshooting

### Notifications Not Appearing

**Check:**
1. Database migration ran successfully
2. Triggers are enabled on tables
3. RLS policies allow SELECT
4. Real-time is enabled in Supabase

**Fix:**
```sql
-- Verify triggers exist
SELECT * FROM pg_trigger WHERE tgname LIKE '%notification%';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### Real-Time Not Working

**Check:**
1. Supabase Realtime is enabled
2. Channel subscription is active
3. Browser console for errors

**Fix:**
```typescript
// Enable realtime in Supabase Dashboard
// Project Settings → API → Realtime → Enable for 'notifications'
```

### Auto-Alerts Not Triggering

**Check:**
1. Triggers exist on source tables
2. Functions are defined
3. No errors in Supabase logs

**Fix:**
```sql
-- Re-create trigger
DROP TRIGGER IF EXISTS order_created_notification ON orders;
CREATE TRIGGER order_created_notification
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_order();
```

## Customization

### Add New Notification Type

1. **Update Type Enum**:
```sql
ALTER TABLE notifications 
DROP CONSTRAINT notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('order', 'inventory', 'review', 'vendor', 'system', 'refund', 'your_new_type'));
```

2. **Create Trigger Function**:
```sql
CREATE OR REPLACE FUNCTION notify_your_event()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        'your_new_type',
        'info',
        'Your Title',
        'Your message',
        NEW.id::TEXT,
        'your_entity',
        '/admin/your-page'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

3. **Attach Trigger**:
```sql
CREATE TRIGGER your_event_notification
    AFTER INSERT ON your_table
    FOR EACH ROW
    EXECUTE FUNCTION notify_your_event();
```

4. **Update Frontend**:
```typescript
// Add to NOTIFICATION_TYPES in Notifications.tsx
{ value: "your_new_type", label: "Your Type", icon: YourIcon }
```

## Best Practices

1. **Don't Spam** - Only create notifications for important events
2. **Use Priority Wisely** - Critical should be rare
3. **Clear Old Notifications** - Regularly clear read notifications
4. **Test Triggers** - Verify auto-alerts work before production
5. **Monitor Performance** - Check notification query times

## Future Enhancements

Potential additions:
- [ ] Email notifications
- [ ] Push notifications (browser)
- [ ] Notification preferences UI
- [ ] Notification grouping
- [ ] Notification scheduling
- [ ] Export notification history

---

**Notification System Status**: ✅ Fully Implemented & Production Ready

The notification system is now live with real-time updates, auto-alerts, and comprehensive management features!
