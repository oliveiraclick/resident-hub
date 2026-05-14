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
      <div className="flex flex-col gap-4 max-w-md mx-auto pb-10">
        {loading && pacotes.length === 0 ? (
          <p className="text-body text-muted-foreground text-center py-8">Carregando...</p>
        ) : pacotes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <Package size={40} className="text-muted-foreground opacity-40" />
            </div>
            <div>
              <p className="font-bold text-lg">Sem encomendas</p>
              <p className="text-sm text-muted-foreground">Você não possui encomendas registradas.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pacotes.map((p) => (
              <Card key={p.id} className={p.status === 'AGUARDANDO_CONFIRMACAO' ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''}>
                <CardContent className="flex flex-col gap-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[p.status] || ""}`}>
                          {statusLabels[p.status] || p.status}
                        </span>
                      </div>
                      <p className="text-[15px] font-bold leading-tight">{p.descricao || "Encomenda"}</p>
                      <div className="flex flex-col gap-1 pt-1">
                        <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                          <Clock size={12} /> Recebido em {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </p>
                        {p.localizacao && p.status !== 'RETIRADO' && (
                          <p className="text-[12px] font-medium text-primary flex items-center gap-1.5">
                            <MapPin size={12} /> Local: {p.localizacao}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Package size={24} className="text-muted-foreground" />
                    </div>
                  </div>

                  {p.status === "AGUARDANDO_CONFIRMACAO" && (
                    <Button 
                      className="w-full h-12 text-sm font-bold gap-2 shadow-md" 
                      onClick={() => handleConfirmarFinal(p.id)}
                    >
                      <CheckCircle size={18} /> Confirmar Recebimento Agora
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Confirmação (Popup) */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-sm border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-primary p-6 text-primary-foreground text-center relative">
                <button 
                  onClick={() => setShowConfirmModal(null)} 
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={32} />
                </div>
                <h3 className="text-xl font-bold">Confirmar Recebimento</h3>
                <p className="text-sm opacity-90 mt-1">Você está retirando esta encomenda na portaria?</p>
              </div>
              <CardContent className="p-6 flex flex-col gap-6">
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Encomenda</p>
                    <p className="font-bold text-foreground">{showConfirmModal.descricao}</p>
                    {showConfirmModal.localizacao && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                        <MapPin size={14} /> {showConfirmModal.localizacao}
                      </p>
                    )}
                  </div>
                  <p className="text-[12px] text-center text-muted-foreground px-4">
                    Ao confirmar, você declara que recebeu o pacote em mãos.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    className="w-full h-14 text-lg font-bold shadow-lg" 
                    onClick={() => handleConfirmarFinal(showConfirmModal.id)}
                  >
                    Confirmar e Finalizar
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground" 
                    onClick={() => setShowConfirmModal(null)}
                  >
                    Agora não
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
