import { useState, useEffect } from "react";
import MasterLayout from "@/components/MasterLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagem_url: string | null;
  link: string | null;
  whatsapp: string | null;
  ativo: boolean;
  ordem: number;
  condominio_id: string;
  publico: string;
}

interface Condominio {
  id: string;
  nome: string;
}

const MasterBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ titulo: "", subtitulo: "", link: "", whatsapp: "", ativo: true, ordem: 0, publico: "prestador", condominio_id: "", origem: "mkt" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterPublico, setFilterPublico] = useState("todos_filter");
  const [lastActions, setLastActions] = useState<Record<string, { acao: string; ator_nome: string; created_at: string }>>({});

  const fetchData = async () => {
    const [bannersRes, condRes] = await Promise.all([
      supabase.from("banners").select("*").order("ordem", { ascending: true }),
      supabase.from("condominios").select("id, nome").order("nome"),
    ]);
    const bannersData = (bannersRes.data as Banner[]) || [];
    setBanners(bannersData);
    setCondominios(condRes.data || []);

    // Fetch last audit action for each banner
    if (bannersData.length > 0) {
      const { data: actions } = await supabase.rpc("get_banner_last_actions", {
        _banner_tipo: "institucional",
        _banner_ids: bannersData.map((b) => b.id),
      });
      if (actions) {
        const map: Record<string, any> = {};
        actions.forEach((a: any) => { map[a.banner_id] = a; });
        setLastActions(map);
      }
    }
    setLoading(false);
  };

  const formatAcao = (acao: string) => {
    const map: Record<string, string> = {
      ativado: "Ativado", desativado: "Desativado",
      criado_e_ativado: "Criado e ativado", criado: "Criado",
    };
    return map[acao] || acao;
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ titulo: "", subtitulo: "", link: "", whatsapp: "", ativo: true, ordem: banners.length, publico: "prestador", condominio_id: condominios[0]?.id || "", origem: "mkt" });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ titulo: b.titulo, subtitulo: b.subtitulo || "", link: b.link || "", whatsapp: b.whatsapp || "", ativo: b.ativo, ordem: b.ordem, publico: b.publico, condominio_id: b.condominio_id, origem: "mkt" });
    setImageFile(null);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File, bannerId: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `master/${bannerId}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar imagem"); return null; }
    const { data } = supabase.storage.from("banners").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título é obrigatório"); return; }
    if (!form.condominio_id) { toast.error("Selecione um condomínio"); return; }
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
          whatsapp: form.whatsapp || null, ativo: form.ativo, ordem: form.ordem, imagem_url, publico: form.publico, condominio_id: form.condominio_id,
        }).eq("id", editing.id);
        if (error) throw error;
        toast.success("Banner atualizado!");
      } else {
        const tempId = crypto.randomUUID();
        let imagem_url: string | null = null;
        if (imageFile) imagem_url = await uploadImage(imageFile, tempId);
        const { error } = await supabase.from("banners").insert({
          id: tempId, condominio_id: form.condominio_id, titulo: form.titulo,
          subtitulo: form.subtitulo || null, link: form.link || null,
          whatsapp: form.whatsapp || null, ativo: form.ativo, ordem: form.ordem, imagem_url, publico: form.publico,
        });
        if (error) throw error;
        toast.success("Banner criado!");
      }
      setDialogOpen(false);
      fetchData();
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
    fetchData();
  };

  const toggleAtivo = async (b: Banner) => {
    await supabase.from("banners").update({ ativo: !b.ativo }).eq("id", b.id);
    fetchData();
  };

  const condMap = Object.fromEntries(condominios.map((c) => [c.id, c.nome]));
  const filtered = filterPublico === "todos_filter" ? banners : banners.filter((b) => b.publico === filterPublico);

  return (
    <MasterLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Banners</h2>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus size={16} /> Novo
          </Button>
        </div>

        {/* Filtro */}
        <div className="flex gap-2">
          {[
            { v: "todos_filter", l: "Todos" },
            { v: "morador", l: "🏠 Morador" },
            { v: "prestador", l: "🔧 Prestador" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFilterPublico(f.v)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${filterPublico === f.v ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}
            >
              {f.l}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Nenhum banner encontrado.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => (
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
                      <p className="text-[10px] text-muted-foreground">{condMap[b.condominio_id] || "—"}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-semibold ${b.ativo ? "text-green-600" : "text-muted-foreground"}`}>
                          {b.ativo ? "Ativo" : "Inativo"}
                        </span>
                        <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded">
                          {b.publico === "prestador" ? "🔧 Prestador" : b.publico === "todos" ? "👥 Todos" : "🏠 Morador"}
                        </span>
                      </div>
                      {lastActions[b.id] && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatAcao(lastActions[b.id].acao)} por <strong>{lastActions[b.id].ator_nome}</strong> em {new Date(lastActions[b.id].created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
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
          <DialogContent className="max-w-[420px] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="px-5 pt-5 pb-3 border-b border-border sticky top-0 bg-background z-10">
              <DialogTitle className="text-base">{editing ? "Editar Banner" : "Novo Banner"}</DialogTitle>
            </DialogHeader>

            <div className="px-5 py-4 space-y-5">
              {/* Seção 1: Destino */}
              <section className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">📍 Destino</h3>
                <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <div>
                    <Label className="text-xs">Condomínio *</Label>
                    <Select value={form.condominio_id} onValueChange={(v) => setForm({ ...form, condominio_id: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {condominios.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Público-alvo *</Label>
                    <Select value={form.publico} onValueChange={(v) => setForm({ ...form, publico: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morador">🏠 Morador</SelectItem>
                        <SelectItem value="prestador">🔧 Prestador</SelectItem>
                        <SelectItem value="todos">👥 Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* Seção 2: Origem (cards) */}
              <section className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">💼 Origem comercial *</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, origem: "mkt" })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${form.origem === "mkt" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"}`}
                  >
                    <div className="text-xl mb-1">🎁</div>
                    <p className="text-xs font-semibold text-foreground">MKT / Cortesia</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Sem cobrança</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, origem: "pagamento" })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${form.origem === "pagamento" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"}`}
                  >
                    <div className="text-xl mb-1">💳</div>
                    <p className="text-xs font-semibold text-foreground">Pago</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Anunciante pagou</p>
                  </button>
                </div>
              </section>

              {/* Seção 3: Conteúdo */}
              <section className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">✏️ Conteúdo</h3>
                <div>
                  <Label className="text-xs">Título *</Label>
                  <Input className="mt-1" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Oferta Especial" />
                </div>
                <div>
                  <Label className="text-xs">Subtítulo</Label>
                  <Input className="mt-1" value={form.subtitulo} onChange={(e) => setForm({ ...form, subtitulo: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Imagem</Label>
                  <Input className="mt-1" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  {editing?.imagem_url && !imageFile && (
                    <img src={editing.imagem_url} alt="Preview" className="mt-2 h-20 rounded-lg object-cover" />
                  )}
                </div>
              </section>

              {/* Seção 4: Ação ao clicar */}
              <section className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">🔗 Ação ao clicar</h3>
                <div>
                  <Label className="text-xs">Link (opcional)</Label>
                  <Input className="mt-1" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label className="text-xs">WhatsApp (opcional)</Label>
                  <Input className="mt-1" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5511999999999" />
                  <p className="text-[10px] text-muted-foreground mt-1">DDD + país. Abre o WhatsApp ao clicar.</p>
                </div>
              </section>

              {/* Seção 5: Configurações */}
              <section className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">⚙️ Configurações</h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Ordem</Label>
                    <Input className="mt-1" type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
                    <Label className="text-[10px]">{form.ativo ? "Ativo" : "Inativo"}</Label>
                  </div>
                </div>
              </section>
            </div>

            <div className="px-5 py-3 border-t border-border sticky bottom-0 bg-background">
              <Button onClick={handleSave} disabled={uploading} className="w-full">
                {uploading ? "Salvando..." : "Salvar Banner"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MasterLayout>
  );
};

export default MasterBanners;
