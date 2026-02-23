# 🚀 Lorean Deployment Guide

I have prepared the `netlify_deploy` folder which is ready to be dropped into Netlify.

## 📦 How to Deploy (Drag & Drop)
1. Go to your **Netlify Dashboard**.
2. Go to **"Sites"** -> **"Add new site"** -> **"Deploy manually"**.
3. Drag and drop the content of the `deploys/netlify_deploy` folder into the upload box.

## 🔑 Environment Variables (CRITICAL)
Before the site works, you MUST add these variables in **Netlify Settings** > **Build & Deploy** > **Environment**:

### Supabase (Mandatory)
- `VITE_SUPABASE_URL`: `https://aeegdozbtqifmbhyfoso.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `sb_publishable_rYrHtnKbtZEPDnksjIOJuQ_HA_hZFQ0`

### Firebase (For Notifications)
- `VITE_FIREBASE_API_KEY`: `AIzaSyC49V2Mop4oZ0k4tyjDO-WvddDc1QpSuZQ`
- `VITE_FIREBASE_AUTH_DOMAIN`: `lorean-4b059.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID`: `lorean-4b059`
- `VITE_FIREBASE_STORAGE_BUCKET`: `lorean-4b059.firebasestorage.app`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: `112492076990`
- `VITE_FIREBASE_APP_ID`: `1:112492076990:web:81cb4ffe9450ccaa3be3ef`
- `VITE_FIREBASE_MEASUREMENT_ID`: `G-ZD3K66SMFV`

## 🗄️ Database Setup (Supabase)
Ensure you have run the scripts in the `deploys/REQUIRED_SQL_MIGRATIONS` folder in your **Supabase SQL Editor**:
1. `01_notification_system.sql`: Setup the notification engine.
2. `02_tax_system.sql`: Setup the tax calculation system.
3. `03_product_permissions.sql`: Grants `zodiaxcore@gmail.com` permission to add/edit/delete products.
4. `04_order_tracking.sql`: Enables the short ID system for order tracking and scanning.

## ✨ Why this works
- **No White Screen**: Included a `_redirects` file that tells Netlify to handle React routing correctly.
- **Persistence**: All product deletions and additions are saved directly to your live Supabase database.
- **Security**: Specific RLS policies ensure only your admin email can manage sensitive data.

Your botanical empire is ready for the world! 🌿✨
