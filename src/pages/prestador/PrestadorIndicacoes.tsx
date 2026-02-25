import { useEffect, useState } from "react";
import PrestadorLayout from "@/components/PrestadorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Users, Copy, Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Indicacao {
  id: string;
  indicado_id: string;
  status: string;
  created_at: string;
  indicado_nome?: string;
}

const PrestadorIndicacoes = () => {
  const { user } = useAuth();
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const codigoIndicacao = user?.id || "";
  const totalConfirmadas = indicacoes.filter((i) => i.status === "confirmada").length;
  const mesesGratis = Math.floor(totalConfirmadas / 5);
  const faltamPara = 5 - (totalConfirmadas % 5);

  useEffect(() => {
    if (!user) return;
    const fetchIndicacoes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("indicacoes")
        .select("id, indicado_id, status, created_at")
        .eq("indicador_id", user.id)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const indicadoIds = data.map((i) => i.indicado_id);
        const { data: profiles } = await supabase.rpc("get_prestador_profiles", { _user_ids: indicadoIds });
        const merged = data.map((i) => {
          const profile = (profiles || []).find((p: any) => p.user_id === i.indicado_id);
          return { ...i, indicado_nome: profile?.nome || "Prestador" };
        });
        setIndicacoes(merged);
      } else {
        setIndicacoes([]);
      }
      setLoading(false);
    };
    fetchIndicacoes();
  }, [user]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codigoIndicacao);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <PrestadorLayout title="Indicações" showBack>
      <div className="flex flex-col gap-5">
        {/* Hero card */}
        <div
          className="rounded-[20px] p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))",
            boxShadow: "0 8px 24px hsla(var(--primary), 0.25)",
          }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/[0.08]" />
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center" style={{ backdropFilter: "blur(8px)" }}>
              <Gift size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Indique e Ganhe</h2>
              <p className="text-white/70 text-xs">A cada 5 indicações = 1 mês grátis</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/15 rounded-xl p-3 text-center" style={{ backdropFilter: "blur(4px)" }}>
              <p className="text-white font-extrabold text-xl">{totalConfirmadas}</p>
              <p className="text-white/60 text-[10px] font-medium">Indicações</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center" style={{ backdropFilter: "blur(4px)" }}>
              <p className="text-white font-extrabold text-xl">{mesesGratis}</p>
              <p className="text-white/60 text-[10px] font-medium">Meses grátis</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center" style={{ backdropFilter: "blur(4px)" }}>
              <p className="text-white font-extrabold text-xl">{faltamPara}</p>
              <p className="text-white/60 text-[10px] font-medium">Faltam p/ próx.</p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: i < (totalConfirmadas % 5) ? 24 : 10,
                  background: i < (totalConfirmadas % 5) ? "white" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Código */}
        <div className="rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <p className="text-[12px] font-semibold text-muted-foreground mb-2">Seu código de indicação</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-xl px-4 py-3 font-mono text-[12px] text-foreground truncate">
              {codigoIndicacao}
            </div>
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1 rounded-xl h-10">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Compartilhe este código com outros prestadores. Quando eles se cadastrarem informando seu código, conta como indicação!
          </p>
        </div>

        {/* Lista */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-sm bg-primary" />
            <Users size={16} className="text-primary" />
            <h3 className="text-[16px] font-bold text-foreground">Suas indicações</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : indicacoes.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma indicação ainda. Compartilhe seu código!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {indicacoes.map((ind) => (
                <div key={ind.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Star size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{ind.indicado_nome}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(ind.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                    ✓ Confirmada
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorIndicacoes;
