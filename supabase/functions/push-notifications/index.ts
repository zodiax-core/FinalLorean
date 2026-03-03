// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

const serviceAccount = {
    "type": "service_account",
    "project_id": "lorean-4b059",
    "private_key_id": "fdd9f0456aee4cf8af7feab583b1f34db0ab32b2",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCqCWR5iNefduaJ\nL/B3rFqS18Loag/468s1z6arURA4wY27pzpoEAulMWgRvMsCT5vbx6l59zc6K5Og\nllK16vdh5zJzPgA2brWDb6FD4kpteqLYlpNOX3QgnlJhK1sTYyp55RrWxqd3SDNI\nLuwJg3ROso39CmdIKMo+MmsuMiwc6dhrSF22G0ymouAi+nb7MfOphYA91MsD7f5Z\nOQIk3TdJz1lF1YMW2E/IMqjswFi2w9zbVVesmNd0O7S8f/yAX46rkFfWyUXF9JZk\nphjyAtB/y+eudaZRt7s61BMyyAngAUlgQM0hpXcbON7uxUEpy3RJ/HPfoxsXpw42\ncRHNXohZAgMBAAECggEAI6k0IBQdysUsTOXXvDWSylzDdSx3XJiRRiAef6wQ56Ja\nWBqWsof49USTI7MxbXLmSHYLundpZwMII2QbhSk6CFetekNs1n2qBl6VVxAg1Wyk\ntiGAU+3LhGLH+raV049W83kkA5rmuOrUzIUAvm8KJ84lXsY9ioH5hola9rWRkF94\nVtf7J+9/o2+PV7MNwOS4yTRnoV6Qlr6Mj3FXzl59rtD4naq1zvej8g9Gzta/KANI\nUqLsn3jRUqoxaqltWkEIMD12PbdBsyGFyoUD9ObLKXEGrj8IY1iL25DjsNZEq40w\nriD1TaiMsJoo6wNQOcWU//MbNCnwW7EjoW4yDsz7zQKBgQDWclPH5HMxeivhvNOF\nosoAYbEvewecZT4ZkfCg2Dy//vxWsw1OTOHW0XjZEZTNcKBN59dtdyDEXP9CqoUa\n+M6dFloFtD70WN0/M4yPkoUe/nYVFHCFyndiAGqZeENYPHjbnT/yDjYy9zak8V6n\n5VLd+b5jAZmr7E9UM/iBbckopQKBgQDK/BoN/t3fD9C/nh5PkShkj5zCYSLZlJD6\ntInGBCxt78kd21ql5aLiQhWTmeWQcm0kA/ms1MW0Nr7Ctg2ZYF8UhzU0I+Zl//dS\nDOjlqIG9ETBYpvEnUcsYCGv5z329677sC2p4xPpzf07a8kglhNy9V5fB/lXJycnB\ Au9nIeQepQKBgAhldY5QDYqUY/90qzuCQjJ9oLhhMs0W0bWily9VCBvkWfDzFcRJ\nElac4QRuwcrBbCVgvHiWv3uwwHXVw1xo/X39EA1FH2nlyNPeqtQ8QmYSRIFSyY0T\nflUh+wqDQO/Ffl3q7EQH9mtMbqFKqhAc1H/IdYHe4CtxFzIOzt4SdFvZAoGAcaNl\nqsQuznx6L2yEJ6Nqa7IC3semzQzhhZmhMBySCxIdE/wD6bB/2g+JKNMVtCJ7e5hG\nJT4RWOz1KujlACL11/ZCEOiwShZdDbBwinImAAUpfdgoVgzymIfOe1JwYO0kO93A\nQ9BzLkntiaHuRiL1uYLaUR7kRE4WB1pvUNumbIkCgYBeL0e83vKdVjknBk7pU9cH\nj8oCQIEIp7WjxAopA21ms7bBhzqQAMOCzAfMTcjHXt5KsS7cBUKlUoSQ1QP714TD\nz/ffu2qOaUVa11twItFlFnw+mlhKPjf1LaT0IothBS29e4WrKwu1gUJMzn4GWgS5\nIE++a2brP0gXptVhLr6rnA==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@lorean-4b059.iam.gserviceaccount.com",
    "client_id": "116525168645005995658",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40lorean-4b059.iam.gserviceaccount.com",
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
