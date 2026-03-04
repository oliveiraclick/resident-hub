import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { termo, condominio_id } = await req.json();
    if (!termo || !condominio_id) {
      return new Response(JSON.stringify({ error: "termo and condominio_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get all specialties from this condominium
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: prestadores } = await sb
      .from("prestadores")
      .select("id, especialidade, user_id")
      .eq("condominio_id", condominio_id);

    if (!prestadores || prestadores.length === 0) {
      return new Response(JSON.stringify({ prestadores: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const especialidades = [...new Set(prestadores.map((p: any) => p.especialidade))];

    // 2. Ask AI which specialties match the search term
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Você é um assistente que mapeia itens de festa/evento para categorias de prestadores de serviço.
Dado um item digitado pelo usuário e uma lista de especialidades disponíveis, retorne APENAS as especialidades que são relevantes.
Pense de forma ampla e criativa. Exemplos de mapeamentos esperados:
- "carne" → Açougue, Churrasqueiro
- "frutas", "verduras", "legumes" → Sacolão, Hortifruti, Feira
- "músico", "cantor" → Músico, Cantor, Banda, DJ
- "som", "caixa de som", "microfone" → Aluguel de Som, DJ, Sonorização
- "bolo" → Confeitaria, Confeiteiro, Doceira
- "bebida", "cerveja" → Distribuidora, Bar, Bebidas
- "decoração" → Decorador, Decoração, Balões
Responda SOMENTE com um JSON array de strings. Sem explicação. Exemplo: ["Músico","Marmitas"]
Se nenhuma especialidade for relevante, retorne [].`
          },
          {
            role: "user",
            content: `Item digitado: "${termo}"
Especialidades disponíveis: ${JSON.stringify(especialidades)}
Quais especialidades podem atender esse item?`
          }
        ],
        temperature: 0,
        max_tokens: 200,
      }),
    });

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content?.trim() || "[]";

    let matched: string[] = [];
    try {
      // Extract JSON array from response (might have markdown code block)
      const jsonMatch = content.match(/\[.*\]/s);
      matched = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      matched = [];
    }

    // 3. Filter prestadores matching those specialties
    const results = prestadores.filter((p: any) =>
      matched.some((m: string) => m.toLowerCase() === p.especialidade.toLowerCase())
    );

    // 4. Get profiles
    if (results.length > 0) {
      const uids = [...new Set(results.map((r: any) => r.user_id))];
      const { data: profiles } = await sb
        .from("profiles")
        .select("user_id, nome, avatar_url")
        .in("user_id", uids);

      const pMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const enriched = results.map((r: any) => ({
        id: r.id,
        especialidade: r.especialidade,
        user_id: r.user_id,
        nome: pMap.get(r.user_id)?.nome || "Prestador",
        avatar_url: pMap.get(r.user_id)?.avatar_url || null,
      }));

      return new Response(JSON.stringify({ prestadores: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ prestadores: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
