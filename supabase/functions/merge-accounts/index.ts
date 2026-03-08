import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is platform_admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: isAdmin } = await adminClient.rpc("is_platform_admin", { p_user_id: caller.id });
    if (!isAdmin) throw new Error("Not authorized");

    const { morador_user_id, prestador_user_id } = await req.json();
    if (!morador_user_id || !prestador_user_id) throw new Error("Missing user IDs");
    if (morador_user_id === prestador_user_id) throw new Error("Cannot merge same user");

    // Verify morador exists
    const { data: moradorRole } = await adminClient
      .from("user_roles")
      .select("id, condominio_id")
      .eq("user_id", morador_user_id)
      .eq("role", "morador")
      .maybeSingle();
    if (!moradorRole) throw new Error("Morador role not found for target user");

    // Verify prestador exists
    const { data: prestadorRole } = await adminClient
      .from("user_roles")
      .select("id, condominio_id")
      .eq("user_id", prestador_user_id)
      .eq("role", "prestador")
      .maybeSingle();
    if (!prestadorRole) throw new Error("Prestador role not found for source user");

    const condominioId = prestadorRole.condominio_id;

    // 1. Update prestadores record: change user_id to morador
    const { error: prestErr } = await adminClient
      .from("prestadores")
      .update({ user_id: morador_user_id })
      .eq("user_id", prestador_user_id);
    if (prestErr) throw new Error("Failed to migrate prestador: " + prestErr.message);

    // 2. Add prestador role to morador user
    const { error: roleErr } = await adminClient.from("user_roles").insert({
      user_id: morador_user_id,
      role: "prestador",
      condominio_id: condominioId,
      aprovado: true,
    });
    if (roleErr && !roleErr.message.includes("duplicate")) {
      throw new Error("Failed to add role: " + roleErr.message);
    }

    // 3. Tables like servicos, produtos, lojas reference prestador_id FK
    // Since we updated prestadores.user_id, the FK chain is already correct
    // No need to update individual records

    // 5. Delete old user's roles and profile
    await adminClient.from("user_roles").delete().eq("user_id", prestador_user_id);
    await adminClient.from("profiles").delete().eq("user_id", prestador_user_id);
    await adminClient.from("device_tokens").delete().eq("user_id", prestador_user_id);

    // 6. Delete the old auth user
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(prestador_user_id);
    if (deleteErr) {
      console.error("Failed to delete auth user (non-fatal):", deleteErr.message);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Contas unificadas com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
