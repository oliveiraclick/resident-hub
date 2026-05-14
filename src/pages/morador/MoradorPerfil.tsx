import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Save, Trash2, AlertTriangle, Users, Sparkles, Store, Mail, Phone, MapPin, Hash, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QrDisplay from "@/components/QrDisplay";
import { APP_VERSION_LABEL } from "@/lib/appVersion";
import AtivarPrestadorModal from "@/components/AtivarPrestadorModal";
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
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        nome: trimmedNome,
        telefone: telefone.trim() || null,
        rua: rua.trim() || null,
        numero_casa: numeroCasa.trim() || null,
      } as any)
      .eq("user_id", user.id);

    if (error) toast.error("Erro ao salvar perfil");
    else toast.success("Perfil atualizado!");
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/auth";
  };

  if (!user) return null;

  return (
    <MoradorLayout title="Meu Perfil" showBack>
      <div className="flex flex-col gap-8 max-w-2xl mx-auto pb-20">
        <header className="px-1 text-center sm:text-left">
          <h1 className="text-4xl font-black tracking-tight mb-2">Ajustes</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Gerencie sua conta e identificação</p>
        </header>

        {/* QR ID — Premium Style */}
        <section className="animate-in fade-in duration-500">
          <Card className="border-none shadow-premium rounded-[48px] overflow-hidden bg-gradient-to-br from-header-bg to-header-mid text-white">
            <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
              <div className="h-24 w-24 rounded-[32px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner-glass">
                <span className="text-3xl font-black text-primary">
                  {nome?.charAt(0)?.toUpperCase() || "M"}
                </span>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-white">{nome || "Morador"}</h2>
                <div className="flex items-center justify-center gap-2 text-white/50">
                   <Mail size={14} />
                   <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>
              
              <div className="w-full max-w-[200px] p-4 bg-white rounded-[32px] shadow-2xl animate-in zoom-in-90 duration-700">
                <QrDisplay value={user.id} label="" size={160} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Seu QR Code Exclusivo</p>
            </CardContent>
          </Card>
        </section>

        {/* Formulário — Modern Style */}
        <section className="animate-in fade-in-up duration-500 delay-150">
          <div className="flex items-center gap-2 mb-4 px-1">
             <div className="w-1.5 h-4 bg-primary rounded-full" />
             <h2 className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest">Informações Pessoais</h2>
          </div>
          <Card className="border-none shadow-soft rounded-[32px] bg-card">
            <CardContent className="flex flex-col gap-6 p-8">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-2xl" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label><UserCircle size={10} className="inline mr-1" /> Nome Completo</label>
                      <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="h-14 rounded-2xl bg-muted/50 border-none font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label><Phone size={10} className="inline mr-1" /> WhatsApp</label>
                      <Input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="h-14 rounded-2xl bg-muted/50 border-none font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label><MapPin size={10} className="inline mr-1" /> Bloco / Rua</label>
                      <Input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Nome da rua" className="h-14 rounded-2xl bg-muted/50 border-none font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label><Hash size={10} className="inline mr-1" /> Apto / Casa</label>
                      <Input value={numeroCasa} onChange={(e) => setNumeroCasa(e.target.value)} placeholder="Ex: 101" className="h-14 rounded-2xl bg-muted/50 border-none font-bold" />
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 gap-3 mt-2">
                    <Save size={20} />
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Ações Rápidas */}
        <section className="grid grid-cols-1 gap-4 animate-in fade-in-up duration-500 delay-300">
          {!hasPrestadorRole ? (
            <button 
              onClick={() => setShowAtivarModal(true)}
              className="group flex items-center gap-4 p-5 rounded-[28px] bg-primary/5 border-2 border-dashed border-primary/20 hover:bg-primary/10 transition-all text-left"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                 <Sparkles size={24} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-black text-foreground leading-tight">Quer vender no App?</p>
                <p className="text-xs text-muted-foreground font-medium">Ative seu perfil de vendedor agora</p>
              </div>
              <ChevronRight size={20} className="text-primary/40" />
            </button>
          ) : (
            <Button
              onClick={() => navigate("/prestador")}
              className="h-16 rounded-[28px] bg-indigo-500 text-white hover:bg-indigo-600 border-none shadow-lg shadow-indigo-500/20 font-black text-base gap-3"
            >
              <Store size={22} /> Módulo Vendedor
            </Button>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => navigate("/morador/entre-amigos")} variant="secondary" className="h-14 rounded-2xl font-black text-sm bg-muted/80 hover:bg-muted gap-2 border-none">
              <Users size={18} /> Entre Amigos
            </Button>
            <Button onClick={handleLogout} variant="destructive" className="h-14 rounded-2xl font-black text-sm gap-2 border-none shadow-lg shadow-destructive/20">
              <LogOut size={18} /> Sair do App
            </Button>
          </div>
        </section>

        <footer className="text-center space-y-4 pt-4">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Versão {APP_VERSION_LABEL}</p>
           <DeleteAccountSection userId={user.id} onDeleted={handleLogout} />
        </footer>
      </div>

      <AtivarPrestadorModal open={showAtivarModal} onOpenChange={setShowAtivarModal} onSuccess={() => window.location.reload()} />
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
      toast.success("Conta excluída.");
      onDeleted();
    } catch { toast.error("Erro ao excluir."); }
    finally { setDeleting(false); }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 underline hover:text-destructive transition-colors">Excluir Minha Conta</button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[32px] border-none shadow-premium">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <AlertTriangle className="text-destructive" /> Tem certeza?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium">
            Essa ação é irreversível. Seus dados serão apagados permanentemente. Digite <strong>EXCLUIR</strong> para confirmar:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder='Digite "EXCLUIR"' className="h-14 rounded-2xl bg-muted/50 border-none font-bold mt-4" />
        <AlertDialogFooter className="gap-2 mt-6">
          <AlertDialogCancel className="h-12 rounded-xl font-bold">Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={confirmText !== "EXCLUIR" || deleting} onClick={handleDelete} className="h-12 rounded-xl bg-destructive text-white font-black">
            {deleting ? "Excluindo..." : "Confirmar Exclusão"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MoradorPerfil;
