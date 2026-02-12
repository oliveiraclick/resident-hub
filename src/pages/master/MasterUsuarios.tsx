import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserRow {
  userId: string;
  nome: string;
  role: string;
  condominioNome: string | null;
  createdAt: string;
}

const MasterUsuarios = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");

  useEffect(() => {
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

      const condMap = new Map(conds.map((c) => [c.id, c.nome]));
      const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

      setUsers(
        roles.map((r) => ({
          userId: r.user_id,
          nome: profileMap.get(r.user_id)?.nome || "Sem nome",
          role: r.role,
          condominioNome: r.condominio_id ? condMap.get(r.condominio_id) || "—" : "Platform Admin",
          createdAt: r.created_at,
        }))
      );
      setLoading(false);
    };
    fetchData();
  }, []);

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
          {filtered.map((u, i) => (
            <Card key={i} className="rounded-[var(--radius-card)]">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{u.nome}</p>
                    <p className="text-xs text-muted-foreground">{u.condominioNome}</p>
                  </div>
                  <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">{u.role}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MasterLayout>
  );
};

export default MasterUsuarios;
