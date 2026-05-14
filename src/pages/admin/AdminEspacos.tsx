import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, X, Home, MapPin, Crown, Beef, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import salaoCover from "@/assets/categoria-salao.jpg";
import quiosqueCover from "@/assets/categoria-quiosque.jpg";
import esportesCover from "@/assets/categoria-esportes.jpg";

interface Espaco {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  capacidade: number | null;
  preco: number;
  regras: string | null;
  imagem_url: string | null;
}

const AdminEspacos = () => {
  const { roles } = useAuth();
  const condominioId = roles.find((r) => r.role === "admin")?.condominio_id;

  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("salao");
  const [descricao, setDescricao] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [preco, setPreco] = useState("");
  const [regras, setRegras] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryCovers, setCategoryCovers] = useState<Record<string, string>>({});
  const [uploadingCover, setUploadingCover] = useState<string | null>(null);

  const SoccerBall = (props: { size?: number; className?: string }) => (
    <span className={props.className} style={{ fontSize: props.size || 20, lineHeight: 1 }}>⚽</span>
  );

  const categoryCards = [
    { id: "salao", label: "Salão", icon: Crown, defaultCover: salaoCover },
    { id: "quiosque", label: "Quiosques", icon: Beef, defaultCover: quiosqueCover },
    { id: "quadra", label: "Esportes", icon: SoccerBall as any, defaultCover: esportesCover },
  ];

  const fetchCovers = async () => {
    if (!condominioId) return;
    const { data } = await supabase
      .from("categoria_capas" as any)
      .select("categoria, imagem_url")
      .eq("condominio_id", condominioId);
    const map: Record<string, string> = {};
    (data as any[] || []).forEach((c) => { map[c.categoria] = c.imagem_url; });
    setCategoryCovers(map);
  };

  useEffect(() => { fetchCovers(); }, [condominioId]);

  const handleCoverUpload = async (categoria: string, file: File) => {
    if (!condominioId || !file) return;
    setUploadingCover(categoria);
    try {
      const ext = file.name.split(".").pop();
      const path = `categoria-capas/${condominioId}-${categoria}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("banners").getPublicUrl(path);
      const { error } = await supabase
        .from("categoria_capas" as any)
        .upsert({ condominio_id: condominioId, categoria, imagem_url: pub.publicUrl }, { onConflict: "condominio_id,categoria" });
      if (error) throw error;
      toast.success("Capa atualizada!");
      fetchCovers();
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar imagem");
    } finally {
      setUploadingCover(null);
    }
  };

  const handleResetCover = async (categoria: string) => {
    if (!condominioId) return;
    await supabase
      .from("categoria_capas" as any)
      .delete()
      .eq("condominio_id", condominioId)
      .eq("categoria", categoria);
    toast.success("Capa restaurada para o padrão");
    fetchCovers();
  };

  const fetchData = async () => {
    if (!condominioId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("espacos")
      .select("*")
      .eq("condominio_id", condominioId)
      .order("created_at", { ascending: false });

    if (error) toast.error("Erro ao carregar espaços");
    else setEspacos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [condominioId]);

  const resetForm = () => {
    setNome("");
    setCategoria("salao");
    setDescricao("");
    setCapacidade("");
    setPreco("");
    setRegras("");
    setImagemUrl("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (espaco: Espaco) => {
    setEditingId(espaco.id);
    setNome(espaco.nome);
    setCategoria(espaco.categoria);
    setDescricao(espaco.descricao || "");
    setCapacidade(espaco.capacidade?.toString() || "");
    setPreco(espaco.preco.toString());
    setRegras(espaco.regras || "");
    setImagemUrl(espaco.imagem_url || "");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!nome || !condominioId) return;
    setSubmitting(true);

    const payload = {
      condominio_id: condominioId,
      nome,
      categoria,
      descricao,
      capacidade: capacidade ? parseInt(capacidade) : null,
      preco: categoria === "quadra" ? 0 : (parseFloat(preco) || 0),
      regras,
      imagem_url: imagemUrl,
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase
        .from("espacos")
        .update(payload)
        .eq("id", editingId);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("espacos")
        .insert(payload);
      error = err;
    }

    if (error) {
      toast.error("Erro ao salvar espaço");
    } else {
      toast.success(editingId ? "Espaço atualizado!" : "Espaço criado!");
      resetForm();
      fetchData();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este espaço?")) return;
    const { error } = await supabase.from("espacos").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Espaço excluído");
      fetchData();
    }
  };

  return (
    <AdminLayout title="Espaços Comuns">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-foreground">Gestão de Espaços</h2>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus size={16} />
              Novo Espaço
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="rounded-[var(--radius-card)]">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-foreground">
                  {editingId ? "Editar Espaço" : "Novo Espaço"}
                </p>
                <button onClick={resetForm}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground ml-1">Nome do Espaço</label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Salão de Festas A" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground ml-1">Categoria</label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiosque">Quiosque</SelectItem>
                      <SelectItem value="salao">Salão de Festa</SelectItem>
                      <SelectItem value="quadra">Quadra de Esporte</SelectItem>
                      <SelectItem value="piscina">Piscina</SelectItem>
                      <SelectItem value="academia">Academia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Descrição</label>
                <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do espaço..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground ml-1">Capacidade (Pessoas)</label>
                  <Input type="number" value={capacidade} onChange={(e) => setCapacidade(e.target.value)} placeholder="0" />
                </div>
                {categoria !== "quadra" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-muted-foreground ml-1">Preço Locação (R$)</label>
                    <Input type="number" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0.00" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Regras de Uso</label>
                <Textarea value={regras} onChange={(e) => setRegras(e.target.value)} placeholder="Ex: Proibido som alto após as 22h..." />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">URL da Imagem</label>
                <Input value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://..." />
              </div>

              <Button onClick={handleSubmit} disabled={submitting || !nome} className="mt-2">
                {submitting ? "Salvando..." : "Salvar Espaço"}
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : espacos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 bg-card border border-dashed rounded-[var(--radius-card)]">
            <Home size={40} className="text-muted-foreground" />
            <p className="text-[14px] text-muted-foreground text-center">Nenhum espaço cadastrado.<br/>Comece adicionando um novo espaço acima.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {espacos.map((e) => (
              <Card key={e.id} className="rounded-[var(--radius-card)] overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {e.imagem_url && (
                    <div className="w-full sm:w-32 h-32 flex-shrink-0">
                      <img src={e.imagem_url} alt={e.nome} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">{e.nome}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase">
                            {e.categoria}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(e)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">{e.descricao || "Sem descrição"}</p>
                      <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Capacidade: <span className="text-foreground">{e.capacidade || "—"}</span>
                        </span>
                        {e.categoria !== "quadra" && (
                          <span className="flex items-center gap-1">
                            Preço: <span className="text-primary font-bold">R$ {e.preco.toFixed(2)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminEspacos;
