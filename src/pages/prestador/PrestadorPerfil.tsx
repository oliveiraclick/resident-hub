import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Save, User, Phone, Briefcase, FileText, Camera, Trash2, AlertTriangle } from "lucide-react";
import { useCategorias } from "@/hooks/useCategorias";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PrestadorPerfil = () => {
  const { user, roles, signOut } = useAuth();
  const condominioId = roles[0]?.condominio_id;
  const { categorias } = useCategorias();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !condominioId) return;

    const fetchData = async () => {
      const [profileRes, prestadorRes] = await Promise.all([
        supabase.from("profiles").select("nome, telefone, avatar_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("prestadores").select("id, especialidade, descricao").eq("user_id", user.id).eq("condominio_id", condominioId).limit(1).maybeSingle(),
      ]);

      if (profileRes.data) {
        setNome(profileRes.data.nome || "");
        setTelefone((profileRes.data as any).telefone || "");
        setAvatarUrl((profileRes.data as any).avatar_url || null);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB"); return; }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar foto"); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url } as any).eq("user_id", user.id);
    setAvatarUrl(url);
    toast.success("Foto atualizada!");
  };

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
      <div className="flex flex-col gap-4 pb-6 -mx-4 -mt-4">
        {/* Hero header with gradient */}
        <div className="relative overflow-hidden">
          <div
            className="relative flex flex-col items-center pt-8 pb-14"
            style={{
              background: "linear-gradient(145deg, hsl(var(--header-bg)) 0%, hsl(var(--header-mid)) 40%, hsl(var(--primary)) 100%)",
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute top-4 right-8 w-24 h-24 rounded-full opacity-10"
              style={{ background: "hsl(var(--primary-light))", filter: "blur(30px)" }} />
            <div className="absolute bottom-8 left-4 w-32 h-32 rounded-full opacity-10"
              style={{ background: "hsl(var(--primary))", filter: "blur(40px)" }} />

            {/* Avatar */}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="relative z-10 h-20 w-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border-2 border-white/20 shadow-lg overflow-hidden group"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User size={36} className="text-white" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera size={20} className="text-white" />
              </div>
            </button>

            {/* Name & email */}
            <p className="relative z-10 mt-3 text-[20px] font-bold text-white">{nome || "Prestador"}</p>
            <p className="relative z-10 text-[13px] text-white/70 mt-0.5">{user.email}</p>

            {especialidade && (
              <span className="relative z-10 mt-2 text-[11px] font-semibold text-white bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20">
                {especialidade}
              </span>
            )}
          </div>

          {/* Wave cutout */}
          <svg
            viewBox="0 0 430 30"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-full h-[30px]"
          >
            <path
              d="M0,15 Q107,35 215,15 Q323,-5 430,15 L430,30 L0,30 Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>

        {/* Form */}
        <div className="px-4 flex flex-col gap-4">
          <Card className="rounded-card shadow-md border-0">
            <CardContent className="flex flex-col gap-4 p-5">
              <p className="text-[16px] font-semibold text-foreground">Dados pessoais</p>

              {loading ? (
                <p className="text-[13px] text-muted-foreground">Carregando...</p>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground ml-1 flex items-center gap-1.5">
                      <User size={12} /> Nome completo
                    </label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground ml-1 flex items-center gap-1.5">
                      <Phone size={12} /> Telefone / WhatsApp
                    </label>
                    <Input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground ml-1 flex items-center gap-1.5">
                      <Briefcase size={12} /> Especialidade
                    </label>
                    <Select value={especialidade} onValueChange={setEspecialidade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua especialidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.nome}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground ml-1 flex items-center gap-1.5">
                      <FileText size={12} /> Descrição profissional
                    </label>
                    <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Conte sobre seus serviços..." rows={3} />
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="mt-2 gap-2 h-[48px] rounded-button text-[15px] font-semibold">
                    <Save size={18} />
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Logout */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-2 h-[48px] rounded-button text-[15px] font-medium"
          >
            <LogOut size={18} />
            Sair da conta
          </Button>

          {/* Excluir conta */}
          <DeleteAccountSection userId={user.id} onDeleted={handleLogout} />
        </div>
      </div>
    </PrestadorLayout>
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
    <Card className="border-destructive/30 rounded-card shadow-md border-0">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 size={18} className="text-destructive" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">Excluir minha conta</p>
            <p className="text-[13px] text-muted-foreground">Ação permanente. Todos os seus dados serão removidos.</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full gap-2 h-[48px] rounded-button text-[15px] font-semibold">
              <Trash2 size={16} /> Excluir minha conta
            </Button>
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
      </CardContent>
    </Card>
  );
};

export default PrestadorPerfil;
