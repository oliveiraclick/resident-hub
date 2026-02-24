import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Repeat, Plus, Camera, ImagePlus, X } from "lucide-react";

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
    setLoading(true);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
          <Plus size={18} />
          {showForm ? "Cancelar" : "Publicar Desapego"}
        </Button>

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
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-background/80 rounded-full p-1">
                      <X size={14} className="text-destructive" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => fileInputRef.current?.click()}>
                      <ImagePlus size={16} /> Galeria
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => cameraInputRef.current?.click()}>
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

        {loading ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : desapegos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Repeat size={40} className="text-muted-foreground" />
            <p className="text-body text-muted-foreground">Nenhum desapego ainda</p>
          </div>
        ) : (
          desapegos.map((d) => (
            <Card key={d.id} className="cursor-pointer active:scale-[0.98] transition-transform overflow-hidden" onClick={() => navigate(`/morador/desapegos/${d.id}`)}>
              {d.imagem_url && (
                <img src={d.imagem_url} alt={d.titulo} className="w-full h-36 object-cover" />
              )}
              <CardContent className="flex flex-col gap-2 p-4">
                <p className="text-title-md">{d.titulo}</p>
                {d.descricao && (
                  <p className="text-body text-muted-foreground">{d.descricao}</p>
                )}
                {d.preco ? (
                  <p className="text-body font-semibold text-primary">
                    R$ {Number(d.preco).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-subtitle text-success font-medium">Gratuito</p>
                )}
                <p className="text-label text-muted-foreground">
                  {new Date(d.created_at).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorDesapegos;
