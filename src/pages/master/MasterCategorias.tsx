import { useState, useEffect } from "react";
import MasterLayout from "@/components/MasterLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ICON_MAP, ICON_NAMES, getIcon, SERVICE_GROUPS } from "@/lib/iconMap";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface CategoriaServico {
  id: string;
  nome: string;
  icone: string;
  grupo: string;
  ordem: number;
  ativo: boolean;
}

const MasterCategorias = () => {
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoriaServico | null>(null);

  // Form state
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("Wrench");
  const [grupo, setGrupo] = useState<string>(SERVICE_GROUPS[0]);
  const [iconSearch, setIconSearch] = useState("");

  const fetchCategorias = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categorias_servico")
      .select("*")
      .order("ordem", { ascending: true });
    setCategorias((data as CategoriaServico[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategorias(); }, []);

  const openNew = () => {
    setEditing(null);
    setNome("");
    setIcone("Wrench");
    setGrupo(SERVICE_GROUPS[0]);
    setIconSearch("");
    setDialogOpen(true);
  };

  const openEdit = (cat: CategoriaServico) => {
    setEditing(cat);
    setNome(cat.nome);
    setIcone(cat.icone);
    setGrupo(cat.grupo);
    setIconSearch("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) { toast.error("Nome obrigatório"); return; }

    const nextOrdem = categorias.length > 0 ? Math.max(...categorias.map(c => c.ordem)) + 1 : 1;

    if (editing) {
      const { error } = await supabase
        .from("categorias_servico")
        .update({ nome: nome.trim(), icone, grupo })
        .eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoria atualizada");
    } else {
      const { error } = await supabase
        .from("categorias_servico")
        .insert({ nome: nome.trim(), icone, grupo, ordem: nextOrdem });
      if (error) { toast.error(error.message); return; }
      toast.success("Categoria criada");
    }
    setDialogOpen(false);
    fetchCategorias();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categorias_servico").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Categoria removida");
    fetchCategorias();
  };

  const handleToggle = async (cat: CategoriaServico) => {
    await supabase.from("categorias_servico").update({ ativo: !cat.ativo }).eq("id", cat.id);
    fetchCategorias();
  };

  const filteredIcons = iconSearch
    ? ICON_NAMES.filter((n) => n.toLowerCase().includes(iconSearch.toLowerCase()))
    : ICON_NAMES;

  // Group categorias for display
  const grouped = SERVICE_GROUPS.map((g) => ({
    group: g,
    items: categorias.filter((c) => c.grupo === g),
  })).filter((g) => g.items.length > 0);

  const ungrouped = categorias.filter((c) => !SERVICE_GROUPS.includes(c.grupo as any));

  return (
    <MasterLayout title="Categorias de Serviço">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-foreground">
            {categorias.length} categorias
          </h2>
          <Button size="sm" onClick={openNew} className="gap-1.5 rounded-xl">
            <Plus size={16} />
            Nova
          </Button>
        </div>

        {loading ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map((section) => (
              <div key={section.group}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {section.group}
                </p>
                <div className="flex flex-col gap-2">
                  {section.items.map((cat) => {
                    const Icon = getIcon(cat.icone);
                    return (
                      <Card key={cat.id} className={`${!cat.ativo ? "opacity-50" : ""}`}>
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                            <Icon size={18} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">{cat.nome}</p>
                            <p className="text-[11px] text-muted-foreground">{cat.icone}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(cat)}>
                              <div className={`h-2.5 w-2.5 rounded-full ${cat.ativo ? "bg-green-500" : "bg-muted-foreground"}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                              <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cat.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}

            {ungrouped.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Outros</p>
                <div className="flex flex-col gap-2">
                  {ungrouped.map((cat) => {
                    const Icon = getIcon(cat.icone);
                    return (
                      <Card key={cat.id} className={`${!cat.ativo ? "opacity-50" : ""}`}>
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                            <Icon size={18} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">{cat.nome}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(cat)}>
                              <div className={`h-2.5 w-2.5 rounded-full ${cat.ativo ? "bg-green-500" : "bg-muted-foreground"}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                              <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cat.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog - Nova/Editar Categoria */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Nome</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Salão de Beleza" />
            </div>

            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Grupo</label>
              <Select value={grupo} onValueChange={setGrupo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Ícone</label>
              <Input
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Buscar ícone..."
                className="mb-2"
              />
              <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1">
                {filteredIcons.map((name) => {
                  const Icon = ICON_MAP[name];
                  const selected = icone === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setIcone(name)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-[9px] leading-tight truncate w-full text-center">
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MasterLayout>
  );
};

export default MasterCategorias;
