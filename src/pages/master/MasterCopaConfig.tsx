import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trophy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MasterCopaConfig = () => {
  const [enabled, setEnabled] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("app_configs" as any)
        .select("*")
        .eq("key", "theme_world_cup")
        .maybeSingle();

      if (data) {
        setEnabled((data as any).enabled);
        if ((data as any).start_at) {
          setStartAt(new Date((data as any).start_at).toISOString().slice(0, 16));
        }
        if ((data as any).end_at) {
          setEndAt(new Date((data as any).end_at).toISOString().slice(0, 16));
        }
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    const { error } = await supabase
      .from("app_configs" as any)
      .upsert({
        key: "theme_world_cup",
        enabled,
        start_at: startAt ? new Date(startAt).toISOString() : null,
        end_at: endAt ? new Date(endAt).toISOString() : null,
      }, { onConflict: 'key' });

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Configuração salva",
        description: "As alterações do tema Copa do Mundo foram aplicadas.",
      });
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
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="start">Início da Versão</Label>
              <Input
                id="start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground uppercase font-black">
                Deixe em branco para começar imediatamente ao ativar
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end">Fim da Versão</Label>
              <Input
                id="end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground uppercase font-black">
                Deixe em branco para não desligar automaticamente
              </p>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button className="w-full gap-2" onClick={handleSave}>
              <Save size={18} />
              Salvar Configuração
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
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
              <li>• Cores baseadas no Brasil: Verde, Amarelo e Azul.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </MasterLayout>
  );
};

export default MasterCopaConfig;
