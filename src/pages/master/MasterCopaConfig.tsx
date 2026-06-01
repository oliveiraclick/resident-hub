import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Save, QrCode, Target, Crown, Goal, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BetTypeKey = "placar" | "artilheiro" | "campeao" | "artilheiro_brasil";

interface BetConfig {
  pix_key: string;
  pix_name: string;
  valor: number;
}

const BET_TYPES: { key: BetTypeKey; label: string; icon: any; description: string }[] = [
  { key: "placar", label: "Placar do Jogo", icon: Target, description: "Aposta no resultado exato de cada partida" },
  { key: "artilheiro", label: "Artilheiro da Partida", icon: Goal, description: "Quem fará o primeiro gol em cada jogo" },
  { key: "campeao", label: "Campeão da Copa", icon: Crown, description: "Aposta única na seleção campeã" },
  { key: "artilheiro_brasil", label: "Artilheiro do Brasil", icon: Flag, description: "Quem será o maior goleador da Seleção Brasileira" },
];

const DEFAULT_BET_CONFIG: BetConfig = { pix_key: "", pix_name: "", valor: 10 };

const MasterCopaConfig = () => {
  const [enabled, setEnabled] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [betConfigs, setBetConfigs] = useState<Record<BetTypeKey, BetConfig>>({
    placar: { ...DEFAULT_BET_CONFIG },
    artilheiro: { ...DEFAULT_BET_CONFIG },
    campeao: { ...DEFAULT_BET_CONFIG },
    artilheiro_brasil: { ...DEFAULT_BET_CONFIG },
  });
  const [activeBetTab, setActiveBetTab] = useState<BetTypeKey>("placar");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from("app_configs" as any)
        .select("*")
        .eq("key", "theme_world_cup")
        .maybeSingle();

      if (data) {
        const d = data as any;
        setEnabled(d.enabled);
        if (d.start_at) setStartAt(new Date(d.start_at).toISOString().slice(0, 16));
        if (d.end_at) setEndAt(new Date(d.end_at).toISOString().slice(0, 16));

        // Load per-type configs from JSONB value, with fallback to legacy flat columns
        const fallback: BetConfig = {
          pix_key: d.pix_key || "",
          pix_name: d.pix_name || "",
          valor: Number(d.valor_aposta) || 10,
        };
        const stored = (d.value && typeof d.value === "object" && d.value.bets) || {};
        setBetConfigs({
          placar: { ...fallback, ...(stored.placar || {}) },
          artilheiro: { ...fallback, ...(stored.artilheiro || {}) },
          campeao: { ...fallback, ...(stored.campeao || {}) },
          artilheiro_brasil: { ...fallback, ...(stored.artilheiro_brasil || {}) },
        });
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const updateBetField = (type: BetTypeKey, field: keyof BetConfig, value: string | number) => {
    setBetConfigs((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleSave = async () => {
    // Save first config to legacy columns as default fallback
    const defaultConfig = betConfigs.placar;

    const { error } = await supabase
      .from("app_configs" as any)
      .upsert(
        {
          key: "theme_world_cup",
          enabled,
          pix_key: defaultConfig.pix_key,
          pix_name: defaultConfig.pix_name,
          valor_aposta: defaultConfig.valor || 10,
          value: { bets: betConfigs },
          start_at: startAt ? new Date(startAt).toISOString() : null,
          end_at: endAt ? new Date(endAt).toISOString() : null,
        },
        { onConflict: "key" }
      );

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configuração salva", description: "As alterações do tema Copa do Mundo foram aplicadas." });
    }
  };

  if (loading) return null;

  return (
    <MasterLayout title="Tema Copa do Mundo">
      <Card className="rounded-[var(--radius-card)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="text-warning" size={24} />
            Configuração da Versão Copa
          </CardTitle>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start">Início da Versão</Label>
              <Input id="start" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">Fim da Versão</Label>
              <Input id="end" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>

          {/* PIX por tipo de aposta */}
          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-primary" />
              <h3 className="text-sm font-bold">Pagamento (PIX) por Tipo de Aposta</h3>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Configure chave PIX, favorecido e valor individualmente para cada modalidade.
            </p>

            <Tabs value={activeBetTab} onValueChange={(v) => setActiveBetTab(v as BetTypeKey)}>
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 bg-muted/50 p-1">
                {BET_TYPES.map((bt) => {
                  const Icon = bt.icon;
                  return (
                    <TabsTrigger
                      key={bt.key}
                      value={bt.key}
                      className="flex flex-col items-center gap-1 py-2 text-[10px] font-bold uppercase data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Icon size={14} />
                      <span className="leading-tight text-center">{bt.label.split(" ")[0]}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {BET_TYPES.map((bt) => {
                const cfg = betConfigs[bt.key];
                const Icon = bt.icon;
                return (
                  <TabsContent key={bt.key} value={bt.key} className="mt-4">
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-black">{bt.label}</p>
                          <p className="text-[10px] text-muted-foreground">{bt.description}</p>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`pixKey-${bt.key}`}>Chave PIX</Label>
                        <Input
                          id={`pixKey-${bt.key}`}
                          placeholder="E-mail, CPF, Celular ou Chave Aleatória"
                          value={cfg.pix_key}
                          onChange={(e) => updateBetField(bt.key, "pix_key", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`pixName-${bt.key}`}>Nome do Favorecido</Label>
                        <Input
                          id={`pixName-${bt.key}`}
                          placeholder="Nome que aparece no banco"
                          value={cfg.pix_name}
                          onChange={(e) => updateBetField(bt.key, "pix_name", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`valor-${bt.key}`}>Valor da Aposta (R$)</Label>
                        <Input
                          id={`valor-${bt.key}`}
                          type="number"
                          step="0.01"
                          placeholder="10.00"
                          value={cfg.valor}
                          onChange={(e) => updateBetField(bt.key, "valor", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-2">
            <Button className="w-full sm:flex-1 gap-2" onClick={handleSave}>
              <Save size={18} />
              Salvar Configuração
            </Button>
            <Button
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => {
                document.body.classList.toggle("theme-brasil");
                toast({ title: "Preview visual ativado apenas localmente" });
              }}
            >
              Testar Visual
            </Button>
          </div>

          <div className="bg-muted/50 p-4 rounded-xl space-y-2">
            <h4 className="text-sm font-bold">Regras de Ativação:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• O switch principal deve estar ligado.</li>
              <li>• Se houver data de início, o tema só aparece após esse horário.</li>
              <li>• Se houver data de término, o tema desaparece após esse horário.</li>
              <li>• Cada modalidade pode ter chave PIX e valor próprios.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </MasterLayout>
  );
};

export default MasterCopaConfig;
