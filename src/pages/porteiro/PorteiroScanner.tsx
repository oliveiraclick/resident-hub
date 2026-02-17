import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import QrScanner from "@/components/QrScanner";
import { Button } from "@/components/ui/button";
import { LogOut, ScanLine, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import logoMorador from "@/assets/logo-morador.png";
import { toast } from "sonner";

type ValidationResult = {
  status: "granted" | "denied";
  message: string;
  nome?: string;
  foto?: string;
};

const PorteiroScanner = () => {
  const { signOut } = useAuth();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const actionRef = useRef(false);

  const handleScan = async (qrData: string) => {
    if (actionRef.current) return;
    actionRef.current = true;
    setScanning(false);

    try {
      // qrData is the convite qr_code (which is the convite id)
      const { data: convite, error } = await supabase
        .from("convites_visitante")
        .select("id, nome_visitante, nome_registrado, foto_url, data_visita, horario_inicio, horario_fim, status, usado_em")
        .eq("qr_code", qrData)
        .maybeSingle();

      if (error || !convite) {
        setResult({ status: "denied", message: "QR Code inválido ou não encontrado" });
        return;
      }

      if (convite.usado_em || convite.status === "usado") {
        setResult({ status: "denied", message: "Este convite já foi utilizado" });
        return;
      }

      if (convite.status !== "registrado") {
        setResult({ status: "denied", message: "Visitante ainda não completou o cadastro" });
        return;
      }

      // Check date
      const today = new Date().toISOString().split("T")[0];
      if (convite.data_visita !== today) {
        setResult({ status: "denied", message: `Convite válido apenas para ${convite.data_visita}` });
        return;
      }

      // Check time window
      const now = new Date();
      const [hI, mI] = convite.horario_inicio.split(":").map(Number);
      const [hF, mF] = convite.horario_fim.split(":").map(Number);
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const startMins = hI * 60 + mI;
      const endMins = hF * 60 + mF;

      if (nowMins < startMins || nowMins > endMins) {
        setResult({
          status: "denied",
          message: `Convite válido entre ${convite.horario_inicio.slice(0, 5)} e ${convite.horario_fim.slice(0, 5)}`,
        });
        return;
      }

      // Mark as used
      const { error: updateError } = await supabase
        .from("convites_visitante")
        .update({ usado_em: new Date().toISOString(), status: "usado" })
        .eq("id", convite.id);

      if (updateError) {
        setResult({ status: "denied", message: "Erro ao registrar entrada. Tente novamente." });
        return;
      }

      setResult({
        status: "granted",
        message: "Acesso liberado!",
        nome: convite.nome_registrado || convite.nome_visitante,
        foto: convite.foto_url || undefined,
      });
    } catch {
      setResult({ status: "denied", message: "Erro de conexão. Tente novamente." });
    } finally {
      actionRef.current = false;
    }
  };

  const reset = () => {
    setResult(null);
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-background mx-auto max-w-[480px] flex flex-col">
      {/* Header */}
      <header
        className="px-5 pt-6 pb-4 flex items-center justify-between"
        style={{
          background: "linear-gradient(145deg, hsl(var(--header-bg)) 0%, hsl(var(--header-mid)) 60%, hsl(var(--primary)) 100%)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <img src={logoMorador} alt="Morador.app" className="h-9 w-9 object-contain" />
          <div>
            <span className="font-bold text-[16px] text-white block leading-none">Portaria</span>
            <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Scanner de visitantes</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} className="text-white/60 hover:text-white hover:bg-white/10">
          <LogOut size={20} />
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
        {scanning && !result && (
          <>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ScanLine size={20} className="text-primary" />
              <p className="text-[14px] font-medium">Aponte para o QR Code do visitante</p>
            </div>
            <QrScanner
              onScan={handleScan}
              onError={(err) => toast.error(err)}
            />
          </>
        )}

        {result && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            {/* Result card */}
            <div
              className="w-full rounded-3xl p-8 flex flex-col items-center gap-4 text-center"
              style={{
                background: result.status === "granted"
                  ? "linear-gradient(135deg, hsl(142 71% 45%), hsl(142 76% 36%))"
                  : "linear-gradient(135deg, hsl(0 84% 60%), hsl(0 72% 51%))",
                boxShadow: result.status === "granted"
                  ? "0 12px 40px hsla(142, 71%, 45%, 0.3)"
                  : "0 12px 40px hsla(0, 84%, 60%, 0.3)",
              }}
            >
              {result.status === "granted" ? (
                <CheckCircle2 size={64} className="text-white" />
              ) : (
                <XCircle size={64} className="text-white" />
              )}

              {result.foto && (
                <img
                  src={result.foto}
                  alt="Visitante"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
                />
              )}

              {result.nome && (
                <p className="text-[20px] font-bold text-white">{result.nome}</p>
              )}

              <p className="text-[16px] font-semibold text-white/90">{result.message}</p>
            </div>

            <Button onClick={reset} variant="outline" className="gap-2">
              <RotateCcw size={16} />
              Escanear outro
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PorteiroScanner;
