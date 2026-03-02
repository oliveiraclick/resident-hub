import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, Save, Image, Hash } from "lucide-react";

const MasterBannerPrecos = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [precoId, setPrecoId] = useState<string | null>(null);
  const [valorQuinzena, setValorQuinzena] = useState("");
  const [valorCriacao, setValorCriacao] = useState("");
  const [limite, setLimite] = useState("");

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
