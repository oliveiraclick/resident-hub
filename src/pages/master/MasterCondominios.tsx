import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface CondominioRow {
  id: string;
  nome: string;
  endereco: string | null;
  created_at: string;
  totalUsuarios: number;
  totalUnidades: number;
}

const MasterCondominios = () => {
  const [condominios, setCondominios] = useState<CondominioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [condRes, rolesRes, unidadesRes] = await Promise.all([
      supabase.from("condominios").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("condominio_id"),
      supabase.from("unidades").select("condominio_id"),
    ]);

    const conds = condRes.data || [];
    const roles = rolesRes.data || [];
    const unidades = unidadesRes.data || [];

    setCondominios(
      conds.map((c) => ({
        ...c,
        totalUsuarios: roles.filter((r) => r.condominio_id === c.id).length,
        totalUnidades: unidades.filter((u) => u.condominio_id === c.id).length,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!nome.trim()) return;
    const { error } = await supabase.from("condominios").insert({ nome, endereco: endereco || null });
    if (error) {
      toast.error("Erro ao criar condomínio");
    } else {
      toast.success("Condomínio criado");
      setNome("");
      setEndereco("");
      setShowForm(false);
      fetchData();
    }
  };

  return (
    <MasterLayout title="Condomínios">
      <div className="mb-4">
        <Button onClick={() => setShowForm(!showForm)} className="rounded-[var(--radius-button)]">
          <Plus size={16} className="mr-2" /> Criar Condomínio
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-[var(--radius-card)] mb-4">
          <CardContent className="p-4 space-y-3">
            <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} className="h-[52px]" />
            <Input placeholder="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="h-[52px]" />
            <Button onClick={handleCreate} className="rounded-[var(--radius-button)] w-full">Salvar</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {condominios.map((c) => (
            <Card key={c.id} className="rounded-[var(--radius-card)]">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{c.endereco || "Sem endereço"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{c.totalUsuarios} usuários</span>
                  <span>{c.totalUnidades} unidades</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MasterLayout>
  );
};

export default MasterCondominios;
