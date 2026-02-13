import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string | null;
  link: string | null;
  ativo: boolean;
  ordem: number;
  condominio_id: string;
}

const AdminBanners = () => {
  const { roles } = useAuth();
  const condominioId = roles.find((r) => r.role === "admin")?.condominio_id;
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ titulo: "", subtitulo: "", link: "", ativo: true, ordem: 0 });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchBanners = async () => {
    if (!condominioId) return;
    const { data } = await supabase
      .from("banners")
      .select("*")
      .eq("condominio_id", condominioId)
      .order("ordem", { ascending: true });
    setBanners((data as Banner[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, [condominioId]);

  const openNew = () => {
    setEditing(null);
    setForm({ titulo: "", subtitulo: "", link: "", ativo: true, ordem: banners.length });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ titulo: b.titulo, subtitulo: b.subtitulo || "", link: b.link || "", ativo: b.ativo, ordem: b.ordem });
    setImageFile(null);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File, bannerId: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${condominioId}/${bannerId}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar imagem"); return null; }
    const { data } = supabase.storage.from("banners").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!condominioId || !form.titulo.trim()) { toast.error("Título é obrigatório"); return; }
    setUploading(true);

    try {
      if (editing) {
        let imagem_url = editing.imagem_url;
        if (imageFile) {
          const url = await uploadImage(imageFile, editing.id);
          if (url) imagem_url = url;
        }
        const { error } = await supabase.from("banners").update({
          titulo: form.titulo, subtitulo: form.subtitulo || null, link: form.link || null,
          ativo: form.ativo, ordem: form.ordem, imagem_url,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success("Banner atualizado!");
      } else {
        const tempId = crypto.randomUUID();
        let imagem_url: string | null = null;
        if (imageFile) {
          imagem_url = await uploadImage(imageFile, tempId);
        }
        const { error } = await supabase.from("banners").insert({
          id: tempId, condominio_id: condominioId, titulo: form.titulo,
          subtitulo: form.subtitulo || null, link: form.link || null,
          ativo: form.ativo, ordem: form.ordem, imagem_url,
        });
        if (error) throw error;
        toast.success("Banner criado!");
      }
      setDialogOpen(false);
      fetchBanners();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este banner?")) return;
    await supabase.from("banners").delete().eq("id", id);
    toast.success("Banner excluído");
    fetchBanners();
  };

  const toggleAtivo = async (b: Banner) => {
    await supabase.from("banners").update({ ativo: !b.ativo }).eq("id", b.id);
    fetchBanners();
  };

  return (
    <AdminLayout title="Banners">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Gerenciar Banners</h2>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus size={16} /> Novo
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : banners.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Nenhum banner cadastrado.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {banners.map((b) => (
              <Card key={b.id} className={`overflow-hidden ${!b.ativo ? "opacity-50" : ""}`}>
                <div className="flex">
                  <div className="w-[120px] h-[80px] bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {b.imagem_url ? (
                      <img src={b.imagem_url} alt={b.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-3 flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.titulo}</p>
                      {b.subtitulo && <p className="text-xs text-muted-foreground">{b.subtitulo}</p>}
                      <span className={`text-[10px] font-semibold ${b.ativo ? "text-green-600" : "text-muted-foreground"}`}>
                        {b.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleAtivo(b)}>
                        <Switch checked={b.ativo} className="pointer-events-none scale-75" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Banner" : "Novo Banner"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Festa Junina" />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input value={form.subtitulo} onChange={(e) => setForm({ ...form, subtitulo: e.target.value })} placeholder="Ex: Dia 24/06 às 18h" />
              </div>
              <div>
                <Label>Link (opcional)</Label>
                <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Imagem</Label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                {editing?.imagem_url && !imageFile && (
                  <img src={editing.imagem_url} alt="Preview" className="mt-2 h-20 rounded-lg object-cover" />
                )}
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
                <Label>Ativo</Label>
              </div>
              <Button onClick={handleSave} disabled={uploading} className="w-full">
                {uploading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminBanners;
