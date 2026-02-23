importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
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
        "[firebase-messaging-sw.js] Received background message ",
        payload
    );

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: "/logo.png", // Assuming logo is at this path
        badge: "/logo.png",
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
