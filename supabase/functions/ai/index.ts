// Tandem AI proxy (optional). Deploy with:
//   supabase functions deploy ai --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// It forwards the app's request to Anthropic, adding your secret key server-side
// so the key never lives in the phone app. Then set VITE_AI_PROXY_URL to:
//   https://YOUR-PROJECT.supabase.co/functions/v1/ai

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), { status: 500, headers: { ...CORS, "content-type": "application/json" } });

  let body: unknown;
  try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400, headers: CORS }); }

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const text = await r.text();
  return new Response(text, { status: r.status, headers: { ...CORS, "content-type": "application/json" } });
});
