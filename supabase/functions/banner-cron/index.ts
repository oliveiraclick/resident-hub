import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Activate approved banners whose start date has arrived
    const { data: activated, error: activateErr } = await supabase
      .from("banner_solicitacoes")
      .update({ status: "ativo" })
      .eq("status", "aprovado")
      .lte("data_inicio", today)
      .select("id");

    if (activateErr) console.error("Activate error:", activateErr);

    // Expire active banners whose end date has passed
    const { data: expired, error: expireErr } = await supabase
      .from("banner_solicitacoes")
      .update({ status: "expirado" })
      .eq("status", "ativo")
      .lt("data_fim", today)
      .select("id");

    if (expireErr) console.error("Expire error:", expireErr);

    return new Response(
      JSON.stringify({
        activated: activated?.length || 0,
        expired: expired?.length || 0,
        date: today,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
