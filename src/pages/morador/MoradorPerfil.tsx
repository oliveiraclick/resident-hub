import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Save, Trash2, AlertTriangle, Users, Sparkles, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QrDisplay from "@/components/QrDisplay";
import { APP_VERSION_LABEL } from "@/lib/appVersion";
import AtivarPrestadorModal from "@/components/AtivarPrestadorModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MoradorPerfil = () => {
  const { user, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const [showAtivarModal, setShowAtivarModal] = useState(false);
  const hasPrestadorRole = roles.some((r) => r.role === "prestador");

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

    const trimmedNome = nome.trim();
    if (trimmedNome.length < 2 || trimmedNome.length > 100) {
      toast.error("Nome deve ter entre 2 e 100 caracteres");
      return;
    }
    const trimmedTelefone = telefone.trim();
    if (trimmedTelefone && (trimmedTelefone.length < 8 || trimmedTelefone.length > 20)) {
      toast.error("Telefone inválido");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nome: trimmedNome,
        telefone: trimmedTelefone || null,
        rua: rua.trim().slice(0, 200) || null,
        numero_casa: numeroCasa.trim().slice(0, 20) || null,
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
    <MoradorLayout title="Perfil" showBack>
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
                  <Input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
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

        {/* Perfil de vendedor */}
        {!hasPrestadorRole ? (
          <Card className="border-dashed border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Quer vender algo?</p>
                <p className="text-xs text-muted-foreground">Ative seu perfil de vendedor e crie sua loja</p>
              </div>
              <Button size="sm" onClick={() => setShowAtivarModal(true)} className="flex-shrink-0">
                Ativar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => navigate("/prestador")}
            className="w-full text-white border-none"
            style={{ background: "linear-gradient(135deg, hsl(var(--header-bg)), hsl(var(--primary)))" }}
          >
            <Store size={16} />
            Acessar módulo Prestador
          </Button>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Entre Amigos */}
          <Button
            onClick={() => navigate("/morador/entre-amigos")}
            className="w-full text-white border-none"
            style={{ background: "linear-gradient(135deg, hsl(var(--header-bg)), hsl(var(--primary)))" }}
          >
            <Users size={16} />
            Entre Amigos
          </Button>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            className="w-full bg-primary text-white hover:bg-primary/90 border-none"
          >
            <LogOut size={16} />
            Sair
          </Button>
        </div>

        {/* Versão do app */}
        <p className="text-[10px] text-muted-foreground text-center">
          Versão {APP_VERSION_LABEL}
        </p>

        {/* Excluir conta */}
        <DeleteAccountSection userId={user.id} onDeleted={handleLogout} />
      </div>
    </MoradorLayout>
  );
};

const DeleteAccountSection = ({ userId, onDeleted }: { userId: string; onDeleted: () => void }) => {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await supabase.from("profiles").delete().eq("user_id", userId);
      await supabase.from("user_roles").delete().eq("user_id", userId);
      toast.success("Conta excluída com sucesso.");
      onDeleted();
    } catch {
      toast.error("Erro ao excluir conta.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex justify-center pt-2 pb-4">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="text-xs text-muted-foreground underline hover:text-destructive transition-colors">
            Excluir minha conta
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-destructive" /> Tem certeza absoluta?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível. Digite <strong>EXCLUIR</strong> para confirmar:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder='Digite "EXCLUIR"' />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== "EXCLUIR" || deleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Confirmar exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MoradorPerfil;
