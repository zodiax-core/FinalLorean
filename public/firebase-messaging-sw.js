// Firebase Messaging Service Worker v1.0.4
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

console.log("[FCM SW] Service Worker Script Loaded v1.0.4");

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
    console.log('[FCM SW] Installing version 1.0.4...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[FCM SW] Activating version 1.0.4...');
    event.waitUntil(clients.claim());
});

// Listener for background messages
messaging.onBackgroundMessage((payload) => {
    console.log("[FCM SW] Background message payload:", JSON.stringify(payload));

    // Data can come from notification OR data blocks
    const title = payload.notification?.title || payload.data?.title || "Lorean Alchemical Alert";
    const body = payload.notification?.body || payload.data?.message || payload.data?.body || "A new ritual has been manifested.";
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

    console.log("[FCM SW] Showing notification from background handler:", title);
    // Explicit return is important for SW
    return self.registration.showNotification(title, notificationOptions);
});

// Manual push event listener to catch anything Firebase ignores
self.addEventListener('push', (event) => {
    console.log('[FCM SW] Raw Push Event received');
    if (event.data) {
        try {
            const data = event.data.json();
            console.log('[FCM SW] Raw Push Data:', JSON.stringify(data));
        } catch (e) {
            console.log('[FCM SW] Raw Push Text:', event.data.text());
        }
    } else {
        console.warn('[FCM SW] Push event received with no data');
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/admin/notifications';
    console.log("[FCM SW] Notification clicked, opening:", urlToOpen);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(new URL(urlToOpen, self.location.origin).href);
            }
        })
    );
});

// Message listener for app-to-sw communication
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PING') {
        console.log('[FCM SW] Pong! Ritual version 1.0.4 is active.');
        event.source.postMessage({ type: 'PONG', version: '1.0.4' });
    }
});
