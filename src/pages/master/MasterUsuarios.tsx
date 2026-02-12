import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle, XCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface UserRow {
  roleId: string;
  userId: string;
  nome: string;
  role: string;
  condominioId: string | null;
  condominioNome: string | null;
  aprovado: boolean;
  createdAt: string;
}

interface Condominio {
  id: string;
  nome: string;
}

const MasterUsuarios = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editCondominio, setEditCondominio] = useState("");
  const [editAprovado, setEditAprovado] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [rolesRes, profilesRes, condRes] = await Promise.all([
      supabase.from("user_roles").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("condominios").select("id, nome"),
    ]);
    const roles = rolesRes.data || [];
    const profiles = profilesRes.data || [];
    const conds = condRes.data || [];
    setCondominios(conds);

    const condMap = new Map(conds.map((c) => [c.id, c.nome]));
    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

    setUsers(
      roles.map((r: any) => ({
        roleId: r.id,
        userId: r.user_id,
        nome: profileMap.get(r.user_id)?.nome || "Sem nome",
        role: r.role,
        condominioId: r.condominio_id,
        condominioNome: r.condominio_id ? condMap.get(r.condominio_id) || "—" : "Global",
        aprovado: r.aprovado ?? true,
        createdAt: r.created_at,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openEdit = (u: UserRow) => {
    setEditTarget(u);
    setEditRole(u.role);
    setEditCondominio(u.condominioId || "none");
    setEditAprovado(u.aprovado);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    const { error } = await supabase.from("user_roles").update({
      role: editRole as any,
      condominio_id: editCondominio === "none" ? null : editCondominio || null,
      aprovado: editAprovado,
    }).eq("id", editTarget.roleId);
    setSaving(false);
    if (error) { toast.error("Erro ao atualizar: " + error.message); return; }
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

  const filtered = filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  return (
    <MasterLayout title="Usuários">
      <div className="mb-4">
        <Select value={filterRole} onValueChange={setFilterRole}>
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
