import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Wrench, DollarSign, Star } from "lucide-react";

const PrestadorHome = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [stats, setStats] = useState({ servicos: 0, produtos: 0, avaliacoes: 0, mediaNotas: 0 });
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (!user || !condominioId) return;

    const fetchData = async () => {
      // Get profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.nome) setProfileName(profile.nome);

      // Get prestador record
      const { data: prest } = await supabase
        .from("prestadores")
        .select("id")
        .eq("user_id", user.id)
        .eq("condominio_id", condominioId)
        .maybeSingle();

      if (!prest) {
        setLoading(false);
        return;
      }

      setPrestadorId(prest.id);

      // Fetch counts in parallel
      const [servicosRes, produtosRes, avalRes] = await Promise.all([
        supabase.from("servicos").select("id", { count: "exact", head: true }).eq("prestador_id", prest.id).eq("status", "ativo"),
        supabase.from("produtos").select("id", { count: "exact", head: true }).eq("prestador_id", prest.id).eq("status", "ativo"),
        supabase.from("avaliacoes").select("nota").eq("avaliado_id", user.id).eq("condominio_id", condominioId),
      ]);

      const notas = avalRes.data || [];
      const media = notas.length > 0 ? notas.reduce((s, a) => s + a.nota, 0) / notas.length : 0;

      setStats({
        servicos: servicosRes.count || 0,
        produtos: produtosRes.count || 0,
        avaliacoes: notas.length,
        mediaNotas: Math.round(media * 10) / 10,
      });
      setLoading(false);
    };

    fetchData();
  }, [user, condominioId]);

  const cards = [
    { label: "Serviços ativos", value: stats.servicos, icon: Wrench, path: "/prestador/servicos", color: "bg-primary/10 text-primary" },
    { label: "Produtos ativos", value: stats.produtos, icon: ShoppingBag, path: "/prestador/produtos", color: "bg-accent/50 text-accent-foreground" },
    { label: "Avaliações", value: `${stats.mediaNotas} ★ (${stats.avaliacoes})`, icon: Star, path: "#", color: "bg-warning/10 text-warning" },
  ];

  return (
    <PrestadorLayout>
      <div className="flex flex-col gap-6">
        {/* Greeting */}
        <div>
          <p className="text-[13px] text-muted-foreground">Bem-vindo,</p>
          <h1 className="text-[20px] font-bold text-foreground">{profileName || "Prestador"} 👋</h1>
        </div>

        {loading ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
        ) : !prestadorId ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-[14px] text-muted-foreground">
                Seu cadastro de prestador não foi encontrado para este condomínio.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              {cards.map((c) => (
                <Card
                  key={c.label}
                  className={`cursor-pointer active:scale-[0.97] transition-transform ${c.path === "#" ? "col-span-2" : ""}`}
                  onClick={() => c.path !== "#" && navigate(c.path)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${c.color}`}>
                      <c.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[20px] font-bold text-foreground leading-tight">
                        {c.value}
                      </p>
                      <p className="text-[12px] text-muted-foreground">{c.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Acesso rápido</p>
              {[
                { label: "Gerenciar Produtos", icon: ShoppingBag, path: "/prestador/produtos" },
                { label: "Gerenciar Serviços", icon: Wrench, path: "/prestador/servicos" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 active:scale-[0.98] transition-transform text-left"
                >
                  <action.icon size={18} className="text-primary" />
                  <span className="text-[14px] font-medium text-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorHome;
