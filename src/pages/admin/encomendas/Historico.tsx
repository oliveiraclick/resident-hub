import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import QrDisplay from "@/components/QrDisplay";
import { Package, User, MapPin, Truck, Calendar, X, Hash, ChevronRight } from "lucide-react";

const statusColors: Record<string, string> = {
  RECEBIDO: "bg-blue-100 text-blue-700",
  AGUARDANDO_RETIRADA: "bg-orange-100 text-orange-700",
  AGUARDANDO_CONFIRMACAO: "bg-indigo-100 text-indigo-700 animate-pulse",
  RETIRADO: "bg-emerald-100 text-emerald-700",
};

const statusLabels: Record<string, string> = {
  RECEBIDO: "Recebido",
  AGUARDANDO_RETIRADA: "Na Portaria",
  AGUARDANDO_CONFIRMACAO: "Com Morador",
  RETIRADO: "Concluído",
};

const Historico = () => {
  const { roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [pacotes, setPacotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [selectedPacote, setSelectedPacote] = useState<any>(null);

  const fetchPacotes = async () => {
    if (!condominioId) return;
    setLoading(true);
    let query = supabase
      .from("pacotes")
      .select(`
        *,
        lotes (entregador, descricao),
        unidades (bloco, numero),
        profiles:morador_id (display_name)
      `)
      .eq("condominio_id", condominioId)
      .order("created_at", { ascending: false });

    if (filtroStatus !== "todos") {
      query = query.eq("status", filtroStatus);
    }

    const { data } = await (query as any);
    setPacotes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPacotes();
  }, [condominioId, filtroStatus]);

  const statusOptions = ["todos", "RECEBIDO", "AGUARDANDO_RETIRADA", "AGUARDANDO_CONFIRMACAO", "RETIRADO"];

  return (
    <AdminLayout title="Histórico" showBack>
      <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-20">
        <header className="px-1">
          <h1 className="text-4xl font-black tracking-tight mb-2">Histórico</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">
            Relatório completo de encomendas
          </p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`whitespace-nowrap rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                filtroStatus === s
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "todos" ? "Todos" : statusLabels[s] || s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 w-full bg-muted animate-pulse rounded-[32px]" />
            ))}
          </div>
        ) : pacotes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center bg-card rounded-[48px] border border-dashed">
            <Package size={64} className="text-muted-foreground/20" />
            <p className="text-muted-foreground font-bold">Nenhuma encomenda encontrada.</p>
          </div>
        ) : (
          <div className="grid gap-4 animate-in fade-in-up duration-500">
            {pacotes.map((p) => (
              <Card
                key={p.id}
                className="group cursor-pointer border-none shadow-soft hover:shadow-premium rounded-[32px] transition-all active:scale-[0.99] overflow-hidden bg-card"
                onClick={() => setSelectedPacote(p)}
              >
                <CardContent className="flex items-center gap-5 p-6">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-[22px] transition-transform group-hover:scale-110 duration-300 ${statusColors[p.status] || "bg-muted text-muted-foreground"}`}>
                    <Package size={28} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${statusColors[p.status] || ""}`}>
                        {statusLabels[p.status] || p.status}
                      </span>
                      {p.unidades && (
                        <span className="text-[9px] font-black bg-muted px-2.5 py-1 rounded-full uppercase tracking-wider text-muted-foreground">
                          {p.unidades.bloco ? `${p.unidades.bloco}` : ""} • {p.unidades.numero}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-black tracking-tight text-foreground truncate">
                      {p.codigo_rastreio || "Sem código"}
                    </p>
                    <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")} · {p.profiles?.display_name || "Pendente"}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Detalhes — Estilo Premium */}
        {selectedPacote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <Card className="w-full max-w-md shadow-premium animate-in zoom-in-95 duration-300 rounded-[48px] border-none overflow-hidden bg-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 p-8 bg-muted/30">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight">Detalhes</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">ID: {selectedPacote.id.slice(0,8)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPacote(null)} className="h-12 w-12 rounded-2xl hover:bg-destructive/10 hover:text-destructive">
                  <X size={24} />
                </Button>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Status Atual</label>
                    <span className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest inline-block ${statusColors[selectedPacote.status] || ""}`}>
                      {statusLabels[selectedPacote.status] || selectedPacote.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-right">
                    <label>Data Chegada</label>
                    <p className="text-sm font-black flex items-center justify-end gap-2">
                      <Calendar size={16} className="text-primary" /> {new Date(selectedPacote.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-[24px]">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                      <Hash size={20} />
                    </div>
                    <div>
                      <label className="mb-0.5">Rastreio / Ref</label>
                      <p className="text-base font-black font-mono tracking-tight">{selectedPacote.codigo_rastreio || "N/A"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Truck size={20} />
                      </div>
                      <div>
                        <label>Transportadora</label>
                        <p className="text-sm font-black">{selectedPacote.lotes?.entregador || "Não informado"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <User size={20} />
                      </div>
                      <div>
                        <label>Morador / Unidade</label>
                        <p className="text-sm font-black">
                          {selectedPacote.profiles?.display_name || "Pendente"}
                          {selectedPacote.unidades && ` • Unidade ${selectedPacote.unidades.numero}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <label>Localização Interna</label>
                        <p className="text-sm font-black text-primary">{selectedPacote.localizacao || "Não definido"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedPacote.status !== 'RETIRADO' && (
                  <div className="flex flex-col items-center gap-3 pt-6 border-t border-border/50">
                    <label className="text-center">QR Code do Pacote</label>
                    <div className="p-4 bg-white rounded-[32px] shadow-soft border border-border/40">
                       <QrDisplay value={selectedPacote.qr_code} label="" size={140} />
                    </div>
                  </div>
                )}

                {selectedPacote.status === 'RETIRADO' && (
                  <div className="p-6 bg-emerald-500 rounded-[32px] text-center shadow-lg shadow-emerald-500/20 animate-in zoom-in-90">
                    <label className="text-white/60 mb-1">Finalizado em</label>
                    <p className="text-lg font-black text-white">
                      {new Date(selectedPacote.retirado_em).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Historico;
