// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

// Load service account from the local file
import serviceAccount from './service-account.json' assert { type: 'json' };

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate the Google OAuth2 Access Token
async function getAccessToken() {
    try {
        const jwt = await new jose.SignJWT({
            scope: 'https://www.googleapis.com/auth/firebase.messaging'
        })
            .setProtectedHeader({ alg: 'RS256' })
            .setIssuer(serviceAccount.client_email)
            .setAudience(serviceAccount.token_uri)
            .setExpirationTime('1h')
            .setIssuedAt()
            .sign(await jose.importPKCS8(serviceAccount.private_key, 'RS256'));

        const response = await fetch(serviceAccount.token_uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt
            })
        });

        const data = await response.json();
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
        const { type, payload } = await req.json();

        // Initialize Supabase Client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        let tokens: string[] = [];

        if (type === 'new_order') {
            // Fetch admin tokens (Hardcoded email based on RLS policies in project)
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('fcm_token')
                .eq('id', '2727859c-e4ce-4911-998e-cf6adebe1a93'); // Admin ID for zodiaxcore@gmail.com

            if (error) throw error;

            if (profiles) {
                tokens = profiles
                    .map((p: any) => p.fcm_token)
                    .filter((t: any) => t);
            }
        } else if (type === 'test') {
            const { user_id } = payload;
            const { data: profile } = await supabase.from('profiles').select('fcm_token').eq('id', user_id).single();
            if (profile?.fcm_token) tokens.push(profile.fcm_token);
        }

        if (tokens.length === 0) {
            return new Response(JSON.stringify({ message: "No targets found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Get the OAuth2 Access Token
        const accessToken = await getAccessToken();

        // Send to FCM v1 API
        const results = await Promise.all(tokens.map(async (token) => {
            try {
                const response = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        message: {
                            token: token,
                            notification: {
                                title: payload.title || "Lorean Update",
                                body: payload.message || "New activity on your store."
                            },
                            webpush: {
                                notification: {
                                    icon: "https://lorean-shop.netlify.app/logo.png",
                                    click_action: payload.url || "https://lorean-shop.netlify.app/admin"
                                },
                                fcm_options: {
                                    link: payload.url || "https://lorean-shop.netlify.app/admin"
                                }
                            },
                            data: payload.data || {}
                        }
                    })
                });
                return await response.json();
            } catch (e: any) {
                return { error: e.message };
            }
        }));

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("Function error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
