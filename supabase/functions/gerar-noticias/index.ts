import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active categories from database
    const { data: categorias, error: catError } = await supabase
      .from("noticias_categorias")
      .select("nome, emoji")
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (catError || !categorias || categorias.length === 0) {
      console.error("No active categories found:", catError);
      return new Response(JSON.stringify({ success: false, error: "No active categories" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick 3 random categories to generate
    const shuffled = [...categorias].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    const today = new Date().toLocaleDateString("pt-BR", {
      day: "numeric", month: "long", year: "numeric"
    });

    for (const cat of selected) {
      const prompt = `Você é um jornalista brasileiro. Gere uma notícia curta e atual sobre "${cat.nome}" para a data de hoje (${today}).

Retorne EXATAMENTE neste formato JSON (sem markdown, sem backticks):
{"titulo":"título da notícia aqui","resumo":"resumo em 1 frase aqui","conteudo":"texto completo em 2-3 parágrafos aqui"}

Regras:
- Notícia deve parecer real e relevante
- Tom informal mas informativo
- Em português do Brasil
- Conteúdo entre 100-200 palavras`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI error for ${cat.nome}:`, aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const raw = aiData.choices?.[0]?.message?.content || "";
        
        // Clean markdown wrappers if present
        let jsonStr = raw.trim();
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }
        
        const parsed = JSON.parse(jsonStr);

        await supabase.from("noticias").insert({
          categoria: cat.nome,
          titulo: parsed.titulo,
          resumo: parsed.resumo,
          conteudo: parsed.conteudo,
          imagem_emoji: cat.emoji,
        });

        console.log(`Notícia gerada: ${cat.nome} - ${parsed.titulo}`);
      } catch (innerErr) {
        console.error(`Error generating news for ${cat.nome}:`, innerErr);
      }
    }

    // Cleanup: keep only last 100 news items
    const { data: allNews } = await supabase
      .from("noticias")
      .select("id")
      .order("created_at", { ascending: false });

    if (allNews && allNews.length > 100) {
      const idsToDelete = allNews.slice(100).map((n: any) => n.id);
      await supabase.from("noticias").delete().in("id", idsToDelete);
    }

    return new Response(JSON.stringify({ success: true, generated: selected.map(c => c.nome) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gerar-noticias error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
