import { useState } from "react";
import logoSymbol from "@/assets/logo-symbol.png";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { APP_VERSION, NATIVE_APP_VERSION } from "@/lib/appVersion";
import { Separator } from "@/components/ui/separator";

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
      {/* Header with gradient */}
      <div className="relative overflow-hidden">
        <div
          className="flex flex-col items-center pt-16 pb-16 px-6"
          style={{
            background: "linear-gradient(145deg, hsl(var(--header-bg)) 0%, hsl(var(--header-mid)) 40%, hsl(var(--primary)) 100%)",
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-5 -right-8 w-44 h-44 rounded-full" style={{ background: "hsla(var(--primary), 0.15)", filter: "blur(40px)" }} />
          <div className="absolute bottom-10 -left-10 w-28 h-28 rounded-full" style={{ background: "hsla(var(--primary), 0.1)", filter: "blur(30px)" }} />

          <img src={logoSymbol} alt="Morador.app" className="h-36 w-36 object-contain relative z-[1]" />
          <h1 className="mt-4 text-title-lg text-white relative z-[1]">Morador.app</h1>
          <p className="mt-1 text-subtitle text-white/60 relative z-[1]">Clicou, Achou!</p>
        </div>
        {/* Wave cutout */}
        <svg viewBox="0 0 430 40" preserveAspectRatio="none" className="absolute -bottom-[1px] left-0 w-full h-[35px] block">
          <path d="M0,20 Q107,45 215,20 Q323,-5 430,20 L430,40 L0,40 Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      <p className="text-sm text-muted-foreground text-center mt-4 mb-2">
        {isLogin ? "Acesse sua conta" : "Crie sua conta"}
      </p>

      {isLogin && (
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
              if (error) toast.error("Erro ao entrar com Google");
              setSubmitting(false);
            }}
            className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              const { error } = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
              if (error) toast.error("Erro ao entrar com Apple");
              setSubmitting(false);
            }}
            className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          </button>
        </div>
      )}

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

      <div className="mt-auto pt-8 pb-6 text-center">
        <p className="text-xs text-muted-foreground/40 mb-1">
          {(() => {
            const params = new URLSearchParams(window.location.search);
            const isNative = params.get("native") === "1" || /\b(capacitor|wv)\b/i.test(navigator.userAgent);
            return isNative ? `App ${NATIVE_APP_VERSION} · Base ${APP_VERSION}` : `Web · Base ${APP_VERSION}`;
          })()}
        </p>
        <p className="text-xs text-muted-foreground/50">app desenvolvido por ia&co. tecnologia</p>
      </div>
    </div>
  );
};

export default Auth;
