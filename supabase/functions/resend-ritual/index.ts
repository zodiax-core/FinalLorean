// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { action, payload, apiKey: providedApiKey } = body;

        // Use environment variable if set, otherwise use the key provided by the client
        const apiKey = Deno.env.get("RESEND_API_KEY") || providedApiKey;

        if (!apiKey || apiKey === 're_xxxxxxxxx') {
            throw new Error("Resend API Key is required. Set RESEND_API_KEY env var or provide it in the request.");
        }

        let endpoint = "https://api.resend.com/emails";
        let requestBody = {};

        if (action === "add_to_audience") {
            const audienceId = payload.audienceId || 'e18399b4-4d3d-4b09-a26f-c768d5f678ec';
            endpoint = `https://api.resend.com/audiences/${audienceId}/contacts`;
            requestBody = {
                email: payload.email,
                first_name: payload.firstName || '',
                last_name: payload.lastName || '',
                unsubscribed: false
            };
        } else {
            // Default action: send_email
            endpoint = "https://api.resend.com/emails";
            requestBody = {
                from: payload.from || "Lorean <onboarding@resend.dev>",
                to: Array.isArray(payload.to) ? payload.to : [payload.to],
                subject: payload.subject || "Lorean Ritual Update",
                html: payload.html,
            };
        }

        console.log(`Resend Action: ${action || 'send_email'} | Endpoint: ${endpoint}`);

        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        const data = await res.json();

        return new Response(JSON.stringify(data), {
            status: res.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Resend Ritual Edge Function Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
