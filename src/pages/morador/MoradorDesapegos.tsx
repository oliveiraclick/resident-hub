import { useState, useEffect, useRef } from "react";
import { formatBRL } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Repeat, Plus, Camera, ImagePlus, X, FileText, Users } from "lucide-react";

const MoradorDesapegos = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [desapegos, setDesapegos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fetchDesapegos = async () => {
    if (!condominioId) return;
    // Don't show loading spinner if form is open (prevents visual reset on mobile)
    if (!showForm) setLoading(true);
    const { data } = await supabase
      .from("desapegos")
      .select("*")
      .eq("condominio_id", condominioId)
      .eq("status", "ativo")
      .order("created_at", { ascending: false });
    setDesapegos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDesapegos();
  }, [condominioId]);

  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input value so the same file can be selected again if needed
    e.target.value = "";

    // Compress camera photos (often 5-10 MB on iOS)
    let processed = file;
    if (file.size > 1 * 1024 * 1024) {
      processed = await compressImage(file);
    }

    if (processed.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }
    setImageFile(processed);
    setImagePreview(URL.createObjectURL(processed));
  };

  const uploadImage = async (file: File, desapegoId: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${desapegoId}.${ext}`;
    const { error } = await supabase.storage.from("desapegos").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar imagem"); return null; }
    const { data } = supabase.storage.from("desapegos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !condominioId || !user) return;
    setSubmitting(true);

    try {
      const tempId = crypto.randomUUID();
      let imagem_url: string | null = null;

      if (imageFile) {
        imagem_url = await uploadImage(imageFile, tempId);
      }

      const { error } = await supabase.from("desapegos").insert({
        id: tempId,
        condominio_id: condominioId,
        morador_id: user.id,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        preco: preco ? parseFloat(preco) : null,
        imagem_url,
        status: "ativo",
      });

      if (error) throw error;
      toast.success("Desapego publicado!");
      setTitulo("");
      setDescricao("");
      setPreco("");
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      fetchDesapegos();
    } catch (e: any) {
      toast.error(e.message || "Erro ao publicar desapego");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MoradorLayout title="Desapego">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Top stats row */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="h-auto py-3">
            <Plus size={18} />
            {showForm ? "Cancelar" : "Publicar"}
          </Button>
          <div className="grid grid-rows-2 gap-2">
            <div className="rounded-xl bg-card border border-border px-3 py-2 flex items-center gap-2">
              <FileText size={14} className="text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-tight">Minhas</p>
                <p className="text-[15px] font-bold text-foreground leading-tight">{desapegos.filter(d => d.morador_id === user?.id).length}</p>
              </div>
            </div>
            <div className="rounded-xl bg-card border border-border px-3 py-2 flex items-center gap-2">
              <Users size={14} className="text-warning flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-tight">Total</p>
                <p className="text-[15px] font-bold text-foreground leading-tight">{desapegos.length}</p>
              </div>
            </div>
          </div>
        </div>

        {showForm && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div>
                <label className="mb-1 block">Título</label>
                <Input
                  placeholder="O que você quer desapegar?"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block">Descrição</label>
                <Input
                  placeholder="Detalhes do item"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              {/* Image upload */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Foto do item</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} onClick={(e) => e.stopPropagation()} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} onClick={(e) => e.stopPropagation()} />
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-background/80 rounded-full p-1">
                      <X size={14} className="text-destructive" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={(e) => { e.stopPropagation(); e.preventDefault(); fileInputRef.current?.click(); }}>
                      <ImagePlus size={16} /> Galeria
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={(e) => { e.stopPropagation(); e.preventDefault(); cameraInputRef.current?.click(); }}>
                      <Camera size={16} /> Câmera
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block">Preço (opcional)</label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                />
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !titulo.trim()}>
                {submitting ? "Publicando..." : "Publicar"}
              </Button>
            </CardContent>
          </Card>
        )}

        {!showForm && loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : !showForm && desapegos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Repeat size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhum desapego ainda</p>
          </div>
        ) : !showForm ? (
          <div className="grid grid-cols-2 gap-3">
            {desapegos.map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/morador/desapegos/${d.id}`)}
                className="bg-transparent border-none cursor-pointer p-0 text-left active:scale-95 transition-transform"
              >
                <div className="rounded-2xl overflow-hidden bg-card border border-border" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div className="aspect-square overflow-hidden bg-muted">
                    {d.imagem_url ? (
                      <img src={d.imagem_url} alt={d.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-[32px]">📦</span></div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[13px] font-semibold text-foreground truncate">{d.titulo}</p>
                    {d.descricao && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{d.descricao}</p>
                    )}
                    {d.preco ? (
                      <p className="text-[14px] font-bold text-primary mt-1">R$ {formatBRL(d.preco)}</p>
                    ) : (
                      <p className="text-[12px] text-success font-medium mt-1">Gratuito</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(d.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </MoradorLayout>
  );
};

export default MoradorDesapegos;
