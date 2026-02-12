import { useState } from "react";
import logoMorador from "@/assets/logo-morador.png";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const signupSchema = loginSchema.extend({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
});

const Auth = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const schema = isLogin ? loginSchema : signupSchema;
    const data = isLogin ? { email, password } : { email, password, nome };
    const result = schema.safeParse(data);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as string;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso");
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { nome: nome.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Cadastro realizado! Verifique seu email para confirmar.");
      }
    } catch (err: any) {
      const msg = err.message?.includes("Invalid login")
        ? "Email ou senha incorretos"
        : err.message?.includes("already registered")
        ? "Este email já está cadastrado"
        : err.message || "Erro inesperado";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <img src={logoMorador} alt="Morador.app" className="h-20 w-20 object-contain" />
        <h1 className="mt-4 text-title-lg text-foreground">Morador.app</h1>
        <p className="mt-1 text-subtitle text-muted-foreground">Clicou, Achou!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {isLogin ? "Acesse sua conta" : "Crie sua conta"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 max-w-md mx-auto w-full">
        {!isLogin && (
          <div className="flex flex-col gap-1">
            <label className="ml-1">Nome completo</label>
            <Input
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
            />
            {errors.nome && (
              <span className="text-label text-destructive ml-1">{errors.nome}</span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="ml-1">Email</label>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {errors.email && (
            <span className="text-label text-destructive ml-1">{errors.email}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1">Senha</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <span className="text-label text-destructive ml-1">{errors.password}</span>
          )}
        </div>

        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
        </Button>

        {isLogin && (
          <Link
            to="/auth/recuperar"
            className="text-sm text-center"
            style={{ color: "#64748B" }}
          >
            Esqueci minha senha
          </Link>
        )}

        {isLogin && (
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="text-sm text-muted-foreground">Não tem conta? Cadastre-se como:</span>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/cadastro/morador">Morador</Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/cadastro/prestador">Prestador</Link>
              </Button>
            </div>
          </div>
        )}

        {!isLogin && (
          <div className="flex items-center justify-center gap-1 py-4">
            <span className="text-sm text-muted-foreground">Já tem conta?</span>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrors({}); }}
              className="text-sm font-semibold text-primary"
            >
              Faça login
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Auth;
