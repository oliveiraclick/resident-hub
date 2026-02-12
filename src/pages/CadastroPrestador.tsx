import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import logoMorador from "@/assets/logo-morador.png";

const schema = z.object({
  nome: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  telefone: z.string().trim().min(8, "Telefone inválido").max(20),
  especialidade: z.string().trim().min(2, "Informe a especialidade").max(100),
  descricao: z.string().trim().max(500).optional(),
  condominioId: z.string().uuid("Selecione um condomínio"),
});

interface Condominio {
  id: string;
  nome: string;
}

const CadastroPrestador = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [condominioId, setCondominioId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [condominios, setCondominios] = useState<Condominio[]>([]);

  useEffect(() => {
    supabase.from("condominios").select("id, nome").order("nome").then(({ data }) => {
      if (data) setCondominios(data);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const result = schema.safeParse({ nome, email, password, telefone, especialidade, descricao: descricao || undefined, condominioId });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
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
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { nome: nome.trim(), role: "prestador", condominio_id: condominioId },
          emailRedirectTo: window.location.origin,
        },
      });
      if (signUpError) throw signUpError;

      const userId = signUpData.user?.id;
      if (userId) {
        // Create profile with phone
        await supabase.from("profiles").insert({
          user_id: userId,
          nome: nome.trim(),
          telefone: telefone.trim(),
        });

        // Assign role
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: "prestador",
          condominio_id: condominioId,
        });

        // Create prestador record
        await supabase.from("prestadores").insert({
          user_id: userId,
          condominio_id: condominioId,
          especialidade: especialidade.trim(),
          descricao: descricao.trim() || null,
        });
      }

      toast.success("Cadastro realizado! Verifique seu email para confirmar.");
      navigate("/auth");
    } catch (err: any) {
      const msg = err.message?.includes("already registered")
        ? "Este email já está cadastrado"
        : err.message || "Erro inesperado";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        <Link to="/auth" className="self-start mb-6 flex items-center gap-1 text-muted-foreground">
          <ArrowLeft size={18} />
          <span className="text-sm">Voltar</span>
        </Link>
        <img src={logoMorador} alt="Morador.app" className="h-20 w-20 object-contain" />
        <h1 className="mt-4 text-foreground">Cadastro Prestador</h1>
        <p className="mt-1 text-muted-foreground">Ofereça seus serviços no condomínio</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 max-w-md mx-auto w-full pb-8">
        <div className="flex flex-col gap-1">
          <label className="ml-1">Nome completo</label>
          <Input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
          {errors.nome && <span className="text-xs text-destructive ml-1">{errors.nome}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1">Email</label>
          <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          {errors.email && <span className="text-xs text-destructive ml-1">{errors.email}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1">Senha</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className="text-xs text-destructive ml-1">{errors.password}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1">Telefone / WhatsApp</label>
          <Input type="tel" placeholder="(11) 99999-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} autoComplete="tel" />
          {errors.telefone && <span className="text-xs text-destructive ml-1">{errors.telefone}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1">Condomínio</label>
          <Select value={condominioId} onValueChange={setCondominioId}>
            <SelectTrigger className="h-[52px]">
              <SelectValue placeholder="Selecione o condomínio" />
            </SelectTrigger>
            <SelectContent>
              {condominios.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.condominioId && <span className="text-xs text-destructive ml-1">{errors.condominioId}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1">Especialidade</label>
          <Input placeholder="Ex: Eletricista, Encanador..." value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} />
          {errors.especialidade && <span className="text-xs text-destructive ml-1">{errors.especialidade}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1">Descrição dos serviços (opcional)</label>
          <Textarea placeholder="Descreva brevemente seus serviços..." value={descricao} onChange={(e) => setDescricao(e.target.value)} className="min-h-[80px]" />
          {errors.descricao && <span className="text-xs text-destructive ml-1">{errors.descricao}</span>}
        </div>

        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Aguarde..." : "Criar conta"}
        </Button>

        <div className="flex items-center justify-center gap-1 py-2">
          <span className="text-sm text-muted-foreground">Já tem conta?</span>
          <Link to="/auth" className="text-sm font-semibold text-primary">Faça login</Link>
        </div>
      </form>
    </div>
  );
};

export default CadastroPrestador;
