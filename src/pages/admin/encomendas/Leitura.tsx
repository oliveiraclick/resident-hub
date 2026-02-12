import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import QrScanner from "@/components/QrScanner";
import QrDisplay from "@/components/QrDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Leitura = () => {
  const [scanning, setScanning] = useState(false);
  const [pacote, setPacote] = useState<any>(null);

  const handleScan = async (qrCode: string) => {
    setScanning(false);
    const { data, error } = await (supabase
      .from("pacotes")
      .select("*") as any)
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (error || !data) {
      toast.error("Pacote não encontrado");
      return;
    }

    setPacote(data);
    toast.success("Pacote identificado");
  };

  return (
    <AdminLayout title="Leitura de QR">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {!scanning && !pacote && (
          <Button onClick={() => setScanning(true)}>
            Abrir Scanner
          </Button>
        )}

        {scanning && (
          <div className="flex flex-col gap-3">
            <QrScanner
              onScan={handleScan}
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

        {pacote && (
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <p className="text-title-md">Pacote encontrado</p>
              <p className="text-body text-muted-foreground">{pacote.descricao}</p>
              <div className="flex items-center gap-2">
                <span className="text-label">Status:</span>
                <span className="text-body font-semibold">{pacote.status}</span>
              </div>
              <QrDisplay value={(pacote as any).qr_code || pacote.id} label="QR do pacote" size={160} />
              <Button
                variant="outline"
                onClick={() => {
                  setPacote(null);
                  setScanning(false);
                }}
              >
                Ler outro
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Leitura;
