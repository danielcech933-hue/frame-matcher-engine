import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL");
  let key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!key) {
    try {
      const parsed = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
      key = parsed.default || Object.values(parsed)[0] || "";
    } catch {}
  }

  if (!url || !key) {
    return new Response(JSON.stringify({ ok: false, error: "Supabase server credentials missing" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const db = createClient(url, key);
  const now = new Date().toISOString();
  const { error } = await db.from("news_refresh_state").upsert({
    id: true,
    last_refreshed_at: now,
    last_error: null,
    updated_at: now,
  });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    started: true,
    message: "News refresh is handled by the scheduled external worker.",
  }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
