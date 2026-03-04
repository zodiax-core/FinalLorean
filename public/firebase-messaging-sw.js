importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// Initialize the Firebase app in the service worker.
// NOTE: During build, these will be replaced by Vite or you can set them manually.
// For Netlify, the secret scanner might flag these, so we use placeholders.
firebase.initializeApp({
    apiKey: "PLACEHOLDER_FIREBASE_API_KEY",
    authDomain: "PLACEHOLDER_FIREBASE_AUTH_DOMAIN",
    projectId: "PLACEHOLDER_FIREBASE_PROJECT_ID",
    storageBucket: "PLACEHOLDER_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "PLACEHOLDER_FIREBASE_MESSAGING_SENDER_ID",
    appId: "PLACEHOLDER_FIREBASE_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload
    );

    // Defensive parsing for background alerts
    const title = payload.notification?.title || payload.data?.title || "Lorean Order";
    const body = payload.notification?.body || payload.data?.message || "A new ritual has been initiated.";

    const notificationOptions = {
        body: body,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: 'order-notification', // Prevent stacking duplicates
        renotify: true,
        data: payload.data,
        actions: [
            { action: 'open', title: 'View Order' }
        ]
    };

    self.registration.showNotification(title, notificationOptions);
});
