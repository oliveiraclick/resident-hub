import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PartyPopper, X, ChevronRight } from "lucide-react";

interface PendingInvite {
  id: string;
  evento_id: string;
  evento_titulo: string;
  evento_descricao: string | null;
  evento_imagem_url: string | null;
  criador_nome: string;
}

const DISMISSED_KEY = "convites_evento_dismissed";

const EventoConviteFullscreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [visible, setVisible] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchPendingInvites();
  }, [user]);

  const fetchPendingInvites = async () => {
    const { data: participacoes, error } = await supabase
      .from("evento_participantes")
      .select("id, evento_id")
      .eq("user_id", user!.id)
      .eq("status", "pendente");

    console.log("[ConviteFullscreen] participacoes pendentes:", participacoes?.length, error?.message);

    if (!participacoes || participacoes.length === 0) return;

    // Check dismissed — only keep IDs that still exist
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]") as string[];
    const currentIds = participacoes.map((p) => p.id);
    // Clean stale dismissed IDs
    const validDismissed = dismissed.filter((d: string) => currentIds.includes(d));
    if (validDismissed.length !== dismissed.length) {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(validDismissed));
    }
    const fresh = participacoes.filter((p) => !validDismissed.includes(p.id));
    if (fresh.length === 0) return;

    // Fetch evento details
    const eventoIds = fresh.map((p) => p.evento_id);
    const { data: eventos } = await supabase
      .from("eventos_amigos")
      .select("id, titulo, descricao, imagem_url, criador_id")
      .in("id", eventoIds);

    if (!eventos || eventos.length === 0) return;

    // Fetch creator profiles
    const criadorIds = [...new Set(eventos.map((e: any) => e.criador_id))];
    const { data: profiles } = await supabase.rpc("get_evento_participant_profiles", {
      _user_ids: criadorIds,
    });
    const pMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const enriched: PendingInvite[] = fresh.map((p) => {
      const ev = eventos.find((e: any) => e.id === p.evento_id) as any;
      return {
        id: p.id,
        evento_id: p.evento_id,
        evento_titulo: ev?.titulo || "Evento",
        evento_descricao: ev?.descricao || null,
        evento_imagem_url: ev?.imagem_url || null,
        criador_nome: pMap.get(ev?.criador_id)?.nome || "Seu vizinho",
      };
    });

    setInvites(enriched);
    setVisible(true);
  };

  const handleDismiss = () => {
    const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]") as string[];
    const ids = invites.map((i) => i.id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, ...ids]));
    setVisible(false);
  };

  const handleGo = (eventoId: string) => {
    handleDismiss();
    navigate(`/morador/entre-amigos/${eventoId}`);
  };

  if (!visible || invites.length === 0) return null;

  const invite = invites[currentIdx];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in">
      {/* Background */}
      {invite.evento_imagem_url ? (
        <img
          src={invite.evento_imagem_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background: invite.evento_imagem_url
            ? "linear-gradient(to top, hsl(var(--header-bg)) 0%, hsl(var(--header-bg) / 0.7) 40%, transparent 100%)"
            : "linear-gradient(160deg, hsl(var(--header-bg)), hsl(var(--primary) / 0.9), hsl(var(--header-bg)))",
        }}
      />

      {/* Decorations */}
      <div className="absolute top-10 left-6 text-5xl animate-bounce" style={{ animationDuration: "2s" }}>🎉</div>
      <div className="absolute top-20 right-8 text-4xl animate-bounce" style={{ animationDuration: "2.5s", animationDelay: "0.3s" }}>🎊</div>
      <div className="absolute bottom-32 left-10 text-3xl animate-bounce" style={{ animationDuration: "3s", animationDelay: "0.6s" }}>🥳</div>
      <div className="absolute bottom-40 right-6 text-4xl animate-bounce" style={{ animationDuration: "2.2s", animationDelay: "0.9s" }}>🎶</div>

      {/* Close */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer"
        style={{ background: "hsl(var(--background) / 0.3)", backdropFilter: "blur(8px)" }}
      >
        <X size={20} className="text-primary-foreground" />
      </button>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
          style={{ background: "hsl(var(--primary) / 0.3)", backdropFilter: "blur(12px)" }}
        >
          <PartyPopper size={40} className="text-primary-foreground" />
        </div>

        <p className="text-primary-foreground/60 text-sm font-semibold uppercase tracking-widest mb-2">
          Você foi convidado! 🔥
        </p>

        <h1 className="text-primary-foreground font-extrabold text-3xl leading-tight mb-3 drop-shadow-lg">
          {invite.evento_titulo}
        </h1>

        <p className="text-primary-foreground/60 text-sm mb-1">
          Convite de <span className="text-primary-foreground font-semibold">{invite.criador_nome}</span>
        </p>

        {invite.evento_descricao && (
          <p className="text-primary-foreground/50 text-sm mt-2 leading-relaxed line-clamp-3">
            {invite.evento_descricao}
          </p>
        )}

        <Button
          onClick={() => handleGo(invite.evento_id)}
          className="w-full mt-8 h-14 text-base gap-2 shadow-xl"
          style={{
            background: "hsl(var(--primary))",
            fontSize: 16,
          }}
        >
          Ver convite <ChevronRight size={18} />
        </Button>

        <button
          onClick={handleDismiss}
          className="mt-3 text-primary-foreground/40 text-sm border-none bg-transparent cursor-pointer underline"
        >
          Ver depois
        </button>

        {invites.length > 1 && (
          <div className="flex gap-1.5 mt-4">
            {invites.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className="border-none cursor-pointer"
                style={{
                  width: i === currentIdx ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === currentIdx ? "hsl(var(--primary))" : "hsl(var(--primary-foreground) / 0.2)",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** Small floating badge for pending invites — use in home */
export const EventoConviteBadge = ({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) => {
  if (count <= 0) return null;
  return (
    <button
      onClick={onClick}
      className="fixed bottom-28 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl border-none cursor-pointer shadow-xl animate-bounce"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))",
        animationDuration: "2s",
        boxShadow: "0 8px 30px hsl(var(--primary) / 0.4)",
      }}
    >
      <span className="text-lg">🎉</span>
      <span className="text-primary-foreground text-sm font-bold">
        {count} convite{count > 1 ? "s" : ""}
      </span>
    </button>
  );
};

export default EventoConviteFullscreen;
