import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, Save, Image, Hash, QrCode } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MasterBannerPrecos = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [precoId, setPrecoId] = useState<string | null>(null);
  const [valorQuinzena, setValorQuinzena] = useState("");
  const [valorCriacao, setValorCriacao] = useState("");
  const [limite, setLimite] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [tipoChavePix, setTipoChavePix] = useState("cpf");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("banner_precos")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) {
        setPrecoId(data.id);
        setValorQuinzena(String(data.valor_quinzena));
        setValorCriacao(String(data.valor_criacao_arte));
        setLimite(String(data.limite_por_condominio));
        setChavePix(data.chave_pix || "");
        setTipoChavePix(data.tipo_chave_pix || "cpf");
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!precoId) return;
    setSaving(true);
    const { error } = await supabase
      .from("banner_precos")
      .update({
        valor_quinzena: parseFloat(valorQuinzena) || 0,
        valor_criacao_arte: parseFloat(valorCriacao) || 0,
        limite_por_condominio: parseInt(limite) || 6,
        chave_pix: chavePix || null,
        tipo_chave_pix: tipoChavePix,
        updated_at: new Date().toISOString(),
      })
      .eq("id", precoId);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Preços atualizados!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <MasterLayout title="Preços de Banners">
        <p className="text-muted-foreground">Carregando...</p>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout title="Preços de Banners">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              Configuração de Preços
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <DollarSign size={14} /> Valor por Quinzena (15 dias)
              </label>
              <Input
                type="number"
                placeholder="97.00"
                value={valorQuinzena}
                onChange={(e) => setValorQuinzena(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Valor atual: R$ {formatBRL(parseFloat(valorQuinzena) || 0)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <Image size={14} /> Valor para Criação de Arte
              </label>
              <Input
                type="number"
                placeholder="97.00"
                value={valorCriacao}
                onChange={(e) => setValorCriacao(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Cobrado quando o prestador solicita criação da arte
              </p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <Hash size={14} /> Limite por Condomínio
              </label>
              <Input
                type="number"
                placeholder="6"
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Máximo de banners ativos simultaneamente
              </p>
            </div>

            <div className="border-t border-border pt-4 mt-2">
              <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                <QrCode size={16} className="text-primary" /> Dados PIX para Pagamento
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo da chave</label>
                  <Select value={tipoChavePix} onValueChange={setTipoChavePix}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="aleatoria">Chave aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Chave PIX</label>
                  <Input
                    placeholder="Digite sua chave PIX"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Será exibida para o prestador no momento da solicitação
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar Preços"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MasterLayout>
  );
};

export default MasterBannerPrecos;
