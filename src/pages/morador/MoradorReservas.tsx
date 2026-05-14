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
          <div className="flex flex-col items-center justify-center text-center gap-6 py-16 px-8 bg-card rounded-[48px] border border-border/50 shadow-soft relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="h-24 w-24 rounded-[36px] bg-primary/5 flex items-center justify-center text-primary shadow-inner-glass">
              <CalendarCheck size={48} />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tighter">Reservar Espaço</h2>
              <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed font-medium">
                Agende áreas comuns de forma rápida e segura através da nossa <strong>IA no WhatsApp</strong>.
              </p>
            </div>
            <Button 
              className="mt-4 px-10 h-14 rounded-full font-black text-base shadow-xl shadow-primary/20 group active:scale-95 transition-all" 
              onClick={() => window.open('https://wa.me/seu-numero', '_blank')}
            >
              Chamar IA Agora
            </Button>
          </div>
        </section>

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
