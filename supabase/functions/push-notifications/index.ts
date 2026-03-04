// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

// Retrieve Firebase Service Account from environment variables
// These must be set in Supabase: Settings -> Edge Functions -> Environment Variables
const serviceAccount = {
    "type": "service_account",
    "project_id": Deno.env.get("FIREBASE_PROJECT_ID"),
    "private_key_id": Deno.env.get("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, '\n'),
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

// Function to generate the Google OAuth2 Access Token
async function getAccessToken() {
    try {
        console.log("Preparing JWT for email:", serviceAccount.client_email);

        // Ensure the private key is correctly formatted for Jose
        let privateKey = serviceAccount.private_key;
        if (typeof privateKey !== 'string') {
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

        console.log("JWT signed, requesting access token from:", serviceAccount.token_uri);

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
            console.error("Google Auth Response Error:", JSON.stringify(data));
            throw new Error(data.error_description || data.error || "Unknown Auth Error");
        }

        return data.access_token;
    } catch (error: any) {
        console.error("Error generating access token:", error.message || error);
        throw new Error(`Auth Error: ${error.message || error}`);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        console.log("Received notification request body:", JSON.stringify(body));

        // Handle both flexible formats: {type, payload} OR {notification}
        let type = body.type || 'system';
        let payload = body.payload || body.notification;

        if (!payload) {
            console.error("Missing payload or notification object in request");
            throw new Error("Missing notification content");
        }

        console.log("Extracted Payload:", JSON.stringify(payload));

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing Supabase environment variables");
            throw new Error("Server configuration error: Missing Supabase variables");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        let tokens: string[] = [];
        console.log(`Processing notification type: ${type}`);

        if (type === 'new_order' || type === 'order') {
            // Fetch all admin tokens dynamically
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('fcm_token')
                .eq('role', 'admin');

            if (error) {
                console.error("Error fetching admin profiles:", error);
                throw error;
            }

            if (profiles) {
                const adminTokens = profiles
                    .map((p: any) => p.fcm_token)
                    .filter((t: any) => t);
                tokens.push(...adminTokens);
                console.log(`Found ${adminTokens.length} admin tokens`);
            }
        }

        // If a specific user_id is provided, also send to that user
        if (payload?.user_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('fcm_token')
                .eq('id', payload.user_id)
                .single();

            if (profile?.fcm_token && !tokens.includes(profile.fcm_token)) {
                tokens.push(profile.fcm_token);
                console.log(`Added specific user token for ID: ${payload.user_id}`);
            }
        }

        if (tokens.length === 0) {
            console.log("No notification targets (FCM tokens) found.");
            return new Response(JSON.stringify({ message: "No targets found", success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Get the OAuth2 Access Token
        console.log("Generating Google OAuth2 Access Token...");
        const accessToken = await getAccessToken();
        console.log("Access token generated successfully.");

        // Send to FCM v1 API
        console.log(`Sending notifications to ${tokens.length} devices...`);
        const results = await Promise.all(tokens.map(async (token) => {
            try {
                const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
                const response = await fetch(fcmUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        message: {
                            token: token,
                            notification: {
                                title: payload.title || "Lorean Alchemical Update",
                                body: payload.message || "New activity manifested on your store."
                            },
                            webpush: {
                                notification: {
                                    icon: "https://lorean.online/logo.png",
                                    click_action: payload.url || "https://lorean.online/admin"
                                },
                                fcm_options: {
                                    link: payload.url || "https://lorean.online/admin"
                                }
                            },
                            data: payload.data || {}
                        }
                    })
                });

                const responseData = await response.json();
                if (!response.ok) {
                    console.error(`FCM Error for token ${token.substring(0, 10)}...:`, JSON.stringify(responseData));
                }
                return { token: `${token.substring(0, 5)}...`, ...responseData };
            } catch (e: any) {
                console.error(`Fetch exception for token ${token.substring(0, 5)}...:`, e.message);
                return { error: e.message };
            }
        }));

        console.log("Notification results:", JSON.stringify(results));
        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("Function fatal error:", err.message || err);
        return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
