import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const RecuperarSenha = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Informe seu email");
      return;
    }
    setSubmitting(true);
    const redirectBase = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${redirectBase}/auth/resetar`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-card bg-primary">
          <span className="text-title-lg text-primary-foreground">S</span>
        </div>
        <h1 className="mt-4 text-title-lg text-foreground">Recuperar senha</h1>
        <p className="mt-1 text-subtitle text-muted-foreground">
          Informe seu email para receber o link de recuperação
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 max-w-md mx-auto w-full">
        <div className="flex flex-col gap-1">
          <label className="ml-1">Email</label>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-[52px]"
          />
        </div>

        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Enviando..." : "Enviar link de recuperação"}
        </Button>

        <Link
          to="/auth"
          className="flex items-center justify-center gap-1 text-sm font-semibold text-primary py-4"
        >
          <ArrowLeft size={16} />
          Voltar ao login
        </Link>
      </form>
    </div>
  );
};

export default RecuperarSenha;
