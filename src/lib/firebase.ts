import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "@/integrations/supabase/client";

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

/**
 * Registers this device for push notifications and saves the FCM token
 * to BOTH tables:
 *  - admin_push_tokens (multi-device: one row per user+token)
 *  - profiles.fcm_token (legacy fallback)
 *
 * Uses UPSERT so re-registering the same device is idempotent.
 */
export const requestNotificationPermission = async (userId: string) => {
    try {
        if (typeof window === 'undefined') return null;

        if (!('serviceWorker' in navigator)) {
            throw new Error("Service Workers are not supported in this browser.");
        }

        console.log("[FCM] Requesting permission...");
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error("Notification permission denied. Please allow notifications in your browser settings.");
        }

        console.log("[FCM] Registering Service Worker...");
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const registration = await navigator.serviceWorker.ready;

        console.log("[FCM] Fetching token with VAPID key...");
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY ||
            "BJl-tQwVr82P2JDI3oyvlS9SKCEYLqmRpVo-LHVYoOPtwzp-sjPToNQQ1s2Rumi_85k1b4XHfK_XFKzjWH9vOD8";

        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration
        });

        if (!token) throw new Error("No registration token available.");

        console.log("[FCM] Token generated successfully.");

        const domain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
        const deviceInfo = `${domain} | ${navigator.userAgent.substring(0, 80)}`;

        const { error: tokenError } = await supabase
            .from('admin_push_tokens')
            .upsert(
                {
                    user_id: userId,
                    fcm_token: token,
                    device_info: deviceInfo,
                    last_seen_at: new Date().toISOString()
                },
                { onConflict: 'user_id,fcm_token' }
            );

        if (tokenError) {
            console.error("[FCM] Failed to save to admin_push_tokens:", tokenError);
            // Don't throw — fall through to legacy save
        } else {
            console.log("[FCM] Token upserted into admin_push_tokens.");
        }

        // ─────────────────────────────────────────────────────────────
        // Also update profiles.fcm_token (legacy fallback)
        // ─────────────────────────────────────────────────────────────
        await supabase
            .from('profiles')
            .update({
                fcm_token: token,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        return token;
    } catch (error: any) {
        console.error("[FCM] Setup Error on " + window.location.hostname + ":", {
            message: error.message,
            code: error.code,
            stack: error.stack,
            full: error
        });
        throw error;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
