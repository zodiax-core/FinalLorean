import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { profilesService } from "@/services/supabase";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Safe Messaging Initialization
let messagingInstance: any = null;
try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        messagingInstance = getMessaging(app);
    }
} catch (e) {
    console.warn("Ritual of Messaging not supported in this realm:", e);
}

export const messaging = messagingInstance;

export const requestNotificationPermission = async (userId: string) => {
    try {
        if (typeof window === 'undefined') return null;

        if (!('serviceWorker' in navigator)) {
            throw new Error("Service Workers are not supported in this browser.");
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error("Notification permission denied. Please allow notifications in your browser settings.");
        }

        // Wait for service worker to be ready
        let registration = await navigator.serviceWorker.ready;

        // Ensure the correct SW is registered
        if (!registration || !registration.active || !registration.scope.includes(window.location.origin)) {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        }

        try {
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BJl-tQwVr82P2JDI3oyvlS9SKCEYLqmRpVo-LHVYoOPtwzp-sjPToNQQ1s2Rumi_85k1b4XHfK_XFKzjWH9vOD8";

            const token = await getToken(messaging, {
                vapidKey: vapidKey,
                serviceWorkerRegistration: registration
            });

            if (!token) throw new Error("No registration token available. Request permission to generate one.");

            console.log("FCM Token Manifested:", token);

            // Persist to Supabase
            await profilesService.updateFcmToken(userId, token);

            return token;
        } catch (e: any) {
            console.error("Token Generation Failed:", e);
            if (e.code === 'messaging/permission-blocked') {
                throw new Error("Notifications are blocked by the browser.");
            }
            throw e;
        }

    } catch (error: any) {
        console.error("FCM Setup Error:", error);
        throw error;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
