importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// Initialize the Firebase app in the service worker.
// NOTE: During build, these will be replaced by Vite or you can set them manually.
// For Netlify, the secret scanner might flag these, so we use placeholders.
firebase.initializeApp({
    apiKey: "AIzaSyC49V2Mop4oZ0k4tyjDO-WvddDc1QpSuZQ",
    authDomain: "lorean-4b059.firebaseapp.com",
    projectId: "lorean-4b059",
    storageBucket: "lorean-4b059.firebasestorage.app",
    messagingSenderId: "112492076990",
    appId: "1:112492076990:web:81cb4ffe9450ccaa3be3ef"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
        "[firebase-messaging-sw.js] Received background message:",
        payload
    );

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

    console.log("[FCM SW] Attempting to showNotification:", title);
    return self.registration.showNotification(title, notificationOptions)
        .then(() => console.log("[FCM SW] Notification shown successfully"))
        .catch(err => console.error("[FCM SW] Failed to show notification:", err));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/admin/notifications';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If a window client is already open, focus it
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window client is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
