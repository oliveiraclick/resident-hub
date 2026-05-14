import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

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

    // Aceita GET para consultas simples via query params ou POST para flexibilidade
    let params: any = {};
    if (req.method === "POST") {
      params = await req.json().catch(() => ({}));
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      params = {
        telefone: url.searchParams.get("telefone"),
        condominio_id: url.searchParams.get("condominio_id"),
      };
    }

    const { telefone, condominio_id } = params;

    if (!telefone || !condominio_id) {
      return new Response(
        JSON.stringify({ error: "missing_fields", required: ["telefone", "condominio_id"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 2) Localiza o morador pelo telefone
    // Usando RPC para garantir que buscamos corretamente no contexto do condomínio
    const { data: moradorRows, error: moradorErr } = await supabase.rpc("find_morador_by_phone", {
      _telefone: telefone,
      _condominio_id: condominio_id,
    });

    if (moradorErr) throw moradorErr;

    const morador = Array.isArray(moradorRows) ? moradorRows[0] : moradorRows;
    if (!morador?.user_id) {
      return new Response(JSON.stringify({ error: "morador_nao_encontrado", message: "Nenhum morador encontrado com este telefone neste condomínio." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Busca encomendas pendentes (AGUARDANDO_RETIRADA ou EM_CONFIRMACAO)
    // Morador pode perguntar se tem algo "aguardando" ou se "já retirou"
    const { data: encomendas, error: encErr } = await supabase
      .from("pacotes")
      .select(`
        id,
        descricao,
        status,
        created_at,
        codigo_rastreio,
        lotes (entregador)
      `)
      .eq("morador_id", morador.user_id)
      .eq("condominio_id", condominio_id)
      .in("status", ["AGUARDANDO_RETIRADA", "AGUARDANDO_CONFIRMACAO"])
      .order("created_at", { ascending: false });

    if (encErr) throw encErr;

    // 4) Formata a resposta
    // OBS: Omitimos "localizacao" conforme solicitado pelo usuário
    const total = encomendas?.length || 0;
    const lista = (encomendas || []).map(p => ({
      id: p.id,
      descricao: p.descricao,
      entregador: (p.lotes as any)?.entregador || "Não informado",
      status: p.status === "AGUARDANDO_CONFIRMACAO" ? "Aguardando Confirmação no App" : "Disponível na Portaria",
      recebido_em: p.created_at,
      codigo: p.codigo_rastreio || "N/A"
    }));

    return new Response(
      JSON.stringify({
        ok: true,
        morador: { nome: morador.nome, unidade: morador.unidade_numero },
        total,
        encomendas: lista,
        mensagem_sugerida: total > 0 
          ? `Olá ${morador.nome}, você tem ${total} encomenda(s) aguardando retirada na portaria.`
          : `Olá ${morador.nome}, não encontrei nenhuma encomenda pendente para você no momento.`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    return new Response(JSON.stringify({ error: "internal", details: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
