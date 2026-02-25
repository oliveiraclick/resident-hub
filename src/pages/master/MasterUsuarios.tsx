import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle, XCircle, Plus, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useCategorias } from "@/hooks/useCategorias";

interface UserRow {
  roleId: string;
  userId: string;
  nome: string;
  role: string;
  condominioId: string | null;
  condominioNome: string | null;
  aprovado: boolean;
  createdAt: string;
  especialidade: string | null;
  prestadorId: string | null;
}

interface Condominio {
  id: string;
  nome: string;
}

const MasterUsuarios = () => {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";
  const [users, setUsers] = useState<UserRow[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>(initialFilter === "bloqueados" ? "all" : initialFilter);
  const [showBloqueados, setShowBloqueados] = useState(initialFilter === "bloqueados");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editCondominio, setEditCondominio] = useState("");
  const [editAprovado, setEditAprovado] = useState(false);
  const [editEspecialidade, setEditEspecialidade] = useState("");
  const [saving, setSaving] = useState(false);
  const { categorias } = useCategorias();

  const fetchData = async () => {
    setLoading(true);
    const [rolesRes, profilesRes, condRes, prestadoresRes] = await Promise.all([
      supabase.from("user_roles").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("condominios").select("id, nome"),
      supabase.from("prestadores").select("id, user_id, condominio_id, especialidade"),
    ]);
    const roles = rolesRes.data || [];
    const profiles = profilesRes.data || [];
    const conds = condRes.data || [];
    const prestadores = prestadoresRes.data || [];
    setCondominios(conds);

    const condMap = new Map(conds.map((c) => [c.id, c.nome]));
    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
    // Map by user_id+condominio_id for prestador lookup
    const prestadorMap = new Map(prestadores.map((p: any) => [`${p.user_id}_${p.condominio_id}`, p]));

    setUsers(
      roles.map((r: any) => {
        const prest = prestadorMap.get(`${r.user_id}_${r.condominio_id}`);
        return {
          roleId: r.id,
          userId: r.user_id,
          nome: profileMap.get(r.user_id)?.nome || "Sem nome",
          role: r.role,
          condominioId: r.condominio_id,
          condominioNome: r.condominio_id ? condMap.get(r.condominio_id) || "—" : "Global",
          aprovado: r.aprovado ?? true,
          createdAt: r.created_at,
          especialidade: prest?.especialidade || null,
          prestadorId: prest?.id || null,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openEdit = (u: UserRow) => {
    setEditTarget(u);
    setEditRole(u.role);
    setEditCondominio(u.condominioId || "none");
    setEditAprovado(u.aprovado);
    setEditEspecialidade(u.especialidade || "");
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);

    // Update user_roles
    const { error } = await supabase.from("user_roles").update({
      role: editRole as any,
      condominio_id: editCondominio === "none" ? null : editCondominio || null,
      aprovado: editAprovado,
    }).eq("id", editTarget.roleId);

    if (error) { setSaving(false); toast.error("Erro ao atualizar: " + error.message); return; }

    // Handle prestador record
    if (editRole === "prestador" && editEspecialidade.trim()) {
      const condId = editCondominio === "none" ? null : editCondominio;
      if (editTarget.prestadorId) {
        // Update existing prestador
        await supabase.from("prestadores").update({
          especialidade: editEspecialidade.trim(),
        }).eq("id", editTarget.prestadorId);
      } else if (condId) {
        // Create prestador record when changing role to prestador
        await supabase.from("prestadores").insert({
          user_id: editTarget.userId,
          condominio_id: condId,
          especialidade: editEspecialidade.trim(),
        });
      }
    }

    setSaving(false);
    toast.success("Usuário atualizado");
    setEditTarget(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", deleteTarget.roleId);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else { toast.success("Role removida"); fetchData(); }
    setDeleteTarget(null);
  };

  const toggleAprovado = async (u: UserRow) => {
    const { error } = await supabase.from("user_roles").update({ aprovado: !u.aprovado }).eq("id", u.roleId);
    if (error) toast.error("Erro");
    else { toast.success(u.aprovado ? "Usuário desaprovado" : "Usuário aprovado"); fetchData(); }
  };

  const roleFiltered = filterRole === "all" ? users : users.filter((u) => u.role === filterRole);
  const searchFiltered = search ? roleFiltered.filter((u) => u.nome.toLowerCase().includes(search.toLowerCase())) : roleFiltered;
  const filtered = showBloqueados ? searchFiltered.filter((u) => !u.aprovado) : searchFiltered;
  const bloqueadosCount = users.filter((u) => !u.aprovado).length;

  const handleAprovarTodos = async () => {
    const bloqueados = users.filter((u) => !u.aprovado);
    if (bloqueados.length === 0) return;
    const ids = bloqueados.map((u) => u.roleId);
    const { error } = await supabase.from("user_roles").update({ aprovado: true }).in("id", ids);
    if (error) toast.error("Erro ao aprovar: " + error.message);
    else { toast.success(`${bloqueados.length} usuário(s) aprovado(s)`); fetchData(); }
  };

  return (
    <MasterLayout title="Usuários">
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onValueChange={(v) => { setFilterRole(v); setShowBloqueados(false); }}>
          <SelectTrigger className="w-full h-[52px]">
            <SelectValue placeholder="Filtrar por role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as roles</SelectItem>
            <SelectItem value="morador">Morador</SelectItem>
            <SelectItem value="prestador">Prestador</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="platform_admin">Platform Admin</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant={showBloqueados ? "default" : "outline"}
            size="sm"
            onClick={() => setShowBloqueados(!showBloqueados)}
            className="text-xs"
          >
            <XCircle size={14} className="mr-1" />
            Bloqueados ({bloqueadosCount})
          </Button>
          {showBloqueados && bloqueadosCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleAprovarTodos} className="text-xs">
              <ShieldCheck size={14} className="mr-1" />
              Aprovar todos
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum usuário encontrado.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <Card key={u.roleId} className="rounded-[var(--radius-card)]">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{u.nome}</p>
                      {u.aprovado ? (
                        <CheckCircle size={14} className="text-primary flex-shrink-0" />
                      ) : (
                        <XCircle size={14} className="text-destructive flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.condominioNome}</p>
                    {u.especialidade && (
                      <p className="text-xs text-muted-foreground">🔧 {u.especialidade}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[10px]">{u.role}</Badge>
                    <button onClick={() => toggleAprovado(u)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                      title={u.aprovado ? "Desaprovar" : "Aprovar"}>
                      {u.aprovado
                        ? <XCircle size={14} className="text-muted-foreground" />
                        : <CheckCircle size={14} className="text-primary" />}
                    </button>
                    <button onClick={() => openEdit(u)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Pencil size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => setDeleteTarget(u)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário: {editTarget?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Role</label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="h-[52px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morador">Morador</SelectItem>
                  <SelectItem value="prestador">Prestador</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="platform_admin">Platform Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Condomínio</label>
              <Select value={editCondominio} onValueChange={setEditCondominio}>
                <SelectTrigger className="h-[52px]"><SelectValue placeholder="Nenhum (global)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (global)</SelectItem>
                  {condominios.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Especialidade - only for prestadores */}
            {editRole === "prestador" && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Especialidade</label>
                <Select value={editEspecialidade} onValueChange={setEditEspecialidade}>
                  <SelectTrigger className="h-[52px]"><SelectValue placeholder="Selecione a especialidade" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editAprovado} onChange={(e) => setEditAprovado(e.target.checked)}
                className="h-4 w-4 rounded border-border" id="aprovado-check" />
              <label htmlFor="aprovado-check" className="text-sm">Aprovado</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover role de {deleteTarget?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>Isso remove a role do usuário. Ele perderá acesso ao módulo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MasterLayout>
  );
};

export default MasterUsuarios;
