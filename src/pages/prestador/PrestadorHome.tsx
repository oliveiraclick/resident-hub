import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PrestadorLayout from "@/components/PrestadorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ShoppingBag, Wrench, DollarSign, Star,
  ArrowRight, MapPin, Building2, Gift, Image,
} from "lucide-react";
import MissingPhotoModal from "@/components/MissingPhotoModal";

const PrestadorHome = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;

  const [prestadorId, setPrestadorId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [visivel, setVisivel] = useState(false);
  const [visivelAte, setVisivelAte] = useState<string | null>(null);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);

  const [stats, setStats] = useState({
    servicos: 0,
    produtos: 0,
    avaliacoes: 0,
    mediaNotas: 0,
  });

  useEffect(() => {
    if (!user || !condominioId) return;

    const fetchData = async () => {
      const [profileRes, prestRes] = await Promise.all([
        supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle(),
        supabase.from("prestadores").select("id, visivel, visivel_ate").eq("user_id", user.id).eq("condominio_id", condominioId).limit(1).maybeSingle(),
      ]);

      if (profileRes.data?.nome) setProfileName(profileRes.data.nome);
      if (!prestRes.data) { setLoading(false); return; }

      const pid = prestRes.data.id;
      setPrestadorId(pid);

      // Check if visibility is still valid
      const isStillVisible = prestRes.data.visivel && prestRes.data.visivel_ate && new Date(prestRes.data.visivel_ate) > new Date();
      setVisivel(!!isStillVisible);
      setVisivelAte(prestRes.data.visivel_ate);

      const [servicosRes, produtosRes, avalRes, bannersRes] = await Promise.all([
        supabase.from("servicos").select("id", { count: "exact", head: true }).eq("prestador_id", pid).eq("status", "ativo"),
        supabase.from("produtos").select("id", { count: "exact", head: true }).eq("prestador_id", pid).eq("status", "ativo"),
        supabase.from("avaliacoes").select("nota").eq("avaliado_id", user.id).eq("condominio_id", condominioId),
        supabase.from("banners").select("*").eq("ativo", true).in("publico", ["prestador", "todos"]).order("ordem", { ascending: true }),
      ]);

      setBanners(bannersRes.data || []);

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

  // Auto-expire check
  useEffect(() => {
    if (!visivel || !visivelAte) return;
    const expiresAt = new Date(visivelAte).getTime();
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      setVisivel(false);
      return;
    }
    const timer = setTimeout(() => {
      setVisivel(false);
      toast.info("Sua presença no condomínio expirou (45 min).");
    }, remaining);
    return () => clearTimeout(timer);
  }, [visivel, visivelAte]);

  const toggleVisibility = useCallback(async (checked: boolean) => {
    if (!prestadorId) return;
    setTogglingVisibility(true);
    try {
      if (checked) {
        const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
        await supabase.from("prestadores").update({ visivel: true, visivel_ate: expiresAt } as any).eq("id", prestadorId);
        setVisivel(true);
        setVisivelAte(expiresAt);
        toast.success("Você está visível no condomínio por 45 minutos!");
      } else {
        await supabase.from("prestadores").update({ visivel: false, visivel_ate: null } as any).eq("id", prestadorId);
        setVisivel(false);
        setVisivelAte(null);
        toast.info("Você não está mais visível no condomínio.");
      }
    } catch {
      toast.error("Erro ao atualizar visibilidade.");
    } finally {
      setTogglingVisibility(false);
    }
  }, [prestadorId]);

  const remainingMinutes = visivelAte ? Math.max(0, Math.ceil((new Date(visivelAte).getTime() - Date.now()) / 60000)) : 0;

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setBannerIdx((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);


  return (
    <PrestadorLayout>
      <MissingPhotoModal />
      <div className="flex flex-col gap-5">
        {/* Greeting */}
        <div>
          <p className="text-[13px] text-muted-foreground">Bem-vindo,</p>
          <h1 className="text-[20px] font-bold text-foreground">{profileName || "Prestador"} 👋</h1>
        </div>

        {/* Banner para Prestadores */}
        {banners.length > 0 && (
          <div
            onClick={() => { const b = banners[bannerIdx]; if (b?.whatsapp) { window.open(`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`, "_blank"); } else if (b?.link) { window.open(b.link, "_blank"); } }}
            className="rounded-[18px] overflow-hidden relative cursor-pointer"
            style={{ height: 140, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
          >
            {banners[bannerIdx]?.imagem_url ? (
              <img src={banners[bannerIdx].imagem_url} alt={banners[bannerIdx].titulo} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
                <p className="text-white font-bold text-lg px-6 text-center">{banners[bannerIdx]?.titulo}</p>
              </div>
            )}
            {banners.length > 1 && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
                {banners.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setBannerIdx(i); }}
                    className="border-none cursor-pointer transition-all duration-200"
                    style={{
                      width: i === bannerIdx ? 20 : 7, height: 7, borderRadius: 4,
                      background: i === bannerIdx ? "hsl(var(--primary))" : "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

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
            {/* Presence Toggle */}
            <Card className={visivel ? "border-primary/30 bg-primary/5" : ""}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${visivel ? "bg-primary/20" : "bg-muted"}`}>
                  <MapPin size={20} className={visivel ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-foreground">Estou no condomínio</p>
                  <p className="text-[11px] text-muted-foreground">
                    {visivel ? `Visível por mais ${remainingMinutes} min` : "Ative para moradores te encontrarem"}
                  </p>
                </div>
                <Switch
                  checked={visivel}
                  onCheckedChange={toggleVisibility}
                  disabled={togglingVisibility}
                />
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Meu Negócio</p>
              <div className="grid grid-cols-2 gap-3">
                <Card className="cursor-pointer active:scale-[0.97] transition-transform" onClick={() => navigate("/prestador/servicos")}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Wrench size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[20px] font-bold text-foreground leading-tight">{stats.servicos}</p>
                      <p className="text-[12px] text-muted-foreground">Serviços ativos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer active:scale-[0.97] transition-transform" onClick={() => navigate("/prestador/produtos")}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-11 w-11 rounded-2xl bg-accent flex items-center justify-center">
                      <ShoppingBag size={20} className="text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-[20px] font-bold text-foreground leading-tight">{stats.produtos}</p>
                      <p className="text-[12px] text-muted-foreground">Produtos ativos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-2">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="h-11 w-11 rounded-2xl bg-warning/10 flex items-center justify-center">
                      <Star size={20} className="text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[20px] font-bold text-foreground leading-tight">
                        {stats.mediaNotas > 0 ? `${stats.mediaNotas} ★` : "—"}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {stats.avaliacoes} {stats.avaliacoes === 1 ? "avaliação" : "avaliações"} recebidas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Banner promo CTA */}
            <Card
              className="cursor-pointer active:scale-[0.97] transition-transform border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden"
              onClick={() => navigate("/prestador/banners")}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Image size={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-foreground">📣 Anuncie no App!</p>
                  <p className="text-[11px] text-muted-foreground">Seu banner para todos os moradores do condomínio por 15 dias</p>
                </div>
                <ArrowRight size={18} className="text-primary flex-shrink-0" />
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Acesso Rápido</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Gerenciar Serviços", icon: Wrench, path: "/prestador/servicos" },
                  { label: "Gerenciar Produtos", icon: ShoppingBag, path: "/prestador/produtos" },
                  { label: "📋 Cotações", icon: Star, path: "/prestador/cotacoes" },
                  { label: "Financeiro", icon: DollarSign, path: "/prestador/financeiro" },
                  { label: "Condomínios", icon: Building2, path: "/prestador/condominios" },
                  { label: "Indicações", icon: Gift, path: "/prestador/indicacoes" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 active:scale-[0.98] transition-transform text-left"
                  >
                    <action.icon size={18} className="text-primary" />
                    <span className="text-[14px] font-medium text-foreground flex-1">{action.label}</span>
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Atalho discreto para o manual */}
        <button
          onClick={() => navigate("/prestador/manual")}
          className="w-full text-center text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-2 mt-2"
        >
          Precisa de ajuda? Toque aqui
        </button>
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorHome;
