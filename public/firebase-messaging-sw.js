// Firebase Messaging Service Worker v1.0.3
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker.
firebase.initializeApp({
    apiKey: "AIzaSyC49V2Mop4oZ0k4tyjDO-WvddDc1QpSuZQ",
    authDomain: "lorean-4b059.firebaseapp.com",
    projectId: "lorean-4b059",
    storageBucket: "lorean-4b059.firebasestorage.app",
    messagingSenderId: "112492076990",
    appId: "1:112492076990:web:81cb4ffe9450ccaa3be3ef"
});

const messaging = firebase.messaging();

// Force immediate activation
self.addEventListener('install', (event) => {
    console.log('[FCM SW] Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[FCM SW] Service Worker activating...');
    event.waitUntil(clients.claim());
});

messaging.onBackgroundMessage((payload) => {
    console.log("[FCM SW] Background message payload:", payload);

    const title = payload.notification?.title || payload.data?.title || "Lorean Alchemical Alert";
    const body = payload.notification?.body || payload.data?.message || "A new ritual has been Manifested.";
    const url = payload.data?.url || '/admin/notifications';

    const notificationOptions = {
        body: body,
        icon: "https://lorean.online/favicon.png",
        badge: "https://lorean.online/favicon.png",
        tag: 'lorean-notification',
        renotify: true,
        data: {
            url: url
        }
    };

    console.log("[FCM SW] Showing notification:", title);
    return self.registration.showNotification(title, notificationOptions)
        .then(() => console.log("[FCM SW] Notification shown successfully"))
        .catch(err => console.error("[FCM SW] Failed to show notification error:", err));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    console.log("[FCM SW] Notification clicked:", event.notification.data);
    const urlToOpen = event.notification.data?.url || '/admin/notifications';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
