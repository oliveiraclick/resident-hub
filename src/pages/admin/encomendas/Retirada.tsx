import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import QrScanner from "@/components/QrScanner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Package, MapPin, CheckCircle, RefreshCcw, Camera } from "lucide-react";

type Step = "scan_morador" | "lista_pacotes" | "scan_pacote" | "aguardando_morador";

const Retirada = () => {
  const [step, setStep] = useState<Step>("scan_morador");
  const [morador, setMorador] = useState<any>(null);
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [selectedPacote, setSelectedPacote] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScanMorador = async (qrCode: string) => {
    setScanning(false);
    setLoading(true);
    try {
      // Find resident by QR code (ID)
      const { data: perfil, error: perfilError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", qrCode)
        .single();

      if (perfilError || !perfil) {
        toast.error("Morador não encontrado");
        return;
      }

      setMorador(perfil);
      
      // Fetch pending packages
      const { data: pacs, error: pacsError } = await supabase
        .from("pacotes")
        .select("*")
        .eq("morador_id", qrCode)
        .eq("status", "AGUARDANDO_RETIRADA");

      if (pacsError) throw pacsError;

      setPacotes(pacs || []);
      setStep("lista_pacotes");
      toast.success("Morador identificado");
    } catch (err: any) {
      toast.error("Erro ao identificar morador: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScanPacote = async (code: string) => {
    setScanning(false);
    
    // Check if the scanned package is in the resident's list
    const found = pacotes.find(p => p.codigo_rastreio === code || p.qr_code === code);
    
    if (!found) {
      toast.error("Este pacote não pertence a este morador ou não está nesta lista");
      return;
    }

    setSelectedPacote(found);
    
    // Update status to AGUARDANDO_CONFIRMACAO
    setLoading(true);
    try {
      const { error } = await supabase
        .from("pacotes")
        .update({ status: "AGUARDANDO_CONFIRMACAO" } as any)
        .eq("id", found.id);

      if (error) throw error;
      
      setStep("aguardando_morador");
      toast.success("Pacote identificado! Aguardando morador confirmar no app.");
      
      // Setup real-time listener for confirmation
      const channel = supabase
        .channel(`pacote-${found.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'pacotes', filter: `id=eq.${found.id}` },
          (payload) => {
            if (payload.new.status === 'RETIRADO') {
              toast.success("Retirada confirmada pelo morador!");
              handleReset();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err: any) {
      toast.error("Erro ao processar pacote: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("scan_morador");
    setMorador(null);
    setPacotes([]);
    setSelectedPacote(null);
    setScanning(false);
  };

  return (
    <AdminLayout title="Entrega de Encomenda">
      <div className="flex flex-col gap-4 max-w-2xl mx-auto pb-20">
        {step === "scan_morador" && (
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Identificar Morador</h3>
                <p className="text-muted-foreground">Escaneie o QR Code do Morador no celular dele.</p>
              </div>
              
              {!scanning ? (
                <Button className="w-full h-16 text-lg font-bold gap-2" onClick={() => setScanning(true)}>
                  <Camera className="w-6 h-6" /> Escanear QR Morador
                </Button>
              ) : (
                <div className="w-full space-y-4">
                  <QrScanner
                    onScan={handleScanMorador}
                    onError={(err) => {
                      toast.error(err);
                      setScanning(false);
                    }}
                  />
                  <Button variant="outline" className="w-full h-12" onClick={() => setScanning(false)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "lista_pacotes" && morador && (
          <div className="space-y-4">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                  {morador.display_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{morador.display_name}</h3>
                  <p className="text-sm opacity-80">Morador identificado</p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto text-white hover:bg-white/10" onClick={handleReset}>
                  Trocar
                </Button>
              </CardContent>
            </Card>

            <h4 className="font-bold flex items-center gap-2 px-1">
              <Package className="w-5 h-5" /> Encomendas Pendentes ({pacotes.length})
            </h4>

            {pacotes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhuma encomenda pendente para este morador.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {pacotes.map((p) => (
                  <Card key={p.id} className="overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="font-bold">{p.descricao || "Pacote"}</p>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" /> {p.localizacao || "Não definido"}
                        </div>
                        <p className="text-xs font-mono opacity-60">{p.codigo_rastreio}</p>
                      </div>
                      <Button onClick={() => setStep("scan_pacote")} size="sm" variant="secondary">
                        Retirar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "scan_pacote" && (
          <Card>
            <CardHeader className="text-center border-b">
              <h3 className="font-bold">Bipar Pacote para Entrega</h3>
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-4">
              <QrScanner
                onScan={handleScanPacote}
                onError={(err) => toast.error(err)}
              />
              <Button variant="outline" className="h-12" onClick={() => setStep("lista_pacotes")}>
                Voltar para Lista
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "aguardando_morador" && selectedPacote && (
          <Card className="border-2 border-primary animate-pulse">
            <CardContent className="p-8 flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <RefreshCcw className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Aguardando Morador</h3>
                <p className="text-muted-foreground">
                  O morador deve confirmar o recebimento no app Morador.app para finalizar.
                </p>
              </div>
              <div className="w-full p-4 bg-muted rounded-lg text-left space-y-2">
                <p className="text-sm font-bold uppercase text-muted-foreground">Pacote sendo entregue:</p>
                <p className="font-medium">{selectedPacote.descricao}</p>
                <p className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {selectedPacote.localizacao}
                </p>
              </div>
              <Button variant="ghost" onClick={handleReset} className="text-muted-foreground">
                Cancelar e Voltar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Retirada;
