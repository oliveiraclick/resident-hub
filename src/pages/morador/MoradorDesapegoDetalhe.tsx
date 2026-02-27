import { useEffect, useState, useRef } from "react";
import { formatBRL } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, AlertTriangle, User, ShieldCheck, Trash2, Pencil, Camera, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface DesapegoDetail {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  status: string;
  created_at: string;
  morador_id: string;
  imagem_url: string | null;
  profile?: {
    nome: string;
    telefone: string | null;
    avatar_url: string | null;
  };
  unidade?: {
    bloco: string | null;
    numero: string;
  };
}

const MoradorDesapegoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<DesapegoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSafetyTip, setShowSafetyTip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [saving, setSaving] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);
  const editCameraRef = useRef<HTMLInputElement>(null);

  const isOwner = user && item && user.id === item.morador_id;

  const startEditing = () => {
    if (!item) return;
    setEditTitulo(item.titulo);
    setEditDescricao(item.descricao || "");
    setEditPreco(item.preco != null ? String(item.preco) : "");
    setEditImageFile(null);
    setEditImagePreview(null);
    setEditing(true);
  };

  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file), "image/jpeg", quality);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    let processed = file.size > 1024 * 1024 ? await compressImage(file) : file;
    if (processed.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB"); return; }
    setEditImageFile(processed);
    setEditImagePreview(URL.createObjectURL(processed));
  };

  const handleSave = async () => {
    if (!item || !editTitulo.trim()) return;
    setSaving(true);
    try {
      let imagem_url = item.imagem_url;

      if (editImageFile) {
        const ext = editImageFile.name.split(".").pop();
        const path = `${user!.id}/${item.id}.${ext}`;
        const { error: upErr } = await supabase.storage.from("desapegos").upload(path, editImageFile, { upsert: true });
        if (upErr) { toast.error("Erro ao enviar imagem"); setSaving(false); return; }
        imagem_url = supabase.storage.from("desapegos").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from("desapegos").update({
        titulo: editTitulo.trim(),
        descricao: editDescricao.trim() || null,
        preco: editPreco ? parseFloat(editPreco) : null,
        imagem_url,
      }).eq("id", item.id);

      if (error) throw error;
      setItem({ ...item, titulo: editTitulo.trim(), descricao: editDescricao.trim() || null, preco: editPreco ? parseFloat(editPreco) : null, imagem_url });
      setEditing(false);
      toast.success("Desapego atualizado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    const { error } = await supabase.from("desapegos").delete().eq("id", item.id);
    if (error) {
      toast.error("Erro ao excluir desapego");
    } else {
      toast.success("Desapego excluído");
      navigate(-1);
    }
    setDeleting(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;

    const fetch = async () => {
      const { data, error } = await supabase
        .from("desapegos")
        .select("id, titulo, descricao, preco, status, created_at, morador_id, imagem_url")
        .eq("id", id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      // Fetch profile via secure RPC
      const { data: profiles } = await supabase.rpc("get_desapego_owner_profile", {
        _user_id: data.morador_id,
      });
      const profile = profiles && profiles.length > 0 ? profiles[0] : null;

      // Fetch unidade
      const { data: unidade } = await supabase
        .from("unidades")
        .select("bloco, numero")
        .eq("morador_id", data.morador_id)
        .maybeSingle();

      setItem({
        ...data,
        profile: profile ? { nome: profile.nome, telefone: profile.telefone, avatar_url: profile.avatar_url } : undefined,
        unidade: unidade || undefined,
      });
      setLoading(false);
    };

    fetch();
  }, [id]);

  const openWhatsApp = () => {
    if (!item?.profile?.telefone) return;
    const phone = item.profile.telefone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const text = encodeURIComponent(`Olá, tenho interesse no produto ${item.titulo}`);
    window.open(`https://wa.me/${fullPhone}?text=${text}`, "_blank");
  };

  const handleContactClick = () => {
    setShowSafetyTip(true);
  };

  const isActive = item?.status === "ativo";

  if (loading) {
    return (
      <div className="min-h-screen bg-background mx-auto max-w-[480px] overflow-x-hidden">
        <div className="p-5 space-y-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-[220px] w-full rounded-card" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background mx-auto max-w-[480px] overflow-x-hidden flex flex-col items-center justify-center px-5">
        <p className="text-muted-foreground text-[14px]">Anúncio não encontrado.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft size={16} className="mr-1" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mx-auto max-w-[480px] overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card px-5 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-[15px] font-semibold text-foreground truncate flex-1">{editing ? "Editar Desapego" : "Desapego"}</h1>
        {isOwner && !editing && (
          <button onClick={startEditing} className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Pencil size={16} className="text-primary" />
          </button>
        )}
        {isOwner && !editing && (
          <button onClick={() => setShowDeleteConfirm(true)} className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <Trash2 size={18} className="text-destructive" />
          </button>
        )}
      </header>

      <main className="px-5 pt-5 pb-[100px]">
        {/* Inactive warning */}
        {!isActive && !editing && (
          <div className="flex items-center gap-2 rounded-card bg-destructive/10 px-4 py-3 mb-4">
            <AlertTriangle size={18} className="text-destructive flex-shrink-0" />
            <p className="text-[13px] text-destructive font-medium">Este anúncio não está mais disponível</p>
          </div>
        )}

        {editing ? (
          /* ═══ EDIT MODE ═══ */
          <div className="flex flex-col gap-4">
            {/* Image edit */}
            <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={handleEditImageChange} />
            <input ref={editCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleEditImageChange} />
            <div className="w-full aspect-video rounded-card bg-muted flex items-center justify-center overflow-hidden relative">
              {(editImagePreview || item.imagem_url) ? (
                <>
                  <img src={editImagePreview || item.imagem_url!} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setEditImageFile(null); setEditImagePreview(null); }} className="absolute top-2 right-2 bg-background/80 rounded-full p-1.5">
                    <X size={14} className="text-destructive" />
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => editFileRef.current?.click()}>
                    <ImagePlus size={16} /> Galeria
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => editCameraRef.current?.click()}>
                    <Camera size={16} /> Câmera
                  </Button>
                </div>
              )}
            </div>
            {(editImagePreview || item.imagem_url) && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => editFileRef.current?.click()}>
                  <ImagePlus size={16} /> Trocar foto
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => editCameraRef.current?.click()}>
                  <Camera size={16} /> Câmera
                </Button>
              </div>
            )}

            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Título</label>
              <Input value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} placeholder="Título do desapego" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Descrição</label>
              <Input value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} placeholder="Detalhes do item" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Preço (opcional)</label>
              <Input type="number" value={editPreco} onChange={(e) => setEditPreco(e.target.value)} placeholder="0,00" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving || !editTitulo.trim()}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        ) : (
          /* ═══ VIEW MODE ═══ */
          <>
            {/* Image */}
            <div className="w-full aspect-video rounded-card bg-muted flex items-center justify-center overflow-hidden">
              {item.imagem_url ? (
                <img src={item.imagem_url} alt={item.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <span className="text-[40px]">📦</span>
                  <span className="text-[12px]">Sem imagem</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">Desapego</Badge>
            </div>

            <h2 className="mt-2 text-[22px] font-semibold text-foreground leading-tight">{item.titulo}</h2>

            {item.preco != null && (
              <p className="mt-2 text-[24px] font-bold text-primary">R$ {formatBRL(item.preco)}</p>
            )}

            {item.descricao && (
              <div className="mt-5">
                <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Descrição</h3>
                <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{item.descricao}</p>
              </div>
            )}

            {item.profile && (
              <div className="mt-6 rounded-card bg-card border p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.profile.avatar_url ? (
                    <img src={item.profile.avatar_url} alt={item.profile.nome} className="h-full w-full object-cover" />
                  ) : (
                    <User size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-foreground truncate">{item.profile.nome}</p>
                  {item.unidade && (
                    <p className="text-[12px] text-muted-foreground">
                      {item.unidade.bloco ? `Bloco ${item.unidade.bloco} - ` : ""}
                      {item.unidade.numero}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Fixed WhatsApp button */}
      {isActive && item.profile?.telefone && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-20 bg-card px-5 py-4" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <Button onClick={handleContactClick} className="w-full h-[52px] rounded-2xl gap-2 text-[15px] font-semibold bg-[#25D366] hover:bg-[#1da851] text-white">
            <MessageCircle size={20} />
            Falar no WhatsApp
          </Button>
        </div>
      )}

      {/* Safety tip dialog */}
      <AlertDialog open={showSafetyTip} onOpenChange={setShowSafetyTip}>
        <AlertDialogContent className="max-w-[360px] rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={20} className="text-primary" />
              <AlertDialogTitle className="text-[16px]">Dica de segurança</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              Como o Desapego é uma ferramenta entre moradores do condomínio, recomendamos que você <strong className="text-foreground">combine a entrega pessoalmente</strong> e veja o produto antes de qualquer pagamento. Assim todo mundo fica tranquilo! 😊
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={openWhatsApp} className="flex-1 bg-[#25D366] hover:bg-[#1da851] text-white">
              Entendi, continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-[360px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px]">Excluir desapego?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground">
              Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="flex-1 bg-destructive hover:bg-destructive/90 text-white">
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MoradorDesapegoDetalhe;
