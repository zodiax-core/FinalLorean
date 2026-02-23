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
export const messaging = getMessaging(app);

export const requestNotificationPermission = async (userId: string) => {
    try {
        if (!('serviceWorker' in navigator)) {
            throw new Error("Service Workers not supported (try Chrome/Edge)");
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error(`Permission ${permission} - Please allow notifications in browser settings`);
        }

        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
            try {
                registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            } catch (e: any) {
                throw new Error(`SW Register Failed: ${e.message}`);
            }
        }

        try {
            const token = await getToken(messaging, {
                vapidKey: "BJl-tQwVr82P2JDI3oyvlS9SKCEYLqmRpVo-LHVYoOPtwzp-sjPToNQQ1s2Rumi_85k1b4XHfK_XFKzjWH9vOD8",
                serviceWorkerRegistration: registration
            });

            if (!token) throw new Error("No FCM token returned");

            console.log("FCM Token:", token);
            await profilesService.updateFcmToken(userId, token);
            return token;

        } catch (e: any) {
            console.error("Token Error:", e);
            if (e.message?.includes("registration-token-not-registered") || e.code === "messaging/token-subscribe-failed") {
                throw new Error("Invalid VAPID Key or Project Config");
            }
            throw new Error(`Token Gen Failed: ${e.message || e.code}`);
        }

    } catch (error: any) {
        console.error("Ritual of Permission Failed:", error);
        throw error; // Propagate to UI
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
