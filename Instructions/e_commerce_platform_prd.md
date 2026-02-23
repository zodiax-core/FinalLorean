# Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** Full-Stack E-Commerce Platform  
**Purpose:** Build a fully functional, scalable e-commerce website with separate **Customer** and **Admin** panels, similar to Shopify in core functionality but excluding online payment processing.  
**Target Users:** Small–medium businesses, store owners, and their customers.

---

## 2. Goals & Objectives

- Enable merchants to manage products, inventory, orders, customers, and promotions from an admin dashboard.
- Allow customers to browse products, manage accounts, place orders (COD/manual payment), and track order status.
- Provide a clean, fast, and secure user experience.
- Ensure the system is modular, extensible, and production-ready.

---

## 3. User Roles

### 3.1 Customer
- Browse products
- Create/manage account
- Add products to cart
- Place orders (non-online payment)
- Track orders
- Manage profile and addresses

### 3.2 Admin
- Manage products and categories
- Manage inventory and pricing
- Manage orders and order statuses
- Manage customers
- Configure discounts and promotions
- View analytics and reports
- Manage system settings

---

## 4. Customer Panel Requirements

### 4.1 Authentication
- User registration (email + password)
- Login / logout
- Password reset
- Email verification (optional)

### 4.2 Product Browsing
- Product listing page
- Category-based browsing
- Search products
- Filters (price, category, availability)
- Product detail page (images, price, description, stock)

### 4.3 Cart & Checkout
- Add/remove items from cart
- Update quantity
- Cart persistence (logged-in users)
- Checkout flow:
  - Shipping address
  - Order summary
  - Select payment method (COD / manual)

### 4.4 Orders
- Order confirmation
- Order history
- Order status tracking (Pending, Processing, Shipped, Delivered, Cancelled)

### 4.5 Profile Management
- Update personal details
- Manage saved addresses
- View past orders

---

## 5. Admin Panel Requirements

### 5.1 Dashboard
- Overview metrics:
  - Total orders
  - Revenue (manual tracking)
  - Total customers
  - Low-stock alerts

### 5.2 Product Management
- Create, update, delete products
- Upload multiple product images
- Set pricing and discounts
- Assign categories and tags
- Enable/disable products

### 5.3 Category Management
- Create, update, delete categories
- Nested categories support

### 5.4 Inventory Management
- Track stock quantity
- Low-stock notifications
- Manual stock adjustments

### 5.5 Order Management
- View all orders
- Update order status
- View customer and shipping details
- Cancel or refund orders (manual)

### 5.6 Customer Management
- View customer list
- View customer order history
- Enable/disable customer accounts

### 5.7 Discounts & Promotions
- Create discount codes
- Percentage or fixed discounts
- Validity dates
- Usage limits

### 5.8 Analytics & Reports
- Sales reports (daily/weekly/monthly)
- Top-selling products
- Customer growth
- Inventory reports

### 5.9 System Settings
- Store details (name, logo, currency)
- Tax configuration (manual)
- Shipping settings
- Role & permission management

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Page load time < 3 seconds
- Optimized database queries

### 6.2 Security
- Secure authentication
- Role-based access control
- Input validation
- Protection against common vulnerabilities (XSS, CSRF)

### 6.3 Scalability
- Modular backend architecture
- Ability to handle increasing users and products

### 6.4 Reliability
- Error handling and logging
- Graceful failure states

---

## 7. Tech Stack (Suggested)

- **Frontend:** React / Next.js
- **Backend:** Node.js / Express
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth / JWT
- **Storage:** Supabase Storage (images)
- **Hosting:** Vercel / Cloud hosting

---

## 8. Exclusions

- No online payment gateway integration
- No third-party marketplace integrations (Amazon, eBay, etc.)

---

## 9. Success Metrics

- Admin can manage full store lifecycle without technical help
- Customers can complete orders without errors
- System remains stable under normal traffic

---

## 10. Future Enhancements (Optional)

- Online payments integration
- Mobile app
- Multi-vendor support
- AI-based product recommendations
- Advanced marketing automation

---

**End of PRD**

