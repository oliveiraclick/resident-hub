import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import QrScanner from "@/components/QrScanner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Search, MapPin, User, Package } from "lucide-react";

const Triagem = () => {
  const { roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [scanning, setScanning] = useState(false);
  const [pacote, setPacote] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");
  const [localizacao, setLocalizacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!condominioId) return;
    supabase
      .from("unidades")
      .select("id, bloco, numero, morador_id")
      .eq("condominio_id", condominioId)
      .then(({ data }) => {
        if (data) setUnidades(data);
      });
  }, [condominioId]);

  const handleScan = async (code: string) => {
    setScanning(false);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pacotes")
        .select(`
          *,
          lotes (entregador)
        `)
        .or(`codigo_rastreio.eq.${code},qr_code.eq.${code}`)
        .eq("status", "RECEBIDO")
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error("Pacote não encontrado ou já passou pela triagem");
        return;
      }
      setPacote(data);
    } catch (err: any) {
      toast.error("Erro ao buscar pacote: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVincular = async () => {
    if (!selectedUnidade || !pacote || !localizacao) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const unidade = unidades.find((u) => u.id === selectedUnidade);

      const { error } = await supabase
        .from("pacotes")
        .update({
          unidade_id: selectedUnidade,
          morador_id: unidade?.morador_id || null,
          localizacao: localizacao,
          status: "AGUARDANDO_RETIRADA",
        } as any)
        .eq("id", pacote.id);

      if (error) throw error;

      toast.success("Pacote endereçado e vinculado com sucesso!");
      setPacote(null);
      setSelectedUnidade("");
      setLocalizacao("");
    } catch (err: any) {
      toast.error("Erro ao vincular: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnidades = unidades.filter(u => 
    `${u.bloco || ""} ${u.numero}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Endereçamento (Triagem)">
      <div className="flex flex-col gap-4 max-w-2xl mx-auto pb-20">
        {!scanning && !pacote && (
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">Bipar Pacote para Endereçar</h3>
                <p className="text-muted-foreground">Escaneie o código de rastreio para definir o morador e localizagem.</p>
              </div>
              <Button className="w-full h-14 text-lg" onClick={() => setScanning(true)}>
                Abrir Câmera / Escanear
              </Button>
              <div className="w-full flex gap-2">
                <Input 
                  placeholder="Ou digite o código de rastreio..." 
                  className="h-12"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleScan(e.currentTarget.value);
                  }}
                />
              </div>
            </CardContent>
          </Card>
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
            <Button variant="outline" className="h-12" onClick={() => setScanning(false)}>
              Cancelar
            </Button>
          </div>
        )}

        {pacote && (
          <Card className="animate-in fade-in zoom-in-95 duration-300">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">Detalhes do Pacote</h3>
                  <p className="text-sm text-muted-foreground">Cód: {pacote.codigo_rastreio}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPacote(null)}>Trocar Pacote</Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                      <User className="w-4 h-4" /> Unidade / Morador
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar unidade (ex: 101)" 
                        className="pl-10 mb-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      value={selectedUnidade}
                      onChange={(e) => setSelectedUnidade(e.target.value)}
                      className="h-[52px] w-full rounded-button border border-input bg-background px-4 text-body focus:ring-2 focus:ring-primary outline-none transition-all"
                    >
                      <option value="">Selecione a unidade...</option>
                      {filteredUnidades.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.bloco ? `Bloco ${u.bloco} - ` : ""}Unidade {u.numero}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Onde o pacote se encontra?
                    </label>
                    <Input
                      placeholder="Ex: Prateleira A1, Armário 2..."
                      value={localizacao}
                      onChange={(e) => setLocalizacao(e.target.value)}
                      className="h-[52px] rounded-button"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  className="w-full h-14 text-lg font-bold" 
                  onClick={handleVincular} 
                  disabled={loading || !selectedUnidade || !localizacao}
                >
                  {loading ? "Processando..." : "Confirmar Endereçamento"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Triagem;
