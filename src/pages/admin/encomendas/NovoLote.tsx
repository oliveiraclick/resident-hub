import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Package, Trash2, Camera } from "lucide-react";
import QrScanner from "@/components/QrScanner";

const NovoLote = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const [entregador, setEntregador] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const condominioId = roles[0]?.condominio_id;

  const handleAddCode = (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return;
    if (scannedCodes.includes(trimmedCode)) {
      toast.error("Este código já foi bipado");
      return;
    }
    setScannedCodes([...scannedCodes, trimmedCode]);
    toast.success("Pacote bipado!");
    if (inputRef.current) inputRef.current.focus();
  };

  const handleRemoveCode = (index: number) => {
    setScannedCodes(scannedCodes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!condominioId) {
      toast.error("Nenhum condomínio vinculado");
      return;
    }

    if (!entregador) {
      toast.error("Informe o nome do entregador");
      return;
    }

    if (scannedCodes.length === 0) {
      toast.error("Bipe ao menos um pacote");
      return;
    }

    setLoading(true);
    try {
      // Criar lote
      const { data: lote, error: loteError } = await supabase
        .from("lotes")
        .insert({
          condominio_id: condominioId,
          descricao: descricao || `Lote - ${new Date().toLocaleDateString("pt-BR")}`,
          entregador,
          status: "RECEBIDO",
          quantidade_itens: scannedCodes.length,
          data_recebimento: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (loteError) throw loteError;

      // Criar pacotes do lote
      const pacotes = scannedCodes.map((code, i) => ({
        condominio_id: condominioId,
        lote_id: (lote as any).id,
        descricao: `Pacote ${i + 1} - ${entregador}`,
        codigo_rastreio: code,
        status: "RECEBIDO",
        qr_code: crypto.randomUUID(),
      }));

      const { error: pacotesError } = await supabase
        .from("pacotes")
        .insert(pacotes as any);

      if (pacotesError) throw pacotesError;

      toast.success(`Lote criado com ${scannedCodes.length} pacote(s)`);
      navigate("/admin/encomendas");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar lote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Novo Recebimento (Lote)">
      <div className="flex flex-col gap-4 max-w-2xl mx-auto pb-20">
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome do Entregador</label>
                <Input
                  placeholder="Ex: João da Silva (Correios)"
                  value={entregador}
                  onChange={(e) => setEntregador(e.target.value)}
                  className="h-[52px] rounded-button"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Descrição Opcional</label>
                <Input
                  placeholder="Ex: Remessa Manhã"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="h-[52px] rounded-button"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                Pacotes Bipados ({scannedCodes.length})
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setScanning(!scanning)}
              >
                <Camera className="w-4 h-4" />
                {scanning ? "Fechar Câmera" : "Usar Câmera"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-4">
            {scanning && (
              <div className="mb-4">
                <QrScanner
                  onScan={(code) => {
                    handleAddCode(code);
                    setScanning(false);
                  }}
                  onError={(err) => toast.error(err)}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Bipe o código ou digite aqui..."
                className="h-[52px] rounded-button"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCode(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <Button 
                variant="secondary" 
                className="h-[52px] px-6"
                onClick={() => {
                  if (inputRef.current) {
                    handleAddCode(inputRef.current.value);
                    inputRef.current.value = "";
                  }
                }}
              >
                Bipar
              </Button>
            </div>

            <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-2">
              {scannedCodes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Nenhum pacote bipado ainda.
                </p>
              ) : (
                [...scannedCodes].reverse().map((code, index) => (
                  <div key={scannedCodes.length - 1 - index} className="flex items-center justify-between p-3 bg-muted rounded-lg animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary w-6">{scannedCodes.length - index}</span>
                      <span className="font-mono text-sm">{code}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveCode(scannedCodes.length - 1 - index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-6 left-0 right-0 px-4 md:static md:px-0">
          <Button 
            className="w-full h-14 text-lg font-bold shadow-lg md:shadow-none" 
            onClick={handleSubmit} 
            disabled={loading || scannedCodes.length === 0}
          >
            {loading ? "Finalizando Recebimento..." : "Finalizar Recebimento"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NovoLote;

