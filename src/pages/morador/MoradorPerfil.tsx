import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Save } from "lucide-react";
import QrDisplay from "@/components/QrDisplay";

const MoradorPerfil = () => {
  const { user, signOut } = useAuth();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [rua, setRua] = useState("");
  const [numeroCasa, setNumeroCasa] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome, telefone, rua, numero_casa")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setNome(data.nome || "");
        setTelefone((data as any).telefone || "");
        setRua((data as any).rua || "");
        setNumeroCasa((data as any).numero_casa || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        rua: rua.trim() || null,
        numero_casa: numeroCasa.trim() || null,
      } as any)
      .eq("user_id", user.id);

    if (error) {
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
    <MoradorLayout>
      <div className="flex flex-col gap-4 max-w-md mx-auto pb-6">
        {/* QR ID */}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xl font-bold text-primary">
                {nome?.charAt(0)?.toUpperCase() || "M"}
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground">{nome || "Morador"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="w-full border-t border-border pt-4">
              <QrDisplay value={user.id} label="Seu QR de identificação" size={160} />
            </div>
          </CardContent>
        </Card>

        {/* Dados pessoais */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <p className="text-base font-semibold text-foreground">Dados pessoais</p>

            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="ml-1">Nome completo</label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="ml-1">Telefone</label>
                  <Input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-0000" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="ml-1">Rua / Endereço</label>
                  <Input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Nome da rua" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="ml-1">Número da casa / apto</label>
                  <Input value={numeroCasa} onChange={(e) => setNumeroCasa(e.target.value)} placeholder="Ex: 101, Casa 5" />
                </div>

                <Button onClick={handleSave} disabled={saving} className="mt-2">
                  <Save size={16} />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button variant="outline" onClick={handleLogout} className="text-destructive border-destructive hover:bg-destructive/5">
          <LogOut size={16} />
          Sair da conta
        </Button>
      </div>
    </MoradorLayout>
  );
};

export default MoradorPerfil;
