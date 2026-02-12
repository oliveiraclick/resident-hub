import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/teste-auth");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 360, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
      </form>
    </div>
  );
};

export default Login;
