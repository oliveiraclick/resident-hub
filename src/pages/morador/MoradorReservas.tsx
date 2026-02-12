import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarCheck, Plus, Trash2, X } from "lucide-react";

interface Espaco {
  id: string;
  nome: string;
  descricao: string | null;
  capacidade: number | null;
}

interface Reserva {
  id: string;
  espaco_id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  status: string;
  espaco_nome?: string;
}

const MoradorReservas = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [espacoId, setEspacoId] = useState("");
  const [data, setData] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!condominioId || !user) return;
    setLoading(true);

    const [espacosRes, reservasRes] = await Promise.all([
      supabase.from("espacos").select("id, nome, descricao, capacidade").eq("condominio_id", condominioId),
      supabase
        .from("reservas")
        .select("id, espaco_id, data, horario_inicio, horario_fim, status")
        .eq("morador_id", user.id)
        .eq("condominio_id", condominioId)
        .order("data", { ascending: false }),
    ]);

    const espacosList = (espacosRes.data as Espaco[]) || [];
    setEspacos(espacosList);

    const reservasList = ((reservasRes.data as any[]) || []).map((r: any) => ({
      ...r,
      espaco_nome: espacosList.find((e) => e.id === r.espaco_id)?.nome || "Espaço",
    }));
    setReservas(reservasList);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [condominioId, user]);

  const handleSubmit = async () => {
    if (!espacoId || !data || !horarioInicio || !horarioFim || !user || !condominioId) return;
    setSubmitting(true);

    const { error } = await supabase.from("reservas").insert({
      condominio_id: condominioId,
      espaco_id: espacoId,
      morador_id: user.id,
      data,
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
      status: "confirmada",
    } as any);

    if (error) {
      toast.error("Erro ao criar reserva");
    } else {
      toast.success("Reserva criada!");
      setShowForm(false);
      setEspacoId("");
      setData("");
      setHorarioInicio("");
      setHorarioFim("");
      fetchData();
    }
    setSubmitting(false);
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("reservas").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao cancelar reserva");
    } else {
      toast.success("Reserva cancelada");
      fetchData();
    }
  };

  const statusStyle: Record<string, string> = {
    confirmada: "bg-success/10 text-success",
    cancelada: "bg-destructive/10 text-destructive",
  };

  return (
    <MoradorLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-foreground">Minhas Reservas</h2>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus size={16} />
              Nova
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-foreground">Nova Reserva</p>
                <button onClick={() => setShowForm(false)}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              {espacos.length === 0 ? (
                <p className="text-[13px] text-muted-foreground py-4 text-center">
                  Nenhum espaço disponível. O administrador precisa cadastrar os espaços primeiro.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-muted-foreground ml-1">Espaço</label>
                    <Select value={espacoId} onValueChange={setEspacoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o espaço" />
                      </SelectTrigger>
                      <SelectContent>
                        {espacos.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.nome} {e.capacidade ? `(${e.capacidade} pessoas)` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-muted-foreground ml-1">Data</label>
                    <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-medium text-muted-foreground ml-1">Início</label>
                      <Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] font-medium text-muted-foreground ml-1">Fim</label>
                      <Input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} />
                    </div>
                  </div>

                  <Button onClick={handleSubmit} disabled={submitting || !espacoId || !data || !horarioInicio || !horarioFim}>
                    {submitting ? "Reservando..." : "Confirmar Reserva"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lista */}
        {loading ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
        ) : reservas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <CalendarCheck size={40} className="text-muted-foreground" />
            <p className="text-[14px] text-muted-foreground">Nenhuma reserva</p>
          </div>
        ) : (
          reservas.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CalendarCheck size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{r.espaco_nome}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")} · {r.horario_inicio?.slice(0, 5)} - {r.horario_fim?.slice(0, 5)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle[r.status] || "bg-muted text-muted-foreground"}`}>
                    {r.status}
                  </span>
                  {r.status === "confirmada" && (
                    <button onClick={() => handleCancel(r.id)} className="text-destructive">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorReservas;
