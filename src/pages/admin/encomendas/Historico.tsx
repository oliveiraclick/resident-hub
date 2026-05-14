import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import QrDisplay from "@/components/QrDisplay";
import { Package, User, MapPin, Truck, Calendar, X, Hash } from "lucide-react";

const statusColors: Record<string, string> = {
  RECEBIDO: "bg-primary/10 text-primary",
  AGUARDANDO_RETIRADA: "bg-warning/20 text-warning-foreground",
  AGUARDANDO_CONFIRMACAO: "bg-blue-100 text-blue-700",
  RETIRADO: "bg-success/10 text-success",
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
    <AdminLayout title="Histórico de Encomendas" showBack>
      <div className="flex flex-col gap-4 max-w-2xl mx-auto pb-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filtroStatus === s
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "todos" ? "Todos" : statusLabels[s] || s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : pacotes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package size={48} className="text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">Nenhuma encomenda encontrada.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {pacotes.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer active:scale-[0.99] transition-all hover:border-primary/30"
                onClick={() => setSelectedPacote(p)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${statusColors[p.status] || ""}`}>
                    <Package size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[p.status] || ""}`}>
                        {statusLabels[p.status] || p.status}
                      </span>
                      {p.unidades && (
                        <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full uppercase">
                          {p.unidades.bloco ? `B${p.unidades.bloco} - ` : ""}U{p.unidades.numero}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold truncate">
                      {p.codigo_rastreio || "Sem código"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")} · {p.profiles?.display_name || "Não vinculado"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Detalhes */}
        {selectedPacote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95">
              <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                <h3 className="font-bold">Detalhes da Encomenda</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPacote(null)}>
                  <X size={20} />
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[selectedPacote.status] || ""}`}>
                      {statusLabels[selectedPacote.status] || selectedPacote.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Recebido em</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar size={14} className="text-primary" /> {new Date(selectedPacote.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Hash className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Código de Rastreio / Ref</p>
                      <p className="text-sm font-bold font-mono">{selectedPacote.codigo_rastreio || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Transportadora / Entregador</p>
                      <p className="text-sm font-medium">{selectedPacote.lotes?.entregador || "Não informado"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Morador / Unidade</p>
                      <p className="text-sm font-medium">
                        {selectedPacote.profiles?.display_name || "Pendente"}
                        {selectedPacote.unidades && ` (Unidade ${selectedPacote.unidades.numero})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Localização na Portaria</p>
                      <p className="text-sm font-medium">{selectedPacote.localizacao || "Não definido"}</p>
                    </div>
                  </div>
                </div>

                {selectedPacote.status !== 'RETIRADO' && (
                  <div className="flex justify-center pt-4 border-t">
                    <QrDisplay value={selectedPacote.qr_code} label="QR Interno do Pacote" size={160} />
                  </div>
                )}

                {selectedPacote.status === 'RETIRADO' && (
                  <div className="p-3 bg-success/10 rounded-lg text-center">
                    <p className="text-xs font-bold text-success uppercase">Retirado em</p>
                    <p className="text-sm font-bold text-success">
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
