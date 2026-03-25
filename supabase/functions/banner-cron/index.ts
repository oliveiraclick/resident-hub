import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function logFunction(fnName: string, status: string, durationMs: number, error?: string, details?: any) {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await supabase.from("function_logs").insert({
      function_name: fnName,
      status,
      duration_ms: durationMs,
      error: error || null,
      details: details || {},
    });
  } catch (_) { /* silent */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    const { data: activated, error: activateErr } = await supabase
      .from("banner_solicitacoes")
      .update({ status: "ativo" })
      .eq("status", "aprovado")
      .lte("data_inicio", today)
      .select("id");

    if (activateErr) console.error("Activate error:", activateErr);

    const { data: expired, error: expireErr } = await supabase
      .from("banner_solicitacoes")
      .update({ status: "expirado" })
      .eq("status", "ativo")
      .lt("data_fim", today)
      .select("id");

    if (expireErr) console.error("Expire error:", expireErr);

    const result = {
      activated: activated?.length || 0,
      expired: expired?.length || 0,
      date: today,
    };

    await logFunction("banner-cron", "success", Date.now() - startTime, undefined, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    await logFunction("banner-cron", "error", Date.now() - startTime, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
