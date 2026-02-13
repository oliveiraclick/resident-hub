import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface UserRow {
  roleId: string;
  userId: string;
  nome: string;
  role: string;
  aprovado: boolean;
  createdAt: string;
}

const AdminUsuarios = () => {
  const { roles } = useAuth();
  const condominioId = roles.find((r) => r.role === "admin")?.condominio_id;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    if (!condominioId) return;
    setLoading(true);

    const [rolesRes, profilesRes] = await Promise.all([
      supabase.from("user_roles").select("*").eq("condominio_id", condominioId),
      supabase.from("profiles").select("user_id, nome"),
    ]);

    const rolesData = rolesRes.data || [];
    const profiles = profilesRes.data || [];
    const profileMap = new Map(profiles.map((p) => [p.user_id, p.nome]));

    setUsers(
      rolesData
        .filter((r: any) => r.role !== "platform_admin")
        .map((r: any) => ({
          roleId: r.id,
          userId: r.user_id,
          nome: profileMap.get(r.user_id) || "Sem nome",
          role: r.role,
          aprovado: r.aprovado ?? true,
          createdAt: r.created_at,
        }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [condominioId]);

  const toggleAprovado = async (u: UserRow) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ aprovado: !u.aprovado })
      .eq("id", u.roleId);
    if (error) toast.error("Erro ao atualizar");
    else {
      toast.success(u.aprovado ? "Usuário desaprovado" : "Usuário aprovado");
      fetchData();
    }
  };

  const filtered = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchSearch = !search || u.nome.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const pendentes = filtered.filter((u) => !u.aprovado);
  const aprovados = filtered.filter((u) => u.aprovado);

  return (
    <AdminLayout title="Usuários">
      <div className="space-y-4 pb-6">
        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="morador">Morador</SelectItem>
              <SelectItem value="prestador">Prestador</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : (
          <>
            {/* Pending section */}
            {pendentes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-destructive">
                  Pendentes de aprovação ({pendentes.length})
                </p>
                {pendentes.map((u) => (
                  <UserCard key={u.roleId} user={u} onToggle={toggleAprovado} />
                ))}
              </div>
            )}

            {/* Approved section */}
            <div className="space-y-2">
              {pendentes.length > 0 && (
                <p className="text-sm font-semibold text-foreground mt-4">
                  Aprovados ({aprovados.length})
                </p>
              )}
              {aprovados.length === 0 && pendentes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
              )}
              {aprovados.map((u) => (
                <UserCard key={u.roleId} user={u} onToggle={toggleAprovado} />
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

const UserCard = ({
  user,
  onToggle,
}: {
  user: UserRow;
  onToggle: (u: UserRow) => void;
}) => (
  <Card className="rounded-[var(--radius-card)]">
    <CardContent className="p-4 flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{user.nome}</p>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {user.role}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <Button
        variant={user.aprovado ? "ghost" : "default"}
        size="sm"
        onClick={() => onToggle(user)}
        className="shrink-0 gap-1"
      >
        {user.aprovado ? (
          <>
            <XCircle size={14} />
            <span className="hidden sm:inline">Desaprovar</span>
          </>
        ) : (
          <>
            <CheckCircle size={14} />
            Aprovar
          </>
        )}
      </Button>
    </CardContent>
  </Card>
);

export default AdminUsuarios;
