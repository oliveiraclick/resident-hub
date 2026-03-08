import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  UtensilsCrossed, Plus, Trash2, Save, ImagePlus, X, Clock,
  GripVertical, ChevronDown, ChevronUp, Calendar,
} from "lucide-react";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Categoria { id: string; nome: string; ordem: number; }
interface Item {
  id: string;
  categoria_id: string | null;
  nome: string;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null;
  disponivel: boolean;
  ordem: number;
}
interface Horario {
  id: string;
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string;
  ativo: boolean;
}

const PrestadorCardapio = () => {
  const { user, roles } = useAuth();
  const condominioId = roles.find(r => r.role === "prestador")?.condominio_id;

  const [lojaId, setLojaId] = useState<string | null>(null);
  const [cardapioAtivo, setCardapioAtivo] = useState(false);
  const [loading, setLoading] = useState(true);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);

  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Item> & { file?: File; preview?: string }>({});
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<"categorias" | "itens" | "horarios" | null>("itens");
  const fileRef = useRef<HTMLInputElement>(null);

  // Load loja
  useEffect(() => {
    if (!user || !condominioId) return;
    (async () => {
      const { data: prest } = await supabase
        .from("prestadores").select("id").eq("user_id", user.id).eq("condominio_id", condominioId).maybeSingle();
      if (!prest) { setLoading(false); return; }

      const { data: loja } = await supabase
        .from("lojas").select("id, cardapio_ativo").eq("prestador_id", prest.id).maybeSingle();
      if (loja) {
        setLojaId(loja.id);
        setCardapioAtivo(loja.cardapio_ativo ?? false);
      }
      setLoading(false);
    })();
  }, [user, condominioId]);

  // Load cardápio data
  useEffect(() => {
    if (!lojaId) return;
    (async () => {
      const [catRes, itemRes, horRes] = await Promise.all([
        supabase.from("cardapio_categorias").select("*").eq("loja_id", lojaId).order("ordem"),
        supabase.from("cardapio_itens").select("*").eq("loja_id", lojaId).order("ordem"),
        supabase.from("cardapio_horarios").select("*").eq("loja_id", lojaId).order("dia_semana"),
      ]);
      setCategorias((catRes.data || []) as Categoria[]);
      setItens((itemRes.data || []) as Item[]);
      setHorarios((horRes.data || []) as Horario[]);
    })();
  }, [lojaId]);

  const toggleCardapio = async (val: boolean) => {
    if (!lojaId) return;
    await supabase.from("lojas").update({ cardapio_ativo: val } as any).eq("id", lojaId);
    setCardapioAtivo(val);
    toast.success(val ? "Cardápio ativado!" : "Cardápio desativado");
  };

  // --- Categories ---
  const addCategoria = async () => {
    if (!lojaId || !newCatName.trim()) return;
    const { data, error } = await supabase.from("cardapio_categorias").insert({
      loja_id: lojaId, nome: newCatName.trim(), ordem: categorias.length,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setCategorias(prev => [...prev, data as Categoria]);
    setNewCatName("");
    setShowAddCat(false);
    toast.success("Categoria adicionada!");
  };

  const deleteCategoria = async (id: string) => {
    await supabase.from("cardapio_categorias").delete().eq("id", id);
    setCategorias(prev => prev.filter(c => c.id !== id));
    toast.success("Categoria removida");
  };

  // --- Items ---
  const openAddItem = () => {
    setEditItem({ disponivel: true, categoria_id: categorias[0]?.id || null });
    setShowAddItem(true);
  };

  const handleItemImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    setEditItem(prev => ({ ...prev, file, preview: URL.createObjectURL(file) }));
  };

  const saveItem = async () => {
    if (!lojaId || !editItem.nome?.trim()) { toast.error("Preencha o nome"); return; }
    setSaving(true);
    try {
      let imagem_url = editItem.imagem_url || null;

      if (editItem.file) {
        const ext = editItem.file.name.split(".").pop();
        const path = `${lojaId}/cardapio/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("produtos").upload(path, editItem.file, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("produtos").getPublicUrl(path);
        imagem_url = urlData.publicUrl;
      }

      const payload = {
        loja_id: lojaId,
        categoria_id: editItem.categoria_id || null,
        nome: editItem.nome.trim(),
        descricao: editItem.descricao?.trim() || null,
        preco: editItem.preco || null,
        imagem_url,
        disponivel: editItem.disponivel ?? true,
        ordem: editItem.id ? editItem.ordem || 0 : itens.length,
      };

      if (editItem.id) {
        const { error } = await supabase.from("cardapio_itens").update(payload).eq("id", editItem.id);
        if (error) throw error;
        setItens(prev => prev.map(i => i.id === editItem.id ? { ...i, ...payload } as Item : i));
        toast.success("Item atualizado!");
      } else {
        const { data, error } = await supabase.from("cardapio_itens").insert(payload).select().single();
        if (error) throw error;
        setItens(prev => [...prev, data as Item]);
        toast.success("Item adicionado!");
      }
      setShowAddItem(false);
      setEditItem({});
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const toggleDisponivel = async (item: Item) => {
    const newVal = !item.disponivel;
    await supabase.from("cardapio_itens").update({ disponivel: newVal }).eq("id", item.id);
    setItens(prev => prev.map(i => i.id === item.id ? { ...i, disponivel: newVal } : i));
  };

  const deleteItem = async (id: string) => {
    await supabase.from("cardapio_itens").delete().eq("id", id);
    setItens(prev => prev.filter(i => i.id !== id));
    toast.success("Item removido");
  };

  // --- Schedule ---
  const addHorario = async (dia: number) => {
    if (!lojaId) return;
    const { data, error } = await supabase.from("cardapio_horarios").insert({
      loja_id: lojaId, dia_semana: dia, horario_inicio: "11:00", horario_fim: "14:00", ativo: true,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setHorarios(prev => [...prev, data as Horario]);
    toast.success(`${DIAS_SEMANA[dia]} adicionado!`);
  };

  const updateHorario = async (id: string, field: string, value: any) => {
    await supabase.from("cardapio_horarios").update({ [field]: value }).eq("id", id);
    setHorarios(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const deleteHorario = async (id: string) => {
    await supabase.from("cardapio_horarios").delete().eq("id", id);
    setHorarios(prev => prev.filter(h => h.id !== id));
  };

  if (loading) {
    return (
      <PrestadorLayout title="Cardápio" showBack>
        <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
      </PrestadorLayout>
    );
  }

  if (!lojaId) {
    return (
      <PrestadorLayout title="Cardápio" showBack>
        <div className="text-center py-12 flex flex-col items-center gap-3">
          <UtensilsCrossed size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground">Crie sua loja primeiro para habilitar o cardápio</p>
          <Button onClick={() => window.location.href = "/prestador/loja"}>Criar Loja</Button>
        </div>
      </PrestadorLayout>
    );
  }

  const Section = ({ title, icon: Icon, section, children }: any) => {
    const isOpen = expandedSection === section;
    return (
      <Card>
        <button
          onClick={() => setExpandedSection(isOpen ? null : section)}
          className="w-full flex items-center justify-between p-4 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-primary" />
            <span className="text-[14px] font-semibold text-foreground">{title}</span>
          </div>
          {isOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
        </button>
        {isOpen && <CardContent className="pt-0 px-4 pb-4">{children}</CardContent>}
      </Card>
    );
  };

  return (
    <PrestadorLayout title="Cardápio" showBack>
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Toggle */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={20} className="text-primary" />
              <div>
                <p className="text-[14px] font-semibold text-foreground">Cardápio digital</p>
                <p className="text-[11px] text-muted-foreground">Ativar cardápio para moradores</p>
              </div>
            </div>
            <Switch checked={cardapioAtivo} onCheckedChange={toggleCardapio} />
          </CardContent>
        </Card>

        {cardapioAtivo && (
          <>
            {/* Categorias */}
            <Section title="Categorias" icon={GripVertical} section="categorias">
              <div className="flex flex-col gap-2">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                    <span className="text-[13px] font-medium text-foreground">{cat.nome}</span>
                    <button onClick={() => deleteCategoria(cat.id)} className="text-destructive p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {showAddCat ? (
                  <div className="flex gap-2">
                    <Input
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="Ex: Lanches, Bebidas..."
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={addCategoria} disabled={!newCatName.trim()}>
                      <Save size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddCat(false)}>
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowAddCat(true)}>
                    <Plus size={14} /> Adicionar categoria
                  </Button>
                )}
              </div>
            </Section>

            {/* Itens */}
            <Section title="Itens do Cardápio" icon={UtensilsCrossed} section="itens">
              <div className="flex flex-col gap-3">
                {categorias.length > 0 ? categorias.map(cat => {
                  const catItens = itens.filter(i => i.categoria_id === cat.id);
                  if (catItens.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{cat.nome}</p>
                      {catItens.map(item => (
                        <ItemCard key={item.id} item={item} onToggle={toggleDisponivel} onDelete={deleteItem}
                          onEdit={() => { setEditItem(item); setShowAddItem(true); }} />
                      ))}
                    </div>
                  );
                }) : null}

                {/* Itens sem categoria */}
                {itens.filter(i => !i.categoria_id).map(item => (
                  <ItemCard key={item.id} item={item} onToggle={toggleDisponivel} onDelete={deleteItem}
                    onEdit={() => { setEditItem(item); setShowAddItem(true); }} />
                ))}

                {itens.length === 0 && (
                  <p className="text-[12px] text-muted-foreground text-center py-4">Nenhum item no cardápio</p>
                )}

                <Button className="gap-1" onClick={openAddItem}>
                  <Plus size={16} /> Adicionar item
                </Button>
              </div>
            </Section>

            {/* Horários */}
            <Section title="Dias e Horários" icon={Calendar} section="horarios">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-muted-foreground">Configure os dias e horários em que você estará disponível</p>
                {horarios.map(h => (
                  <div key={h.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                    <Switch checked={h.ativo} onCheckedChange={v => updateHorario(h.id, "ativo", v)} />
                    <span className={`text-[12px] font-medium min-w-[60px] ${h.ativo ? "text-foreground" : "text-muted-foreground"}`}>
                      {DIAS_SEMANA[h.dia_semana]}
                    </span>
                    <Input
                      type="time"
                      value={h.horario_inicio}
                      onChange={e => updateHorario(h.id, "horario_inicio", e.target.value)}
                      className="h-8 w-24 text-[12px]"
                    />
                    <span className="text-[11px] text-muted-foreground">às</span>
                    <Input
                      type="time"
                      value={h.horario_fim}
                      onChange={e => updateHorario(h.id, "horario_fim", e.target.value)}
                      className="h-8 w-24 text-[12px]"
                    />
                    <button onClick={() => deleteHorario(h.id)} className="text-destructive p-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {/* Add day buttons */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {DIAS_SEMANA.map((dia, idx) => {
                    const exists = horarios.some(h => h.dia_semana === idx);
                    if (exists) return null;
                    return (
                      <Button key={idx} variant="outline" size="sm" className="text-[11px] h-7 px-2" onClick={() => addHorario(idx)}>
                        <Plus size={12} className="mr-0.5" /> {dia.slice(0, 3)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Section>
          </>
        )}
      </div>

      {/* Add/Edit item overlay */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowAddItem(false)}>
          <div className="bg-card w-full max-w-md rounded-t-2xl p-5 border-t border-border flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-foreground">{editItem.id ? "Editar item" : "Novo item"}</h3>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleItemImage} />
            {editItem.preview || editItem.imagem_url ? (
              <div className="relative">
                <img src={editItem.preview || editItem.imagem_url!} alt="" className="w-full h-32 object-cover rounded-xl" />
                <button onClick={() => setEditItem(p => ({ ...p, file: undefined, preview: undefined, imagem_url: null }))}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-1">
                  <X size={14} className="text-destructive" />
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => fileRef.current?.click()}>
                <ImagePlus size={14} /> Foto do item
              </Button>
            )}

            <Input value={editItem.nome || ""} onChange={e => setEditItem(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do item *" />
            <Textarea value={editItem.descricao || ""} onChange={e => setEditItem(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição..." rows={2} />
            <Input type="number" value={editItem.preco ?? ""} onChange={e => setEditItem(p => ({ ...p, preco: parseFloat(e.target.value) || null }))} placeholder="Preço (R$)" />

            {categorias.length > 0 && (
              <Select value={editItem.categoria_id || "none"} onValueChange={v => setEditItem(p => ({ ...p, categoria_id: v === "none" ? null : v }))}>
                <SelectTrigger className="h-[44px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[13px] text-foreground">Disponível</span>
              <Switch checked={editItem.disponivel ?? true} onCheckedChange={v => setEditItem(p => ({ ...p, disponivel: v }))} />
            </div>

            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddItem(false); setEditItem({}); }}>Cancelar</Button>
              <Button className="flex-1 gap-1" onClick={saveItem} disabled={saving}>
                <Save size={14} /> {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PrestadorLayout>
  );
};

const ItemCard = ({ item, onToggle, onDelete, onEdit }: {
  item: Item; onToggle: (i: Item) => void; onDelete: (id: string) => void; onEdit: () => void;
}) => (
  <div className={`flex items-center gap-3 p-2 rounded-xl border border-border mb-2 ${!item.disponivel ? "opacity-50" : ""}`}>
    {item.imagem_url && (
      <img src={item.imagem_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
    )}
    <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
      <p className="text-[13px] font-semibold text-foreground truncate">{item.nome}</p>
      {item.descricao && <p className="text-[11px] text-muted-foreground truncate">{item.descricao}</p>}
      {item.preco != null && <p className="text-[13px] font-bold text-primary">R$ {item.preco.toFixed(2)}</p>}
    </div>
    <div className="flex items-center gap-1 flex-shrink-0">
      <Switch checked={item.disponivel} onCheckedChange={() => onToggle(item)} />
      <button onClick={() => onDelete(item.id)} className="text-destructive p-1">
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);

export default PrestadorCardapio;
