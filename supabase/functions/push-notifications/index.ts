// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

function normalizePrivateKey(raw: string | undefined): string {
    if (!raw) return '';

    // Step 1: Strip surrounding quotes (single or double)
    let key = raw.trim().replace(/^["']|["']$/g, '');

    // Step 2: Replace ALL variants of encoded newlines with real newlines
    // Handles: literal \n text, double-escaped \\n, URL-encoded %0A
    key = key.replace(/\\n/g, '\n').replace(/%0A/gi, '\n');

    // Step 3: Extract just the base64 body with a proper CAPTURE GROUP
    // (the capture group parentheses are critical — without them match[1] is undefined)
    const match = key.match(/-----BEGIN PRIVATE KEY-----\s*([\s\S]+?)\s*-----END PRIVATE KEY-----/);
    if (!match || !match[1]) {
        console.error('[FCM] Could not parse PEM structure from private key');
        return key; // return as-is, let jose produce a clear error
    }

    // Step 4: Strip ALL whitespace from the raw base64 body
    const rawBody = match[1].replace(/\s+/g, '');

    // Step 5: Rechunk into standard 64-char lines and rebuild a proper PEM string
    const chunked = (rawBody.match(/.{1,64}/g) || []).join('\n');
    return `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----\n`;
}

const serviceAccount = {
    "type": "service_account",
    "project_id": Deno.env.get("FIREBASE_PROJECT_ID"),
    "private_key_id": Deno.env.get("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": normalizePrivateKey(Deno.env.get("FIREBASE_PRIVATE_KEY")),
    "client_email": Deno.env.get("FIREBASE_CLIENT_EMAIL"),
    "client_id": Deno.env.get("FIREBASE_CLIENT_ID"),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(Deno.env.get("FIREBASE_CLIENT_EMAIL") || "")}`,
    "universe_domain": "googleapis.com"
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken() {
    try {
        console.log("[FCM] Preparing JWT for:", serviceAccount.client_email);
        const privateKey = serviceAccount.private_key;
        if (typeof privateKey !== 'string' || !privateKey) {
            throw new Error("Private key is missing from service account");
        }

        const jwt = await new jose.SignJWT({
            scope: 'https://www.googleapis.com/auth/firebase.messaging'
        })
            .setProtectedHeader({ alg: 'RS256' })
            .setIssuer(serviceAccount.client_email)
            .setAudience(serviceAccount.token_uri)
            .setExpirationTime('1h')
            .setIssuedAt()
            .sign(await jose.importPKCS8(privateKey, 'RS256'));

        const response = await fetch(serviceAccount.token_uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("[FCM] Google Auth Error:", JSON.stringify(data));
            throw new Error(data.error_description || data.error || "Unknown Auth Error");
        }

        console.log("[FCM] Access token obtained.");
        return data.access_token;
    } catch (error: any) {
        console.error("[FCM] Error generating access token:", error.message || error);
        throw new Error(`Auth Error: ${error.message || error}`);
    }
}

async function sendToToken(
    accessToken: string,
    token: string,
    payload: any
): Promise<{ token: string; success: boolean; error?: string }> {
    try {
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
        const clickUrl = payload.url?.startsWith('http')
            ? payload.url
            : `https://lorean.online${payload.url || '/dashboard'}`;

        const response = await fetch(fcmUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                message: {
                    token,
                    notification: {
                        title: payload.title || "Lorean Alchemical Update",
                        body: payload.message || "New activity on your store."
                    },
                    webpush: {
                        notification: {
                            icon: "https://lorean.online/favicon.png",
                            badge: "https://lorean.online/favicon.png",
                            click_action: clickUrl
                        },
                        fcm_options: { link: clickUrl }
                    },
                    data: payload.data
                        ? Object.fromEntries(
                            Object.entries(payload.data)
                                .filter(([, v]) => v != null)
                                .map(([k, v]) => [k, String(v)])
                        )
                        : {}
                }
            })
        });

        const res = await response.json();
        if (!response.ok) {
            const errCode = res?.error?.details?.[0]?.errorCode || res?.error?.status || 'UNKNOWN';
            console.warn(`[FCM] Error for ${token.substring(0, 10)}...: ${errCode}`);
            return { token: token.substring(0, 10) + '...', success: false, error: errCode };
        }

        return { token: token.substring(0, 10) + '...', success: true };
    } catch (e: any) {
        console.error(`[FCM] Exception for ${token.substring(0, 10)}...:`, e.message);
        return { token: token.substring(0, 10) + '...', success: false, error: e.message };
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const type: string = body.type || 'system';
        const payload = body.payload || body.notification;

        console.log(`[FCM] Received: type=${type}`);

        if (!payload) throw new Error("Missing notification payload");

        // Supabase client (service role - bypasses RLS)
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase environment variables");
        }
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Collect FCM tokens
        const tokenSet = new Set<string>();

        const ADMIN_TYPES = ['new_order', 'order', 'system', 'contact', 'refund', 'inventory', 'review', 'vendor'];
        const isCustomerOrderUpdate = type === 'order'
            && payload?.url === '/dashboard'
            && payload?.user_id;

        if (ADMIN_TYPES.includes(type) && !isCustomerOrderUpdate) {
            const { data: adminProfiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, fcm_token')
                .in('role', ['admin', 'super_admin']);

            if (profilesError) {
                console.error('[FCM] Error fetching admin profiles:', profilesError);
            } else if (adminProfiles && adminProfiles.length > 0) {
                const adminIds = adminProfiles.map((p: any) => p.id);

                // Legacy tokens from profiles
                for (const p of adminProfiles) {
                    if (p.fcm_token) tokenSet.add(p.fcm_token);
                }

                // Multi-device tokens from admin_push_tokens
                const { data: pushTokenRows, error: pushTokenError } = await supabase
                    .from('admin_push_tokens')
                    .select('fcm_token')
                    .in('user_id', adminIds);

                if (pushTokenError) {
                    console.error('[FCM] Error fetching admin_push_tokens:', pushTokenError);
                } else if (pushTokenRows) {
                    for (const row of pushTokenRows) {
                        if (row.fcm_token) tokenSet.add(row.fcm_token);
                    }
                    console.log(`[FCM] admin_push_tokens contributed ${pushTokenRows.length} rows`);
                }
            }

            console.log(`[FCM] Admin tokens after dedup: ${tokenSet.size}`);
        }

        // User-specific tokens
        if (payload?.user_id) {
            const { data: userPushRows } = await supabase
                .from('admin_push_tokens')
                .select('fcm_token')
                .eq('user_id', payload.user_id);

            if (userPushRows && userPushRows.length > 0) {
                for (const row of userPushRows) {
                    if (row.fcm_token) tokenSet.add(row.fcm_token);
                }
            } else {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('fcm_token')
                    .eq('id', payload.user_id)
                    .maybeSingle();
                if (profile?.fcm_token) tokenSet.add(profile.fcm_token);
            }
        }

        const tokens = Array.from(tokenSet).filter((t: any) => t && t.length > 20);

        if (tokens.length === 0) {
            console.log("[FCM] No valid FCM tokens found. Skipping push.");
            return new Response(
                JSON.stringify({ message: "No targets found", success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[FCM] Sending to ${tokens.length} unique device(s)...`);

        const accessToken = await getAccessToken();

        const results = await Promise.all(
            tokens.map((token: string) => sendToToken(accessToken, token, payload))
        );

        // Clean up stale tokens
        const STALE_ERRORS = ['UNREGISTERED', 'INVALID_ARGUMENT'];
        const staleTokens: string[] = [];
        for (let i = 0; i < results.length; i++) {
            if (!results[i].success && results[i].error && STALE_ERRORS.some(e => results[i].error?.includes(e))) {
                staleTokens.push(tokens[i] as string);
            }
        }

        if (staleTokens.length > 0) {
            console.log(`[FCM] Cleaning ${staleTokens.length} stale token(s)...`);
            await Promise.all([
                supabase.from('admin_push_tokens').delete().in('fcm_token', staleTokens),
                supabase.from('profiles').update({ fcm_token: null }).in('fcm_token', staleTokens)
            ]);
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`[FCM] Complete: ${successCount}/${tokens.length} sent.`);

        return new Response(
            JSON.stringify({ success: true, sent: successCount, total: tokens.length, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err: any) {
        console.error("[FCM] Fatal:", err.message || err);
        return new Response(
            JSON.stringify({ error: err.message || "Internal Server Error" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
