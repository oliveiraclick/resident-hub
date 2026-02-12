import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import QrScanner from "@/components/QrScanner";
import QrDisplay from "@/components/QrDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

type Step = "scan_morador" | "scan_pacote" | "confirmar" | "concluido";

const Retirada = () => {
  const [step, setStep] = useState<Step>("scan_morador");
  const [moradorId, setMoradorId] = useState<string>("");
  const [pacote, setPacote] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  const handleScanMorador = async (qrCode: string) => {
    setScanning(false);
    // O QR do morador contém o user_id
    setMoradorId(qrCode);
    setStep("scan_pacote");
    toast.success("Morador identificado");
  };

  const handleScanPacote = async (qrCode: string) => {
    setScanning(false);
    const { data, error } = await (supabase
      .from("pacotes")
      .select("*") as any)
      .eq("qr_code", qrCode)
      .eq("status", "AGUARDANDO_RETIRADA")
      .maybeSingle();

    if (error || !data) {
      toast.error("Pacote não encontrado ou não disponível para retirada");
      return;
    }

    // Verificar se o pacote pertence ao morador
    if ((data as any).morador_id && (data as any).morador_id !== moradorId) {
      toast.error("Este pacote não pertence a este morador");
      return;
    }

    setPacote(data);
    setStep("confirmar");
  };

  const handleConfirmar = async () => {
    if (!pacote) return;

    const { error } = await supabase
      .from("pacotes")
      .update({
        status: "RETIRADO",
        retirado_em: new Date().toISOString(),
      } as any)
      .eq("id", pacote.id);

    if (error) {
      toast.error("Erro ao confirmar retirada");
      return;
    }

    toast.success("Retirada confirmada!");
    setStep("concluido");
  };

  const handleReset = () => {
    setStep("scan_morador");
    setMoradorId("");
    setPacote(null);
    setScanning(false);
  };

  return (
    <AdminLayout title="Retirada">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {/* Step 1: Scan morador QR */}
        {step === "scan_morador" && (
          <>
            <p className="text-body text-muted-foreground text-center">
              Passo 1: Escaneie o QR code do morador
            </p>
            {!scanning ? (
              <Button onClick={() => setScanning(true)}>
                Escanear QR do Morador
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <QrScanner
                  onScan={handleScanMorador}
                  onError={(err) => {
                    toast.error(err);
                    setScanning(false);
                  }}
                />
                <Button variant="outline" onClick={() => setScanning(false)}>
                  Cancelar
                </Button>
              </div>
            )}
          </>
        )}

        {/* Step 2: Scan pacote QR */}
        {step === "scan_pacote" && (
          <>
            <p className="text-body text-muted-foreground text-center">
              Passo 2: Escaneie o QR code do pacote
            </p>
            {!scanning ? (
              <Button onClick={() => setScanning(true)}>
                Escanear QR do Pacote
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <QrScanner
                  onScan={handleScanPacote}
                  onError={(err) => {
                    toast.error(err);
                    setScanning(false);
                  }}
                />
                <Button variant="outline" onClick={() => setScanning(false)}>
                  Cancelar
                </Button>
              </div>
            )}
          </>
        )}

        {/* Step 3: Confirmação */}
        {step === "confirmar" && pacote && (
          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              <p className="text-title-md">Confirmar Retirada</p>
              <p className="text-body text-muted-foreground">{pacote.descricao}</p>
              <div className="flex items-center gap-2">
                <span className="text-label">Status atual:</span>
                <span className="text-body font-semibold">{pacote.status}</span>
              </div>
              <Button onClick={handleConfirmar}>
                Confirmar Retirada
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Cancelar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Concluído */}
        {step === "concluido" && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle size={32} className="text-success" />
              </div>
              <p className="text-title-md">Retirada confirmada!</p>
              <p className="text-body text-muted-foreground">
                Pacote marcado como RETIRADO.
              </p>
              <Button onClick={handleReset}>
                Nova Retirada
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Retirada;
