import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("is_platform_admin", { p_user_id: caller.id });
    if (!isAdmin) throw new Error("Not authorized");

    const body = await req.json();
    const { action, user_id } = body;
    if (!user_id) throw new Error("Missing user_id");

    if (action === "get") {
      const { data: userRes, error } = await adminClient.auth.admin.getUserById(user_id);
      if (error) throw error;
      return new Response(
        JSON.stringify({
          email: userRes.user?.email ?? null,
          email_confirmed_at: userRes.user?.email_confirmed_at ?? null,
          last_sign_in_at: userRes.user?.last_sign_in_at ?? null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      const { email, nome, telefone } = body;

      // Update auth email if provided
      if (typeof email === "string" && email.trim()) {
        const trimmed = email.trim().toLowerCase();
        const { error: emailErr } = await adminClient.auth.admin.updateUserById(user_id, {
          email: trimmed,
          email_confirm: true,
        });
        if (emailErr) throw new Error("Erro ao atualizar email: " + emailErr.message);
      }

      // Update profile fields
      const profilePatch: Record<string, unknown> = {};
      if (typeof nome === "string") profilePatch.nome = nome.trim();
      if (typeof telefone === "string") profilePatch.telefone = telefone.trim();
      if (Object.keys(profilePatch).length > 0) {
        const { error: profErr } = await adminClient
          .from("profiles")
          .update(profilePatch)
          .eq("user_id", user_id);
        if (profErr) throw new Error("Erro ao atualizar perfil: " + profErr.message);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      const { error: resetErr } = await adminClient.auth.admin.updateUserById(user_id, {
        password: "123456"
      });
      if (resetErr) throw new Error("Erro ao resetar senha: " + resetErr.message);
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (e: any) {
    console.error("[admin-user-manage] error:", e?.message);
    return new Response(JSON.stringify({ error: e?.message ?? "Erro" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});