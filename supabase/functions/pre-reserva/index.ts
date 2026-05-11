// Edge function chamada pela IA do condomínio (WhatsApp) para criar uma pré-reserva
// que o morador precisa confirmar dentro de 30 minutos no app.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRE_RESERVA_MINUTOS = 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1) Autenticação por token compartilhado com a IA
    const expected = Deno.env.get("EXTERNAL_AI_API_KEY");
    const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || req.headers.get("x-api-key");
    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { telefone, condominio_id, espaco_id, espaco_nome, data, horario_inicio, horario_fim } = body || {};

    if (!telefone || !condominio_id || !data || !horario_inicio || (!espaco_id && !espaco_nome)) {
      return new Response(
        JSON.stringify({ error: "missing_fields", required: ["telefone", "condominio_id", "data", "horario_inicio", "espaco_id ou espaco_nome"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 2) Localiza o espaço (por id ou por nome)
    let espacoQuery = supabase.from("espacos").select("id, nome, condominio_id").eq("condominio_id", condominio_id);
    if (espaco_id) espacoQuery = espacoQuery.eq("id", espaco_id);
    else espacoQuery = espacoQuery.ilike("nome", espaco_nome!);
    const { data: espaco } = await espacoQuery.limit(1).maybeSingle();
    if (!espaco) {
      return new Response(JSON.stringify({ error: "espaco_nao_encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Localiza o morador pelo telefone
    const { data: moradorRows } = await supabase.rpc("find_morador_by_phone", {
      _telefone: telefone,
      _condominio_id: condominio_id,
    });
    const morador = Array.isArray(moradorRows) ? moradorRows[0] : moradorRows;
    if (!morador?.user_id) {
      return new Response(JSON.stringify({ error: "morador_nao_encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4) Limpa pré-reservas expiradas e checa conflito
    await supabase.rpc("expirar_pre_reservas");

    const fim = horario_fim || `${horario_inicio.slice(0, 2)}:59:50`;

    const { data: conflitos } = await supabase
      .from("reservas")
      .select("id, status, horario_inicio, horario_fim")
      .eq("espaco_id", espaco.id)
      .eq("data", data)
      .in("status", ["confirmada", "pre_reserva"]);

    const overlap = (conflitos || []).some((r: any) => {
      return r.horario_inicio < fim && r.horario_fim > horario_inicio;
    });
    if (overlap) {
      return new Response(JSON.stringify({ error: "horario_indisponivel" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5) Cria a pré-reserva
    const expira_em = new Date(Date.now() + PRE_RESERVA_MINUTOS * 60 * 1000).toISOString();
    const { data: nova, error: insErr } = await supabase
      .from("reservas")
      .insert({
        condominio_id,
        espaco_id: espaco.id,
        morador_id: morador.user_id,
        data,
        horario_inicio,
        horario_fim: fim,
        status: "pre_reserva",
        expira_em,
      })
      .select("id")
      .single();

    if (insErr) {
      return new Response(JSON.stringify({ error: "insert_failed", details: insErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        pre_reserva_id: nova.id,
        morador: { user_id: morador.user_id, nome: morador.nome },
        espaco: { id: espaco.id, nome: espaco.nome },
        expira_em,
        minutos_para_confirmar: PRE_RESERVA_MINUTOS,
        mensagem: `Pré-reserva criada! ${morador.nome || "Morador"}, abra o Morador.app e confirme em até ${PRE_RESERVA_MINUTOS} minutos para garantir o horário.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "internal", details: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
