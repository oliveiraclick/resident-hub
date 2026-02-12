import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import QrScanner from "@/components/QrScanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Triagem = () => {
  const { roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [scanning, setScanning] = useState(false);
  const [pacote, setPacote] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");

  useEffect(() => {
    if (!condominioId) return;
    supabase
      .from("unidades")
      .select("id, bloco, numero, user_id")
      .eq("condominio_id", condominioId)
      .then(({ data }) => {
        if (data) setUnidades(data);
      });
  }, [condominioId]);

  const handleScan = async (qrCode: string) => {
    setScanning(false);
    const { data, error } = await (supabase
      .from("pacotes")
      .select("*") as any)
      .eq("qr_code", qrCode)
      .eq("status", "RECEBIDO")
      .maybeSingle();

    if (error || !data) {
      toast.error("Pacote não encontrado ou já triado");
      return;
    }
    setPacote(data);
  };

  const handleVincular = async () => {
    if (!selectedUnidade || !pacote) return;

    const unidade = unidades.find((u) => u.id === selectedUnidade);

    const { error } = await supabase
      .from("pacotes")
      .update({
        unidade_id: selectedUnidade,
        morador_id: unidade?.user_id || null,
        status: "AGUARDANDO_RETIRADA",
      } as any)
      .eq("id", pacote.id);

    if (error) {
      toast.error("Erro ao vincular pacote");
      return;
    }

    toast.success("Pacote vinculado ao morador");
    setPacote(null);
    setSelectedUnidade("");
  };

  return (
    <AdminLayout title="Triagem">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {!scanning && !pacote && (
          <Button onClick={() => setScanning(true)}>
            Escanear pacote para triagem
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
            <CardContent className="flex flex-col gap-4 p-4">
              <p className="text-title-md">Vincular ao morador</p>
              <p className="text-body text-muted-foreground">{pacote.descricao}</p>

              <div>
                <label className="mb-1 block">Selecione a unidade</label>
                <select
                  value={selectedUnidade}
                  onChange={(e) => setSelectedUnidade(e.target.value)}
                  className="h-[52px] w-full rounded-button border border-input bg-background px-4 text-body"
                >
                  <option value="">Selecione...</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.bloco ? `Bloco ${u.bloco} - ` : ""}Unidade {u.numero}
                    </option>
                  ))}
                </select>
              </div>

              <Button onClick={handleVincular} disabled={!selectedUnidade}>
                Vincular e Notificar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPacote(null);
                  setScanning(false);
                }}
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Triagem;
