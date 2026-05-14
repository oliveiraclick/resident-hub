import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarCheck, Trash2, X, Users, DollarSign, Info, Home, Clock, MapPin, ChevronRight, Search, LayoutGrid, Dumbbell, Coffee } from "lucide-react";
import { ptBR } from "date-fns/locale";

const FULL_DAY_CATEGORIES = ["salao", "quiosque"];
const FULL_DAY_INICIO = "09:00";
const FULL_DAY_FIM = "22:00";

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
  // For Salão/Quiosque - dates already booked (any morador)
  const [bookedDates, setBookedDates] = useState<string[]>([]);

  const isFullDay = selectedEspaco && FULL_DAY_CATEGORIES.includes(selectedEspaco.categoria);

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
        .gte("data", new Date().toISOString().split("T")[0])
        .order("data", { ascending: true }),
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

  // Fetch occupied data when an espaco is selected
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedEspaco) return;

      if (selectedEspaco.categoria === "quadra" && data) {
        const { data: res } = await supabase
          .from("reservas")
          .select("horario_inicio")
          .eq("espaco_id", selectedEspaco.id)
          .eq("data", data)
          .eq("status", "confirmada");
        setOccupiedSlots(res?.map((r: any) => r.horario_inicio.slice(0, 5)) || []);
      } else if (FULL_DAY_CATEGORIES.includes(selectedEspaco.categoria)) {
        const today = new Date().toISOString().split("T")[0];
        const { data: res } = await supabase
          .from("reservas")
          .select("data")
          .eq("espaco_id", selectedEspaco.id)
          .eq("status", "confirmada")
          .gte("data", today);
        setBookedDates(res?.map((r: any) => r.data) || []);
      }
    };
    fetchAvailability();
  }, [selectedEspaco, data]);

  const handleSubmit = async () => {
    if (!selectedEspaco || !data || !user || !condominioId) return;

    const fullDay = FULL_DAY_CATEGORIES.includes(selectedEspaco.categoria);
    const inicio = fullDay ? FULL_DAY_INICIO : horarioInicio;
    const fim = fullDay ? FULL_DAY_FIM : horarioFim;

    if (!inicio || !fim) {
      toast.error("Selecione o horário");
      return;
    }
    setSubmitting(true);

    if (fullDay && bookedDates.includes(data)) {
      toast.error("Esta data já está reservada.");
      setSubmitting(false);
      return;
    }
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
      horario_inicio: inicio,
      horario_fim: fim,
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
      <div className="flex flex-col gap-8 pb-20">
        {preReservas.length > 0 && (
          <section className="animate-in fade-in-up duration-500">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-1.5 h-4 bg-primary rounded-full" />
              <h2 className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest">Aguardando Você</h2>
            </div>
            <div className="flex flex-col gap-4">
              {preReservas.map((p) => (
                <Card key={p.id} className="border-none shadow-premium bg-gradient-to-br from-white to-primary/5 overflow-hidden rounded-[32px]">
                  <CardContent className="flex flex-col gap-5 p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                        <Clock size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-black text-foreground tracking-tight">{p.espacos?.nome || "Espaço"}</p>
                        <p className="text-sm font-medium text-muted-foreground mt-1">
                          {new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR")} · {p.horario_inicio?.slice(0, 5)} - {p.horario_fim?.slice(0, 5)}
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mt-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <p className="text-[11px] font-black text-primary uppercase tracking-wider">
                            Expira em {formatRestante(p.expira_em)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button className="flex-1 h-14 rounded-2xl font-black shadow-lg shadow-primary/20" onClick={() => confirmarPreReserva(p.id)}>
                        Confirmar
                      </Button>
                      <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black border-2" onClick={() => cancelarPreReserva(p.id)}>
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="animate-in fade-in-up duration-500 delay-150">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-1.5 h-4 bg-primary rounded-full" />
            <h2 className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest">Áreas Comuns</h2>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-[28px] bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : espacos.length === 0 ? (
            <Card className="border-none shadow-soft rounded-[32px]">
              <CardContent className="flex flex-col items-center text-center gap-4 py-12 px-6">
                <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Home size={28} />
                </div>
                <div>
                  <p className="text-base font-black text-foreground">Nenhuma área disponível</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    O síndico ainda não cadastrou áreas comuns para reserva.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {espacos.map((e) => (
                <Card
                  key={e.id}
                  onClick={() => setSelectedEspaco(e)}
                  className="border-none shadow-premium rounded-[28px] hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer overflow-hidden group"
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    {e.imagem_url ? (
                      <img
                        src={e.imagem_url}
                        alt={e.nome}
                        className="h-20 w-20 rounded-2xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                        <Home size={28} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-black text-foreground tracking-tight truncate">{e.nome}</p>
                      <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-wider mt-0.5">
                        {categoriaLabel[e.categoria] || e.categoria}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                        {e.capacidade && (
                          <span className="inline-flex items-center gap-1">
                            <Users size={12} /> {e.capacidade}
                          </span>
                        )}
                        {e.preco > 0 ? (
                          <span className="inline-flex items-center gap-1 text-success font-bold">
                            <DollarSign size={12} /> R$ {Number(e.preco).toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-success font-bold">Gratuito</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" size={22} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Reservation Dialog */}
        <Dialog open={!!selectedEspaco} onOpenChange={(o) => !o && setSelectedEspaco(null)}>
          <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
            {selectedEspaco && (
              <>
                {selectedEspaco.imagem_url ? (
                  <img src={selectedEspaco.imagem_url} alt={selectedEspaco.nome} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary">
                    <Home size={48} />
                  </div>
                )}
                <div className="p-6 flex flex-col gap-5">
                  <DialogHeader className="text-left space-y-2">
                    <DialogTitle className="text-2xl font-black tracking-tight">{selectedEspaco.nome}</DialogTitle>
                    <DialogDescription className="text-sm">
                      {categoriaLabel[selectedEspaco.categoria] || selectedEspaco.categoria}
                      {selectedEspaco.capacidade ? ` · até ${selectedEspaco.capacidade} pessoas` : ""}
                      {selectedEspaco.preco > 0 ? ` · R$ ${Number(selectedEspaco.preco).toFixed(2)}` : " · Gratuito"}
                    </DialogDescription>
                  </DialogHeader>

                  {selectedEspaco.descricao && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedEspaco.descricao}</p>
                  )}

                  {selectedEspaco.regras && (
                    <div className="flex gap-2 p-3 rounded-2xl bg-muted/50 text-xs text-muted-foreground">
                      <Info size={14} className="flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{selectedEspaco.regras}</p>
                    </div>
                  )}

                  <div className="grid gap-4">
                    {isFullDay ? (
                      <>
                        <div>
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                            Escolha a data
                          </Label>
                          <div className="rounded-3xl border border-border/60 bg-card p-2 shadow-soft flex justify-center">
                            <Calendar
                              mode="single"
                              locale={ptBR}
                              selected={data ? new Date(data + "T12:00:00") : undefined}
                              onSelect={(d) => d && setData(d.toISOString().split("T")[0])}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                if (date < today) return true;
                                const iso = date.toISOString().split("T")[0];
                                return bookedDates.includes(iso);
                              }}
                              modifiers={{
                                booked: bookedDates.map((d) => new Date(d + "T12:00:00")),
                              }}
                              modifiersClassNames={{
                                booked: "line-through opacity-40",
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-4 mt-3 px-1 text-[11px] font-semibold text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Disponível
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /> Reservado
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 text-xs">
                          <Clock size={14} className="text-primary flex-shrink-0" />
                          <p className="font-medium text-foreground">
                            Horário: <strong>09:00 às 22:00</strong> (dia inteiro)
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</Label>
                          <Input
                            type="date"
                            value={data}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(ev) => setData(ev.target.value)}
                            className="mt-1.5 h-12 rounded-2xl"
                          />
                        </div>

                        {selectedEspaco.categoria === "quadra" ? (
                          <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Horário (1h)</Label>
                            <div className="grid grid-cols-4 gap-2 mt-1.5">
                              {hours.map((h) => {
                                const isOccupied = occupiedSlots.includes(h);
                                const isSelected = horarioInicio === h;
                                return (
                                  <button
                                    key={h}
                                    disabled={isOccupied}
                                    onClick={() => selectSlot(h)}
                                    className={`h-11 rounded-xl text-xs font-bold transition-all ${
                                      isOccupied
                                        ? "bg-muted text-muted-foreground/40 line-through cursor-not-allowed"
                                        : isSelected
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "bg-muted/50 hover:bg-muted text-foreground"
                                    }`}
                                  >
                                    {h}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Início</Label>
                              <Input
                                type="time"
                                value={horarioInicio}
                                onChange={(ev) => setHorarioInicio(ev.target.value)}
                                className="mt-1.5 h-12 rounded-2xl"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fim</Label>
                              <Input
                                type="time"
                                value={horarioFim}
                                onChange={(ev) => setHorarioFim(ev.target.value)}
                                className="mt-1.5 h-12 rounded-2xl"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <Button
                    className="h-14 rounded-2xl font-black text-base shadow-lg shadow-primary/20 mt-2"
                    disabled={submitting || !data || (!isFullDay && (!horarioInicio || !horarioFim))}
                    onClick={handleSubmit}
                  >
                    {submitting ? "Reservando..." : "Confirmar Reserva"}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {reservas.length > 0 && (
          <section className="animate-in fade-in-up duration-500 delay-300">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-1.5 h-4 bg-primary rounded-full" />
              <h2 className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest">Meus Agendamentos</h2>
            </div>
            <div className="grid gap-4">
              {reservas.map((r) => (
                <Card key={r.id} className="border-none shadow-premium rounded-[28px] hover:shadow-lg transition-all active:scale-[0.98]">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="h-14 w-14 rounded-[22px] bg-muted flex items-center justify-center flex-shrink-0 text-primary group-hover:scale-110 transition-transform">
                      <CalendarCheck size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-black text-foreground tracking-tight truncate">{r.espaco_nome}</p>
                      <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                        <Clock size={14} className="opacity-50" />
                        <p className="text-xs font-semibold uppercase tracking-wider">
                          {new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")} · {r.horario_inicio?.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-success/10 text-success uppercase tracking-[0.1em]">
                        {r.status}
                      </span>
                      {r.status === "confirmada" && (
                        <button onClick={() => handleCancel(r.id)} className="p-2 text-destructive hover:bg-destructive/5 rounded-full transition-colors">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorReservas;
