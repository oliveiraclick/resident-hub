import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Aviso {
  id: string;
  texto: string;
  ativo: boolean;
  ordem: number;
}

const AdminAvisos = () => {
  const { user, roles } = useAuth();
  const condominioId = roles.find((r) => r.role === "admin")?.condominio_id ?? null;
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [newTexto, setNewTexto] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAvisos = async () => {
    if (!condominioId) return;
    const { data } = await supabase
      .from("avisos")
      .select("id, texto, ativo, ordem")
      .eq("condominio_id", condominioId)
      .order("ordem", { ascending: true });
    setAvisos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAvisos();
  }, [condominioId]);

  const addAviso = async () => {
    if (!newTexto.trim() || !condominioId) return;
    const { error } = await supabase.from("avisos").insert({
      texto: newTexto.trim(),
      condominio_id: condominioId,
      ordem: avisos.length,
    });
    if (error) {
      toast.error("Erro ao adicionar aviso");
      return;
    }
    setNewTexto("");
    toast.success("Aviso adicionado");
    fetchAvisos();
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from("avisos").update({ ativo: !ativo }).eq("id", id);
    fetchAvisos();
  };

  const deleteAviso = async (id: string) => {
    await supabase.from("avisos").delete().eq("id", id);
    toast.success("Aviso removido");
    fetchAvisos();
  };

  return (
    <AdminLayout title="Breaking News">
      <div className="p-4 space-y-5">
        <p className="text-[13px] text-muted-foreground">
          Gerencie os avisos que aparecem no ticker da Home do morador.
        </p>

        {/* Add new */}
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Manutenção na piscina dia 05/03"
            value={newTexto}
            onChange={(e) => setNewTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAviso()}
            className="flex-1"
          />
          <Button onClick={addAviso} size="icon" className="flex-shrink-0">
            <Plus size={18} />
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {avisos.map((aviso) => (
            <div
              key={aviso.id}
              className="flex items-center gap-3 rounded-xl bg-card border p-3"
            >
              <GripVertical size={16} className="text-muted-foreground flex-shrink-0" />
              <p className={`flex-1 text-[13px] ${aviso.ativo ? "text-foreground" : "text-muted-foreground line-through"}`}>
                {aviso.texto}
              </p>
              <Switch
                checked={aviso.ativo}
                onCheckedChange={() => toggleAtivo(aviso.id, aviso.ativo)}
              />
              <button
                onClick={() => deleteAviso(aviso.id)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {!loading && avisos.length === 0 && (
            <p className="text-center text-[13px] text-muted-foreground py-8">
              Nenhum aviso cadastrado ainda.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAvisos;
