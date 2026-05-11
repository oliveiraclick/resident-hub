import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarCheck, Trash2, X, Users, DollarSign, Info, Home, Clock } from "lucide-react";

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
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // For Quadra schedule
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);

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

  // Fetch occupied slots when quadra is selected or date changes
  useEffect(() => {
    const fetchOccupiedSlots = async () => {
      if (selectedEspaco?.categoria === "quadra" && data) {
        const { data: res } = await supabase
          .from("reservas")
          .select("horario_inicio")
          .eq("espaco_id", selectedEspaco.id)
          .eq("data", data)
          .eq("status", "confirmada");
        
        setOccupiedSlots(res?.map(r => r.horario_inicio.slice(0, 5)) || []);
      }
    };
    fetchOccupiedSlots();
  }, [selectedEspaco, data]);

  const handleSubmit = async () => {
    if (!selectedEspaco || !data || !horarioInicio || !horarioFim || !user || !condominioId) return;
    setSubmitting(true);

    // Rule for Quadra: 1 reservation per day per resident
    if (selectedEspaco.categoria === "quadra") {
      const { count } = await supabase
        .from("reservas")
        .select("id", { count: "exact", head: true })
        .eq("morador_id", user.id)
        .eq("espaco_id", selectedEspaco.id)
        .eq("data", data)
        .eq("status", "confirmada");

      if (count && count > 0) {
        toast.error("Você já possui uma reserva para esta quadra neste dia.");
        setSubmitting(false);
        return;
      }
    }

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

  const hours = Array.from({ length: 17 }, (_, i) => {
    const hour = (i + 6).toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const selectSlot = (start: string) => {
    setHorarioInicio(start);
    const [h, m] = start.split(':');
    const endHour = parseInt(h).toString().padStart(2, '0');
    setHorarioFim(`${endHour}:59:50`);
  };

  // ─────── Pré-reservas pendentes (criadas pela IA via WhatsApp) ───────
  const [preReservas, setPreReservas] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());

  const fetchPreReservas = async () => {
    if (!user) return;
    const { data: rows } = await supabase
      .from("reservas")
      .select("id, espaco_id, data, horario_inicio, horario_fim, expira_em, espacos(nome)")
      .eq("morador_id", user.id)
      .eq("status", "pre_reserva")
      .order("expira_em", { ascending: true });
    const validas = (rows || []).filter((r: any) => r.expira_em && new Date(r.expira_em).getTime() > Date.now());
    setPreReservas(validas);
  };

  useEffect(() => {
    fetchPreReservas();
    const i = setInterval(() => {
      setNow(Date.now());
      fetchPreReservas();
    }, 15000);
    return () => clearInterval(i);
  }, [user]);

  const confirmarPreReserva = async (id: string) => {
    const { error } = await supabase
      .from("reservas")
      .update({ status: "confirmada", expira_em: null })
      .eq("id", id);
    if (error) toast.error("Erro ao confirmar");
    else {
      toast.success("Reserva confirmada!");
      fetchPreReservas();
      fetchData();
    }
  };

  const cancelarPreReserva = async (id: string) => {
    const { error } = await supabase.from("reservas").delete().eq("id", id);
    if (error) toast.error("Erro ao cancelar");
    else {
      toast.success("Pré-reserva cancelada");
      fetchPreReservas();
    }
  };

  const formatRestante = (expira: string) => {
    const ms = new Date(expira).getTime() - now;
    if (ms <= 0) return "expirado";
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}m ${sec.toString().padStart(2, "0")}s`;
  };

  return (
    <MoradorLayout title="Reservas" showBack>
      {preReservas.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          <h2 className="text-[15px] font-bold text-foreground">Pré-reservas aguardando confirmação</h2>
          {preReservas.map((p) => (
            <Card key={p.id} className="border-primary/40 bg-primary/5">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground">{p.espacos?.nome || "Espaço"}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR")} · {p.horario_inicio?.slice(0, 5)} - {p.horario_fim?.slice(0, 5)}
                    </p>
                    <p className="text-[11px] font-semibold text-primary mt-1">
                      Solicitada via WhatsApp · expira em {formatRestante(p.expira_em)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => confirmarPreReserva(p.id)}>
                    Confirmar reserva
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => cancelarPreReserva(p.id)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center justify-center text-center gap-3 py-12">
        <CalendarCheck size={48} className="text-muted-foreground" />
        <h2 className="text-[18px] font-bold text-foreground">Em breve</h2>
        <p className="text-[13px] text-muted-foreground max-w-xs">
          A área de reservas está em fase de testes. Pré-reservas solicitadas pela IA do condomínio aparecem aqui para você confirmar.
        </p>
      </div>
      {false && (
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
                    {e.categoria !== "quadra" && (
                      <p className="text-[16px] font-extrabold text-primary whitespace-nowrap">
                        {e.preco > 0 ? `R$ ${e.preco.toFixed(2)}` : "Grátis"}
                      </p>
                    )}
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
      )}

      {/* Modal Form */}
      {selectedEspaco && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedEspaco(null)}>
          <Card className="w-full max-w-md rounded-t-[var(--radius-card)] sm:rounded-[var(--radius-card)] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-bold text-foreground">Reservar {selectedEspaco.nome}</p>
                  <p className="text-[11px] text-muted-foreground">{categoriaLabel[selectedEspaco.categoria]}</p>
                </div>
                <button onClick={() => setSelectedEspaco(null)} className="p-1 hover:bg-muted rounded-full">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-foreground ml-1">Data da Reserva</label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} min={new Date().toISOString().split("T")[0]} className="h-11" />
              </div>

              {selectedEspaco.categoria === "quadra" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock size={16} />
                    <span className="text-[13px] font-bold uppercase tracking-wide">Horários Disponíveis (1h cada)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {hours.map((h) => {
                      const isOccupied = occupiedSlots.includes(h);
                      const isSelected = horarioInicio === h;
                      return (
                        <button
                          key={h}
                          disabled={isOccupied}
                          onClick={() => selectSlot(h)}
                          className={`
                            py-2.5 text-[13px] font-bold rounded-xl border transition-all
                            ${isSelected ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 
                              isOccupied ? 'bg-muted/50 text-muted-foreground border-transparent cursor-not-allowed opacity-50' : 
                              'bg-card text-foreground border-border hover:border-primary/50'}
                          `}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center bg-muted/30 py-2 rounded-lg">
                    * Limite de 1 horário por dia por morador.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-muted-foreground ml-1">Início</label>
                    <Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} className="h-11" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-muted-foreground ml-1">Fim</label>
                    <Input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} className="h-11" />
                  </div>
                </div>
              )}

              {selectedEspaco.preco > 0 && selectedEspaco.categoria !== "quadra" && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl p-4 mt-2">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-primary" />
                    <span className="text-[13px] font-medium text-foreground">Taxa de Locação</span>
                  </div>
                  <span className="text-[16px] font-extrabold text-primary">R$ {selectedEspaco.preco.toFixed(2)}</span>
                </div>
              )}

              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !data || !horarioInicio || !horarioFim} 
                className="h-12 text-[15px] font-bold mt-2 shadow-xl shadow-primary/20"
              >
                {submitting ? "Reservando..." : "Confirmar Agendamento"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </MoradorLayout>
  );
};

export default MoradorReservas;
