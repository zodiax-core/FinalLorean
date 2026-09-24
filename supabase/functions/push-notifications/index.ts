// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

/**
 * Normalizes a private key string for use with jose.
 */
function normalizePrivateKey(raw: string | undefined): string {
    if (!raw) return '';

    // 1. Remove quotes
    let key = raw.trim().replace(/^["']|["']$/g, '');

    // 2. Fix escaped newlines
    key = key.replace(/\\n/g, '\n').replace(/%0A/gi, '\n');

    // 3. Ensure PEM headers
    if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
        // If it's just raw base64, wrap it
        const rawBody = key.replace(/\s+/g, '');
        const chunked = (rawBody.match(/.{1,64}/g) || []).join('\n');
        return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----\n`;
    }

    // 4. Clean PEM structure
    const match = key.match(/-----BEGIN PRIVATE KEY-----\s*([\s\S]+?)\s*-----END PRIVATE KEY-----/);
    if (match && match[1]) {
        const rawBody = match[1].replace(/\s+/g, '');
        const chunked = (rawBody.match(/.{1,64}/g) || []).join('\n');
        return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----\n`;
    }

    return key;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken(sa: any) {
    try {
        console.log("[FCM] Obtaining access token...");
        const privateKey = normalizePrivateKey(sa.private_key);

        if (!privateKey) throw new Error("Private key is missing. Check SUPABASE SECRETS for FIREBASE_PRIVATE_KEY.");

        const jwt = await new jose.SignJWT({
            scope: 'https://www.googleapis.com/auth/firebase.messaging'
        })
            .setProtectedHeader({ alg: 'RS256' })
            .setIssuer(sa.client_email)
            .setAudience(sa.token_uri)
            .setExpirationTime('1h')
            .setIssuedAt()
            .sign(await jose.importPKCS8(privateKey, 'RS256'));

        const response = await fetch(sa.token_uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("[FCM] Google Auth Failed:", data);
            throw new Error(data.error_description || data.error || "Token fetch failed");
        }
        return data.access_token;
    } catch (err: any) {
        console.error("[FCM] Auth Error:", err.message);
        throw err;
    }
}

async function sendToToken(accessToken: string, token: string, payload: any, projectId: string) {
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    // Determine click action URL
    const clickUrl = payload.url?.startsWith('http')
        ? payload.url
        : `https://lorean.online${payload.url || '/dashboard'}`;

    const title = payload.title || "Lorean Notification";
    const body = payload.message || "New activity on your store.";

    const message = {
        message: {
            token,
            notification: { title, body },
            android: {
                priority: "high"
            },
            webpush: {
                headers: {
                    Urgency: "high"
                },
                notification: {
                    icon: "https://lorean.online/favicon.png"
                },
                fcm_options: { link: clickUrl }
            },
            data: {
                url: String(clickUrl),
                ...(payload.data ? Object.fromEntries(
                    Object.entries(payload.data)
                        .filter(([_, v]) => v != null)
                        .map(([k, v]) => [k, String(v)])
                ) : {})
            }
        }
    };

    const res = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(message)
    });

    const data = await res.json();
    return { success: res.ok, data, token };
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        // 1. Get body safely
        let body;
        try {
            body = await req.json();
        } catch (e) {
            console.error("[FCM] Invalid JSON body");
            return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
        }

        const type = body.type || 'system';
        const payload = body.payload || body.notification;

        console.log(`[FCM] New request: type=${type}`);

        if (!payload) {
            console.warn("[FCM] Missing payload");
            return new Response(JSON.stringify({ error: "Missing payload" }), { status: 400, headers: corsHeaders });
        }

        // 2. Environment Setup (with hardcoded fallbacks to lorean-4b059 if secrets are missing)
        const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") || "lorean-4b059";
        const FIREBASE_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL") || "firebase-adminsdk-fbsvc@lorean-4b059.iam.gserviceaccount.com";
        const FIREBASE_PRIVATE_KEY = Deno.env.get("FIREBASE_PRIVATE_KEY");

        const sa = {
            project_id: FIREBASE_PROJECT_ID,
            client_email: FIREBASE_CLIENT_EMAIL,
            private_key: FIREBASE_PRIVATE_KEY,
            token_uri: "https://oauth2.googleapis.com/token"
        };

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") || "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
        );

        // 3. Resolve Tokens
        const tokenSet = new Set<string>();

        // If type is for admins, fetch admin tokens
        const ADMIN_TYPES = ['new_order', 'order', 'system', 'contact', 'refund', 'inventory', 'review', 'vendor'];
        const isCustomerSpecific = type === 'order' && payload.url === '/dashboard' && payload.user_id;

        if (ADMIN_TYPES.includes(type) && !isCustomerSpecific) {
            const { data: admins } = await supabase
                .from('profiles')
                .select('id, fcm_token')
                .in('role', ['admin', 'super_admin']);

            if (admins) {
                const adminIds = admins.map(a => a.id);
                admins.forEach(a => { if (a.fcm_token) tokenSet.add(a.fcm_token); });

                const { data: devices } = await supabase
                    .from('admin_push_tokens')
                    .select('fcm_token')
                    .in('user_id', adminIds);

                if (devices) {
                    devices.forEach(d => { if (d.fcm_token) tokenSet.add(d.fcm_token); });
                }
            }
        }

        // Add user-specific token if provided
        if (payload.user_id) {
            const { data: userTokens } = await supabase
                .from('admin_push_tokens')
                .select('fcm_token')
                .eq('user_id', payload.user_id);

            if (userTokens && userTokens.length > 0) {
                userTokens.forEach(t => { if (t.fcm_token) tokenSet.add(t.fcm_token); });
            } else {
                const { data: profile } = await supabase.from('profiles').select('fcm_token').eq('id', payload.user_id).maybeSingle();
                if (profile?.fcm_token) tokenSet.add(profile.fcm_token);
            }
        }

        const tokens = Array.from(tokenSet).filter(t => t && t.length > 30);
        console.log(`[FCM] Targets identified: ${tokens.length}`);

        if (tokens.length === 0) {
            console.warn("[FCM] No valid tokens found for this request");
            return new Response(JSON.stringify({ success: true, message: "No targets" }), { headers: corsHeaders });
        }

        // 4. Send
        const accessToken = await getAccessToken(sa);
        const results = await Promise.all(tokens.map(t => sendToToken(accessToken, t, payload, sa.project_id)));

        // 5. Cleanup Stale
        const stale = results.filter(r => !r.success && (r.data?.error?.status === 'UNREGISTERED' || r.data?.error?.status === 'INVALID_ARGUMENT')).map(r => r.token);
        if (stale.length > 0) {
            console.log(`[FCM] Cleaning ${stale.length} stale token(s)...`);
            await supabase.from('admin_push_tokens').delete().in('fcm_token', stale);
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        console.log(`[FCM] Broadcast complete: ${successCount}/${tokens.length} successful`);

        return new Response(JSON.stringify({
            success: true,
            sent: successCount,
            total: tokens.length,
            failures: failureCount,
            details: results.map(r => ({
                success: r.success,
                token_end: r.token.slice(-10),
                error: r.success ? null : r.data
            }))
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error("[FCM] ERROR:", err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
});
