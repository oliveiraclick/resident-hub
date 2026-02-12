import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const NovoLote = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [loading, setLoading] = useState(false);

  const condominioId = roles[0]?.condominio_id;

  const handleSubmit = async () => {
    if (!condominioId) {
      toast.error("Nenhum condomínio vinculado");
      return;
    }

    const qtd = parseInt(quantidade);
    if (!qtd || qtd < 1) {
      toast.error("Informe a quantidade de itens");
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
          status: "RECEBIDO",
          quantidade_itens: qtd,
          data_recebimento: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (loteError) throw loteError;

      // Criar pacotes do lote
      const pacotes = Array.from({ length: qtd }, (_, i) => ({
        condominio_id: condominioId,
        lote_id: (lote as any).id,
        descricao: `Pacote ${i + 1} - ${descricao || "Sem descrição"}`,
        status: "RECEBIDO",
        qr_code: crypto.randomUUID(),
        unidade_id: null as any,
      }));

      const { error: pacotesError } = await supabase
        .from("pacotes")
        .insert(pacotes as any);

      if (pacotesError) throw pacotesError;

      toast.success(`Lote criado com ${qtd} pacote(s)`);
      navigate("/admin/encomendas");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar lote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Novo Lote">
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <div>
              <label className="mb-1 block">Descrição do lote</label>
              <Input
                placeholder="Ex: Correios manhã"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="h-[52px] rounded-button"
              />
            </div>
            <div>
              <label className="mb-1 block">Quantidade de pacotes</label>
              <Input
                type="number"
                min={1}
                placeholder="Ex: 5"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="h-[52px] rounded-button"
              />
            </div>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Criando..." : "Registrar Lote"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default NovoLote;
