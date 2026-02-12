import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const TesteAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setResult({ action: "signUp", data, error });
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setResult({ action: "signIn", data, error });
    await checkSession();
    setLoading(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    setResult({ action: "signOut", error });
    setSession(null);
  };

  const fetchRoles = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) {
      setResult({ action: "roles", error: "Não logado" });
      return;
    }
    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", s.user.id);
    setResult({ action: "roles", data, error });
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h1>Teste Auth</h1>

      <div style={{ marginBottom: 16 }}>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginRight: 8 }} />
        <input placeholder="senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginRight: 8 }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={handleSignUp} disabled={loading}>Sign Up</button>
        <button onClick={handleSignIn} disabled={loading}>Sign In</button>
        <button onClick={handleSignOut}>Sign Out</button>
        <button onClick={checkSession}>Check Session</button>
        <button onClick={fetchRoles}>Fetch Roles</button>
      </div>

      <h3>Session</h3>
      <pre>{JSON.stringify(session, null, 2)}</pre>

      <h3>Resultado</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
};

export default TesteAuth;
