import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const ResetarSenha = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if we already have a session (user clicked link and session was established)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      await supabase.auth.signOut();
      navigate("/auth");
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-card bg-primary">
          <span className="text-title-lg text-primary-foreground">M</span>
        </div>
        <h1 className="mt-4 text-title-lg text-foreground">Nova senha</h1>
        <p className="mt-1 text-subtitle text-muted-foreground">
          Defina sua nova senha
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 max-w-md mx-auto w-full">
        <div className="flex flex-col gap-1">
          <label className="ml-1">Nova senha</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="h-[52px]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1">Confirmar senha</label>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="h-[52px]"
          />
        </div>

        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Atualizando..." : "Atualizar senha"}
        </Button>
      </form>
    </div>
  );
};

export default ResetarSenha;
