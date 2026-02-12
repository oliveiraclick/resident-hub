import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, AlertTriangle, User, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ProdutoDetail {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
  status: string;
  created_at: string;
  prestador_id: string;
  prestador_user_id?: string;
  profile?: {
    nome: string;
    telefone: string | null;
    avatar_url: string | null;
  };
}

const MoradorProdutoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ProdutoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;

    const fetch = async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, titulo, descricao, preco, status, created_at, prestador_id")
        .eq("id", id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      // Get prestador to find user_id
      const { data: prestador } = await supabase
        .from("prestadores")
        .select("user_id")
        .eq("id", data.prestador_id)
        .single();

      let profile: ProdutoDetail["profile"] | undefined;

      if (prestador?.user_id) {
        // Use RPC to get prestador profile safely
        const { data: profiles } = await supabase.rpc("get_prestador_profiles", {
          _user_ids: [prestador.user_id],
        });
        if (profiles && profiles.length > 0) {
          profile = {
            nome: profiles[0].nome,
            telefone: profiles[0].telefone,
            avatar_url: profiles[0].avatar_url,
          };
        }
      }

      setItem({
        ...data,
        prestador_user_id: prestador?.user_id,
        profile,
      });
      setLoading(false);
    };

    fetch();
  }, [id]);

  const openWhatsApp = () => {
    if (!item?.profile?.telefone) return;
    const phone = item.profile.telefone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
    const text = encodeURIComponent(`Olá, tenho interesse no produto ${item.titulo}`);
    window.open(`https://wa.me/${fullPhone}?text=${text}`, "_blank");
  };

  const isActive = item?.status === "ativo";

  if (loading) {
    return (
      <div className="min-h-screen bg-background mx-auto max-w-[480px] overflow-x-hidden">
        <div className="p-5 space-y-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-[220px] w-full rounded-card" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background mx-auto max-w-[480px] overflow-x-hidden flex flex-col items-center justify-center px-5">
        <p className="text-muted-foreground text-[14px]">Produto não encontrado.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft size={16} className="mr-1" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mx-auto max-w-[480px] overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card px-5 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-[15px] font-semibold text-foreground truncate">E-shop</h1>
      </header>

      <main className="px-5 pt-5 pb-[100px]">
        {/* Inactive warning */}
        {!isActive && (
          <div className="flex items-center gap-2 rounded-card bg-destructive/10 px-4 py-3 mb-4">
            <AlertTriangle size={18} className="text-destructive flex-shrink-0" />
            <p className="text-[13px] text-destructive font-medium">Este anúncio não está mais disponível</p>
          </div>
        )}

        {/* Image placeholder */}
        <div className="w-full aspect-video rounded-card bg-muted flex items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-[40px]">🛍️</span>
            <span className="text-[12px]">Sem imagem</span>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-4 flex items-center gap-2">
          <Badge className="gap-1 text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary border-0">
            <Store size={12} />
            Loja
          </Badge>
          <Badge variant={isActive ? "secondary" : "destructive"} className="text-[10px] font-semibold uppercase tracking-wide">
            {isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {/* Title */}
        <h2 className="mt-2 text-[22px] font-semibold text-foreground leading-tight">{item.titulo}</h2>

        {/* Price */}
        {item.preco != null && (
          <p className="mt-2 text-[24px] font-bold text-primary">
            R$ {Number(item.preco).toFixed(2).replace(".", ",")}
          </p>
        )}

        {/* Description */}
        {item.descricao && (
          <div className="mt-5">
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Descrição</h3>
            <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{item.descricao}</p>
          </div>
        )}

        {/* Seller card */}
        {item.profile && (
          <div className="mt-6 rounded-card bg-card border p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.profile.avatar_url ? (
                <img src={item.profile.avatar_url} alt={item.profile.nome} className="h-full w-full object-cover" />
              ) : (
                <User size={20} className="text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-foreground truncate">{item.profile.nome}</p>
              <p className="text-[12px] text-muted-foreground">Prestador</p>
            </div>
          </div>
        )}
      </main>

      {/* Fixed WhatsApp button */}
      {isActive && item.profile?.telefone && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-20 bg-card px-5 py-4" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <Button onClick={openWhatsApp} className="w-full h-[52px] rounded-2xl gap-2 text-[15px] font-semibold">
            <MessageCircle size={20} />
            Falar no WhatsApp
          </Button>
        </div>
      )}
    </div>
  );
};

export default MoradorProdutoDetalhe;
