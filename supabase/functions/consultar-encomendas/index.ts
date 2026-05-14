import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const PENDING_PACKAGE_STATUSES = ["RECEBIDO", "TRIADO", "AGUARDANDO_RETIRADA", "AGUARDANDO_CONFIRMACAO"];
const PROFILE_PAGE_SIZE = 1000;
const MAX_PROFILE_ROWS_TO_SCAN = 10000;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizePhone = (value?: string | null) => (value || "").replace(/\D/g, "");

const phoneCandidates = (value?: string | null) => {
  const digits = normalizePhone(value);
  const candidates = new Set<string>();

  if (!digits) return candidates;

  candidates.add(digits);

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    candidates.add(digits.slice(2));
  }

  if (digits.startsWith("0")) {
    candidates.add(digits.replace(/^0+/, ""));
  }

  if (digits.length >= 11) candidates.add(digits.slice(-11));
  if (digits.length >= 10) candidates.add(digits.slice(-10));

  return candidates;
};

const phonesMatch = (storedPhone?: string | null, providedPhone?: string | null) => {
  const stored = phoneCandidates(storedPhone);
  const provided = phoneCandidates(providedPhone);

  for (const value of stored) {
    if (provided.has(value)) return true;
  }

  return false;
};

async function findMoradorByPhone(supabase: ReturnType<typeof createClient>, telefone: string, condominioId?: string | null) {
  let from = 0;
  const matchedProfiles: Array<{ user_id: string; nome: string; telefone: string | null }> = [];

  while (from < MAX_PROFILE_ROWS_TO_SCAN) {
    const to = from + PROFILE_PAGE_SIZE - 1;
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, nome, telefone")
      .not("telefone", "is", null)
      .range(from, to);

    if (error) throw error;
    if (!profiles?.length) break;

    for (const profile of profiles) {
      if (phonesMatch(profile.telefone, telefone)) {
        matchedProfiles.push(profile as { user_id: string; nome: string; telefone: string | null });
      }
    }

    if (profiles.length < PROFILE_PAGE_SIZE) break;
    from += PROFILE_PAGE_SIZE;
  }

  if (matchedProfiles.length === 0) return { status: "not_found" as const };

  const userIds = [...new Set(matchedProfiles.map((profile) => profile.user_id))];
  let rolesQuery = supabase
    .from("user_roles")
    .select("user_id, condominio_id, role, aprovado")
    .in("user_id", userIds)
    .eq("role", "morador")
    .eq("aprovado", true);

  if (condominioId) rolesQuery = rolesQuery.eq("condominio_id", condominioId);

  const { data: roles, error: rolesError } = await rolesQuery;
  if (rolesError) throw rolesError;

  const matches = (roles || [])
    .map((role) => {
      const profile = matchedProfiles.find((item) => item.user_id === role.user_id);
      if (!profile || !role.condominio_id) return null;
      return {
        user_id: profile.user_id,
        nome: profile.nome,
        telefone: profile.telefone,
        condominio_id: role.condominio_id as string,
      };
    })
    .filter(Boolean) as Array<{ user_id: string; nome: string; telefone: string | null; condominio_id: string }>;

  if (matches.length === 0) return { status: "not_found" as const };

  const distinctCondominios = new Set(matches.map((match) => match.condominio_id));
  if (!condominioId && distinctCondominios.size > 1) {
    return { status: "ambiguous" as const, matches };
  }

  return { status: "found" as const, morador: matches[0] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const expected = Deno.env.get("EXTERNAL_AI_API_KEY")?.trim();
    const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || req.headers.get("x-api-key")?.trim();
    if (!expected || provided !== expected) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    let params: Record<string, unknown> = {};
    if (req.method === "POST") {
      params = await req.json().catch(() => ({}));
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      params = {
        telefone: url.searchParams.get("telefone") || url.searchParams.get("phone"),
        condominio_id: url.searchParams.get("condominio_id"),
      };
    }

    const telefone = String(params.telefone || params.phone || "").trim();
    const condominio_id = String(params.condominio_id || "").trim() || null;

    if (!telefone) {
      return jsonResponse({ error: "missing_fields", required: ["telefone"] }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const moradorResult = await findMoradorByPhone(supabase, telefone, condominio_id);

    if (moradorResult.status === "not_found") {
      return jsonResponse({
        ok: false,
        error: "morador_nao_encontrado",
        total: 0,
        encomendas: [],
        mensagem_sugerida: "Não encontrei um morador aprovado com este telefone. Confira se o telefone do cadastro no Morador.app é o mesmo número usado na conversa com a IA.",
      });
    }

    if (moradorResult.status === "ambiguous") {
      return jsonResponse({
        ok: false,
        error: "condominio_id_required",
        mensagem_sugerida: "Este telefone aparece em mais de um condomínio. Informe o condomínio para consultar as encomendas corretamente.",
      });
    }

    const morador = moradorResult.morador;

    const { data: encomendas, error: encErr } = await supabase
      .from("pacotes")
      .select(`
        id,
        descricao,
        status,
        created_at,
        recebido_em,
        codigo_rastreio,
        lotes (entregador)
      `)
      .eq("morador_id", morador.user_id)
      .eq("condominio_id", morador.condominio_id)
      .in("status", PENDING_PACKAGE_STATUSES)
      .order("created_at", { ascending: false });

    if (encErr) throw encErr;

    const total = encomendas?.length || 0;
    const lista = (encomendas || []).map(p => ({
      id: p.id,
      descricao: p.descricao || "Encomenda",
      entregador: (p.lotes as any)?.entregador || "Não informado",
      status: p.status === "AGUARDANDO_CONFIRMACAO" ? "Aguardando confirmação no app" : p.status === "AGUARDANDO_RETIRADA" ? "Disponível na portaria" : "Recebida pela portaria",
      recebido_em: p.recebido_em || p.created_at,
      codigo: p.codigo_rastreio || "N/A"
    }));

    return jsonResponse({
      ok: true,
      morador: { nome: morador.nome },
      total,
      encomendas: lista,
      mensagem_sugerida: total > 0
        ? `Olá ${morador.nome}, você tem ${total} encomenda(s) aguardando retirada na portaria.`
        : `Olá ${morador.nome}, não encontrei nenhuma encomenda pendente para você no momento.`
    });

  } catch (e) {
    console.error("consultar-encomendas error", e);
    return jsonResponse({ error: "internal", message: "Não foi possível consultar encomendas no momento." }, 500);
  }
});
