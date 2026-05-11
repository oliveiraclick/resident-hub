import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarCheck, Trash2, X, Users, DollarSign, Info, Home } from "lucide-react";

interface Espaco {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  capacidade: number | null;
  preco: number;
  regras: string | null;
  imagem_url: string | null;
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
  const condominioId = roles.find((r) => r.role === "morador")?.condominio_id || roles[0]?.condominio_id;

  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEspaco, setSelectedEspaco] = useState<Espaco | null>(null);
  const [data, setData] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!condominioId || !user) return;
    setLoading(true);

    const [espacosRes, reservasRes] = await Promise.all([
      supabase.from("espacos").select("*").eq("condominio_id", condominioId).order("categoria"),
      supabase
        .from("reservas")
        .select("id, espaco_id, data, horario_inicio, horario_fim, status")
        .eq("morador_id", user.id)
        .eq("condominio_id", condominioId)
        .order("data", { ascending: false }),
    ]);

    const espacosList = (espacosRes.data as any[]) || [];
    setEspacos(espacosList as Espaco[]);

    const reservasList = ((reservasRes.data as any[]) || []).map((r: any) => ({
      ...r,
      espaco_nome: espacosList.find((e: any) => e.id === r.espaco_id)?.nome || "Espaço",
    }));
    setReservas(reservasList);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [condominioId, user]);

  const handleSubmit = async () => {
    if (!selectedEspaco || !data || !horarioInicio || !horarioFim || !user || !condominioId) return;
    setSubmitting(true);

    const { error } = await supabase.from("reservas").insert({
      condominio_id: condominioId,
      espaco_id: selectedEspaco.id,
      morador_id: user.id,
      data,
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
      status: "confirmada",
    } as any);

    if (error) {
      toast.error("Erro ao criar reserva");
    } else {
      toast.success("Reserva solicitada!");
      setSelectedEspaco(null);
      setData("");
      setHorarioInicio("");
      setHorarioFim("");
      fetchData();
    }
    setSubmitting(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancelar esta reserva?")) return;
    const { error } = await supabase.from("reservas").delete().eq("id", id);
    if (error) toast.error("Erro ao cancelar reserva");
    else {
      toast.success("Reserva cancelada");
      fetchData();
    }
  };

  const categoriaLabel: Record<string, string> = {
    quiosque: "Quiosque",
    salao: "Salão",
    quadra: "Quadra",
    piscina: "Piscina",
    academia: "Academia",
  };

  return (
    <MoradorLayout title="Reservas">
      <div className="flex flex-col gap-5 pb-6">
        {/* Header */}
        <div>
          <h2 className="text-[18px] font-bold text-foreground">Espaços do Condomínio</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">Escolha um espaço para reservar</p>
        </div>

        {/* Espaços disponíveis */}
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : espacos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 bg-card border border-dashed rounded-[var(--radius-card)]">
            <Home size={40} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">Nenhum espaço cadastrado pela administração.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {espacos.map((e) => (
              <Card key={e.id} className="rounded-[var(--radius-card)] overflow-hidden border-border">
                {e.imagem_url && (
                  <div className="w-full h-40 overflow-hidden relative">
                    <img src={e.imagem_url} alt={e.nome} className="w-full h-full object-cover" />
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold text-white bg-primary px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {categoriaLabel[e.categoria] || e.categoria}
                    </span>
                  </div>
                )}
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-foreground">{e.nome}</h3>
                    <p className="text-[16px] font-extrabold text-primary whitespace-nowrap">
                      {e.preco > 0 ? `R$ ${e.preco.toFixed(2)}` : "Grátis"}
                    </p>
                  </div>
                  {e.descricao && <p className="text-[12px] text-muted-foreground">{e.descricao}</p>}
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground font-medium mt-1">
                    {e.capacidade && (
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {e.capacidade} pessoas
                      </span>
                    )}
                  </div>
                  {e.regras && (
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2 mt-1">
                      <Info size={12} className="mt-0.5 flex-shrink-0" />
                      <span>{e.regras}</span>
                    </div>
                  )}
                  <Button size="sm" onClick={() => setSelectedEspaco(e)} className="mt-2 gap-1.5">
                    <CalendarCheck size={14} /> Reservar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Minhas Reservas */}
        {reservas.length > 0 && (
          <>
            <h2 className="text-[16px] font-semibold text-foreground mt-2">Minhas Reservas</h2>
            <div className="grid gap-2">
              {reservas.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CalendarCheck size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{r.espaco_nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")} · {r.horario_inicio?.slice(0, 5)} - {r.horario_fim?.slice(0, 5)}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
                      {r.status}
                    </span>
                    {r.status === "confirmada" && (
                      <button onClick={() => handleCancel(r.id)} className="text-destructive p-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Form */}
      {selectedEspaco && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedEspaco(null)}>
          <Card className="w-full max-w-md rounded-t-[var(--radius-card)] sm:rounded-[var(--radius-card)] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-foreground">Reservar {selectedEspaco.nome}</p>
                <button onClick={() => setSelectedEspaco(null)}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground ml-1">Data</label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} min={new Date().toISOString().split("T")[0]} />
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

              {selectedEspaco.preco > 0 && (
                <div className="flex items-center gap-2 bg-primary/5 rounded-lg p-3 text-[12px]">
                  <DollarSign size={14} className="text-primary" />
                  <span className="text-foreground">Taxa de locação: <strong>R$ {selectedEspaco.preco.toFixed(2)}</strong></span>
                </div>
              )}

              <Button onClick={handleSubmit} disabled={submitting || !data || !horarioInicio || !horarioFim}>
                {submitting ? "Reservando..." : "Confirmar Reserva"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </MoradorLayout>
  );
};

export default MoradorReservas;
