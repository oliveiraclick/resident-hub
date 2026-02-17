import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // GET: fetch convite by token (public, for visitor registration page)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");

      if (!token) {
        return new Response(JSON.stringify({ error: "Token não fornecido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: convite, error } = await supabase
        .from("convites_visitante")
        .select("id, nome_visitante, data_visita, horario_inicio, horario_fim, status, qr_code")
        .eq("token", token)
        .maybeSingle();

      if (error || !convite) {
        return new Response(JSON.stringify({ error: "Convite não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if expired
      const today = new Date().toISOString().split("T")[0];
      if (convite.data_visita < today && convite.status === "pendente") {
        await supabase
          .from("convites_visitante")
          .update({ status: "expirado" })
          .eq("id", convite.id);

        return new Response(JSON.stringify({ error: "Convite expirado" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (convite.status === "usado") {
        return new Response(JSON.stringify({ error: "Convite já utilizado" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ convite }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: register visitor (name + photo)
    if (req.method === "POST") {
      const formData = await req.formData();
      const token = formData.get("token") as string;
      const nome = formData.get("nome") as string;
      const foto = formData.get("foto") as File | null;

      if (!token || !nome) {
        return new Response(JSON.stringify({ error: "Token e nome são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch convite
      const { data: convite, error: fetchError } = await supabase
        .from("convites_visitante")
        .select("id, status, data_visita, condominio_id")
        .eq("token", token)
        .maybeSingle();

      if (fetchError || !convite) {
        return new Response(JSON.stringify({ error: "Convite não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (convite.status !== "pendente") {
        return new Response(JSON.stringify({ error: "Convite já foi utilizado ou expirou" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check expiration
      const today = new Date().toISOString().split("T")[0];
      if (convite.data_visita < today) {
        await supabase.from("convites_visitante").update({ status: "expirado" }).eq("id", convite.id);
        return new Response(JSON.stringify({ error: "Convite expirado" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upload photo if provided
      let fotoUrl: string | null = null;
      if (foto && foto.size > 0) {
        const ext = foto.name.split(".").pop() || "jpg";
        const path = `visitantes/${convite.id}.${ext}`;

        // Ensure bucket exists (create if not)
        await supabase.storage.createBucket("visitantes", { public: true }).catch(() => {});

        const { error: uploadError } = await supabase.storage
          .from("visitantes")
          .upload(path, foto, { upsert: true, contentType: foto.type });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("visitantes").getPublicUrl(path);
          fotoUrl = urlData.publicUrl;
        }
      }

      // Generate unique QR code
      const qrCode = crypto.randomUUID();

      // Update convite
      const { error: updateError } = await supabase
        .from("convites_visitante")
        .update({
          nome_registrado: nome,
          foto_url: fotoUrl,
          qr_code: qrCode,
          status: "registrado",
        })
        .eq("id", convite.id);

      if (updateError) {
        return new Response(JSON.stringify({ error: "Erro ao registrar" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, qr_code: qrCode }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
