import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Save, User } from "lucide-react";

const PrestadorPerfil = () => {
  const { user, roles, signOut } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prestadorId, setPrestadorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !condominioId) return;

    const fetchData = async () => {
      const [profileRes, prestadorRes] = await Promise.all([
        supabase.from("profiles").select("nome, telefone").eq("user_id", user.id).maybeSingle(),
        supabase.from("prestadores").select("id, especialidade, descricao").eq("user_id", user.id).eq("condominio_id", condominioId).limit(1).maybeSingle(),
      ]);

      if (profileRes.data) {
        setNome(profileRes.data.nome || "");
        setTelefone((profileRes.data as any).telefone || "");
      }
      if (prestadorRes.data) {
        setPrestadorId(prestadorRes.data.id);
        setEspecialidade(prestadorRes.data.especialidade || "");
        setDescricao(prestadorRes.data.descricao || "");
      }
      setLoading(false);
    };

    fetchData();
  }, [user, condominioId]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const updates = await Promise.all([
      supabase.from("profiles").update({
        nome: nome.trim(),
        telefone: telefone.trim() || null,
      } as any).eq("user_id", user.id),
      prestadorId
        ? supabase.from("prestadores").update({
            especialidade: especialidade.trim(),
            descricao: descricao.trim() || null,
          }).eq("id", prestadorId)
        : Promise.resolve({ error: null }),
    ]);

    if (updates.some((r) => r.error)) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil atualizado!");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/auth";
  };

  if (!user) return null;

  return (
    <PrestadorLayout>
      <div className="flex flex-col gap-4 pb-6">
        {/* Avatar */}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={28} className="text-primary" />
            </div>
            <p className="text-[18px] font-semibold text-foreground">{nome || "Prestador"}</p>
            <p className="text-[13px] text-muted-foreground">{user.email}</p>
            {especialidade && (
              <span className="text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {especialidade}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <p className="text-[15px] font-semibold text-foreground">Dados pessoais</p>

            {loading ? (
              <p className="text-[13px] text-muted-foreground">Carregando...</p>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground ml-1">Nome completo</label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground ml-1">Telefone / WhatsApp</label>
                  <Input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-0000" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground ml-1">Especialidade</label>
                  <Input value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} placeholder="Ex: Eletricista, Jardinagem" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground ml-1">Descrição profissional</label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Conte sobre seus serviços..." rows={3} />
                </div>

                <Button onClick={handleSave} disabled={saving} className="mt-2 gap-1.5">
                  <Save size={16} />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button variant="outline" onClick={handleLogout} className="text-destructive border-destructive hover:bg-destructive/5 gap-1.5">
          <LogOut size={16} />
          Sair da conta
        </Button>
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorPerfil;
