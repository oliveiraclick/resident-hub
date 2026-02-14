import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, Plus, Pencil, Trash2, X, Camera, ImagePlus } from "lucide-react";

interface Produto {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  status: string;
  imagem_url: string | null;
}

const PrestadorProdutos = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch prestador ID
  useEffect(() => {
    if (!user || !condominioId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("prestadores")
        .select("id")
        .eq("user_id", user.id)
        .eq("condominio_id", condominioId)
        .maybeSingle();
      setPrestadorId(data?.id || null);
    };
    fetch();
  }, [user, condominioId]);

  // Fetch produtos
  const fetchProdutos = async () => {
    if (!prestadorId) return;
    setLoading(true);
    const { data } = await supabase
      .from("produtos")
      .select("id, titulo, descricao, preco, status, imagem_url")
      .eq("prestador_id", prestadorId)
      .order("created_at", { ascending: false });
    setProdutos((data as Produto[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (prestadorId) fetchProdutos();
  }, [prestadorId]);

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setPreco("");
    setEditingId(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const openEdit = (p: Produto) => {
    setTitulo(p.titulo);
    setDescricao(p.descricao || "");
    setPreco(p.preco != null ? String(p.preco) : "");
    setEditingId(p.id);
    setImageFile(null);
    setImagePreview(p.imagem_url || null);
    setShowForm(true);
  };

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

  const uploadImage = async (file: File, productId: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${prestadorId}/${productId}.${ext}`;
    const { error } = await supabase.storage.from("produtos").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar imagem"); return null; }
    const { data } = supabase.storage.from("produtos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !prestadorId || !condominioId) return;
    setSubmitting(true);

    try {
      const payload: any = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        preco: preco ? parseFloat(preco) : null,
      };

      if (editingId) {
        if (imageFile) {
          const url = await uploadImage(imageFile, editingId);
          if (url) payload.imagem_url = url;
        }
        const { error } = await supabase.from("produtos").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Produto atualizado!");
      } else {
        const tempId = crypto.randomUUID();
        if (imageFile) {
          const url = await uploadImage(imageFile, tempId);
          if (url) payload.imagem_url = url;
        }
        const { error } = await supabase.from("produtos").insert({
          id: tempId,
          ...payload,
          prestador_id: prestadorId,
          condominio_id: condominioId,
          status: "ativo",
        });
        if (error) throw error;
        toast.success("Produto criado!");
      }
      resetForm();
      fetchProdutos();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar produto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir produto");
    } else {
      toast.success("Produto excluído");
      fetchProdutos();
    }
  };

  const handleToggleStatus = async (p: Produto) => {
    const newStatus = p.status === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase
      .from("produtos")
      .update({ status: newStatus })
      .eq("id", p.id);
    if (error) {
      toast.error("Erro ao alterar status");
    } else {
      toast.success(`Produto ${newStatus === "ativo" ? "ativado" : "desativado"}`);
      fetchProdutos();
    }
  };

  return (
    <PrestadorLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-foreground">Meus Produtos</h2>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus size={16} />
              Novo
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-foreground">
                  {editingId ? "Editar Produto" : "Novo Produto"}
                </p>
                <button onClick={resetForm}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Título</label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Nome do produto"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Descrição</label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes do produto"
                  rows={3}
                />
              </div>

              {/* Image upload */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Foto do produto</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-1 right-1 bg-background/80 rounded-full p-1"
                    >
                      <X size={14} className="text-destructive" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus size={16} />
                      Galeria
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera size={16} />
                      Câmera
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Preço (R$)</label>
                <Input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0,00"
                  step="0.01"
                />
              </div>

              <Button onClick={handleSubmit} disabled={submitting || !titulo.trim()}>
                {submitting ? "Salvando..." : editingId ? "Salvar alterações" : "Criar produto"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista */}
        {!prestadorId ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">
            Cadastro de prestador não encontrado.
          </p>
        ) : loading ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
        ) : produtos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <ShoppingBag size={40} className="text-muted-foreground" />
            <p className="text-[14px] text-muted-foreground">Nenhum produto cadastrado</p>
          </div>
        ) : (
          produtos.map((p) => (
            <Card key={p.id} className={`overflow-hidden ${p.status === "inativo" ? "opacity-60" : ""}`}>
              {p.imagem_url && (
                <img src={p.imagem_url} alt={p.titulo} className="w-full h-36 object-cover" />
              )}
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{p.titulo}</p>
                    {p.descricao && (
                      <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{p.descricao}</p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                      p.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                {p.preco != null && (
                  <p className="text-[15px] font-bold text-primary">
                    R$ {Number(p.preco).toFixed(2).replace(".", ",")}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => openEdit(p)}>
                    <Pencil size={14} />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 flex-1"
                    onClick={() => handleToggleStatus(p)}
                  >
                    {p.status === "ativo" ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorProdutos;
