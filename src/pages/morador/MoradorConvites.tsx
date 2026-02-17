import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Copy, Trash2, Clock, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Convite {
  id: string;
  token: string;
  nome_visitante: string;
  data_visita: string;
  horario_inicio: string;
  horario_fim: string;
  status: string;
  nome_registrado: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Aguardando cadastro", color: "text-warning", icon: Clock },
  registrado: { label: "Cadastro feito", color: "text-primary", icon: UserPlus },
  usado: { label: "Utilizado", color: "text-success", icon: CheckCircle2 },
  expirado: { label: "Expirado", color: "text-destructive", icon: XCircle },
};

const MoradorConvites = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form
  const [nomeVisitante, setNomeVisitante] = useState("");
  const [dataVisita, setDataVisita] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("08:00");
  const [horarioFim, setHorarioFim] = useState("18:00");
  const [submitting, setSubmitting] = useState(false);

  const condominioId = roles.find((r) => r.role === "morador")?.condominio_id;

  const fetchConvites = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("convites_visitante")
      .select("id, token, nome_visitante, data_visita, horario_inicio, horario_fim, status, nome_registrado, created_at")
      .eq("morador_id", user.id)
      .order("created_at", { ascending: false });
    setConvites((data as Convite[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchConvites();
  }, [user]);

  const handleCreate = async () => {
    if (!nomeVisitante.trim() || !dataVisita || !condominioId) {
      toast.error("Preencha todos os campos");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (dataVisita < today) {
      toast.error("A data deve ser hoje ou futura");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("convites_visitante").insert({
      condominio_id: condominioId,
      morador_id: user!.id,
      nome_visitante: nomeVisitante.trim(),
      data_visita: dataVisita,
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
    });

    if (error) {
      toast.error("Erro ao criar convite");
    } else {
      toast.success("Convite criado!");
      setDialogOpen(false);
      setNomeVisitante("");
      setDataVisita("");
      fetchConvites();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("convites_visitante").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir convite");
    } else {
      toast.success("Convite excluído");
      fetchConvites();
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/visitante/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <MoradorLayout title="Convites" showBack>
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Create button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full">
              <Plus size={18} />
              Novo Convite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Convite</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Nome do visitante</label>
                <Input
                  placeholder="Nome completo"
                  value={nomeVisitante}
                  onChange={(e) => setNomeVisitante(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Data da visita</label>
                <Input
                  type="date"
                  value={dataVisita}
                  onChange={(e) => setDataVisita(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Horário início</label>
                  <Input
                    type="time"
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Horário fim</label>
                  <Input
                    type="time"
                    value={horarioFim}
                    onChange={(e) => setHorarioFim(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Criando..." : "Criar Convite"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : convites.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum convite criado ainda</p>
          </div>
        ) : (
          convites.map((c) => {
            const cfg = statusConfig[c.status] || statusConfig.pendente;
            const Icon = cfg.icon;
            return (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{c.nome_visitante}</p>
                      {c.nome_registrado && (
                        <p className="text-xs text-muted-foreground">Registrado como: {c.nome_registrado}</p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                      <Icon size={14} />
                      {cfg.label}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>📅 {new Date(c.data_visita + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                    <span>🕐 {c.horario_inicio.slice(0, 5)} - {c.horario_fim.slice(0, 5)}</span>
                  </div>

                  <div className="flex gap-2">
                    {c.status === "pendente" && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => copyLink(c.token)}>
                          <Copy size={14} />
                          Copiar link
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                    {c.status === "registrado" && (
                      <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => copyLink(c.token)}>
                        <Copy size={14} />
                        Reenviar link
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorConvites;
