import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, CheckCircle, MapPin, Clock, X } from "lucide-react";

const statusColors: Record<string, string> = {
  RECEBIDO: "bg-primary/10 text-primary",
  AGUARDANDO_RETIRADA: "bg-warning/20 text-warning-foreground",
  AGUARDANDO_CONFIRMACAO: "bg-primary/20 text-primary animate-pulse",
  RETIRADO: "bg-success/10 text-success",
};

const statusLabels: Record<string, string> = {
  RECEBIDO: "Recebido na Portaria",
  AGUARDANDO_RETIRADA: "Disponível para Retirada",
  AGUARDANDO_CONFIRMACAO: "Aguardando sua Confirmação",
  RETIRADO: "Entregue / Retirado",
};

const MoradorEncomendas = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [pacotes, setPacotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState<any>(null);

  const fetchPacotes = async () => {
    if (!condominioId || !user) return;
    setLoading(true);

    const { data } = await (supabase
      .from("pacotes")
      .select("*") as any)
      .eq("condominio_id", condominioId)
      .eq("morador_id", user.id)
      .order("created_at", { ascending: false });

    setPacotes(data || []);
    
    // Check if any package is in AGUARDANDO_CONFIRMACAO to show modal
    const inConfirm = data?.find((p: any) => p.status === "AGUARDANDO_CONFIRMACAO");
    if (inConfirm) {
      setShowConfirmModal(inConfirm);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchPacotes();

    // Subscribe to changes to auto-show modal if attendant scans a package
    if (!user) return;
    const channel = supabase
      .channel('my-pacotes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pacotes', filter: `morador_id=eq.${user.id}` },
        (payload) => {
          if (payload.new.status === 'AGUARDANDO_CONFIRMACAO') {
            setShowConfirmModal(payload.new);
            fetchPacotes();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [condominioId, user]);

  const handleConfirmarFinal = async (pacoteId: string) => {
    const { error } = await supabase
      .from("pacotes")
      .update({
        status: "RETIRADO",
        retirado_em: new Date().toISOString(),
      } as any)
      .eq("id", pacoteId);

    if (error) {
      toast.error("Erro ao confirmar recebimento");
      return;
    }
    toast.success("Recebimento confirmado!");
    setShowConfirmModal(null);
    fetchPacotes();
  };

  return (
    <MoradorLayout title="Minhas Encomendas" showBack>
      <div className="flex flex-col gap-6 max-w-md mx-auto pb-20">
        {loading && pacotes.length === 0 ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full bg-muted animate-pulse rounded-[28px]" />
            ))}
          </div>
        ) : pacotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-4 py-20 px-6 bg-card rounded-[40px] border border-border/50 shadow-soft animate-in fade-in duration-500">
            <div className="h-20 w-20 rounded-[30px] bg-primary/5 flex items-center justify-center text-primary">
              <Package size={40} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight">Sem Encomendas</h2>
              <p className="text-sm text-muted-foreground max-w-[220px] mx-auto leading-relaxed">
                Você não possui encomendas aguardando retirada no momento.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in-up duration-500">
            {pacotes.map((p) => (
              <Card 
                key={p.id} 
                className={`border-none shadow-premium rounded-3xl-plus transition-all overflow-hidden ${
                  p.status === 'AGUARDANDO_CONFIRMACAO' 
                    ? 'ring-2 ring-primary bg-primary/[0.02] shadow-primary/20 scale-[1.02]' 
                    : 'bg-card'
                }`}
              >
                <CardContent className="flex flex-col gap-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.1em] ${statusColors[p.status] || ""}`}>
                          {statusLabels[p.status] || p.status}
                        </span>
                      </div>
                      <p className="text-xl font-black text-foreground leading-tight">{p.descricao || "Encomenda"}</p>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock size={14} className="opacity-50" />
                          <p className="text-[13px] font-medium">Recebido em {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        {p.localizacao && p.status !== 'RETIRADO' && (
                          <div className="flex items-center gap-2 text-primary font-bold">
                            <MapPin size={14} />
                            <p className="text-[13px] uppercase tracking-wider">Local: {p.localizacao}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-16 w-16 bg-muted rounded-[22px] flex items-center justify-center flex-shrink-0 text-muted-foreground/40">
                      <Package size={32} />
                    </div>
                  </div>

                  {p.status === "AGUARDANDO_CONFIRMACAO" && (
                    <Button 
                      className="w-full h-14 text-base font-black gap-2 shadow-lg shadow-primary/30 rounded-2xl" 
                      onClick={() => handleConfirmarFinal(p.id)}
                    >
                      <CheckCircle size={20} /> Confirmar Recebimento
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Confirmação (Popup) — Estilo Premium */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <Card className="w-full max-w-sm border-none shadow-premium overflow-hidden animate-in zoom-in-95 duration-300 rounded-[40px]">
              <div className="bg-primary p-8 text-primary-foreground text-center relative">
                <button 
                  onClick={() => setShowConfirmModal(null)} 
                  className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="w-20 h-20 bg-white/20 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-inner-glass">
                  <Package size={40} />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-2">Confirmar Retirada</h3>
                <p className="text-sm opacity-80 leading-relaxed px-4">
                  Você está confirmando que o pacote foi entregue em mãos agora?
                </p>
              </div>
              <CardContent className="p-8 flex flex-col gap-6">
                <div className="space-y-4">
                  <div className="p-5 bg-muted rounded-[24px]">
                    <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1.5 block">Pacote Identificado</label>
                    <p className="font-bold text-lg text-foreground">{showConfirmModal.descricao}</p>
                    {showConfirmModal.localizacao && (
                      <p className="text-sm font-medium text-primary mt-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                        <MapPin size={14} /> {showConfirmModal.localizacao}
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] text-center text-muted-foreground/60 px-6 leading-relaxed">
                    Ao confirmar, o registro de entrega será finalizado em seu nome.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button 
                    className="w-full h-14 text-lg font-black shadow-lg shadow-primary/20 rounded-2xl" 
                    onClick={() => handleConfirmarFinal(showConfirmModal.id)}
                  >
                    Sim, Recebi
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 text-muted-foreground font-bold rounded-xl" 
                    onClick={() => setShowConfirmModal(null)}
                  >
                    Ainda não
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorEncomendas;
