import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { deviceToken, email, enabled, data } = body ?? {};

    if (typeof deviceToken !== "string" || !UUID_RE.test(deviceToken)) {
      return json({ error: "Invalid deviceToken" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Upsert snapshot if data provided
    if (data && typeof data === "object") {
      const { error } = await supabase.from("cloud_snapshots").upsert({
        device_token: deviceToken,
        data,
        updated_at: new Date().toISOString(),
      });
      if (error) return json({ error: error.message }, 500);
    }

    // Upsert subscriber if email provided
    if (email !== undefined) {
      if (email === null || email === "") {
        // Disable / remove subscription
        await supabase.from("recap_subscribers").delete().eq("device_token", deviceToken);
      } else {
        if (typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 255) {
          return json({ error: "Invalid email" }, 400);
        }
        const { error } = await supabase.from("recap_subscribers").upsert(
          {
            device_token: deviceToken,
            email: email.toLowerCase().trim(),
            enabled: enabled === false ? false : true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "device_token" },
        );
        if (error) return json({ error: error.message }, 500);
      }
    } else if (typeof enabled === "boolean") {
      await supabase
        .from("recap_subscribers")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("device_token", deviceToken);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
