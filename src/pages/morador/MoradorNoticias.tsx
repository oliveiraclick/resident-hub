import { useEffect, useState } from "react";
import MoradorLayout from "@/components/MoradorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Newspaper, ChevronDown, ChevronUp, Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

const TODAS_CATEGORIAS = [
  { nome: "Futebol", emoji: "⚽" },
  { nome: "Fórmula 1", emoji: "🏎️" },
  { nome: "Games", emoji: "🎮" },
  { nome: "Tecnologia", emoji: "💻" },
  { nome: "Moda", emoji: "👗" },
  { nome: "Estética & Beleza", emoji: "💅" },
  { nome: "Saúde & Bem-estar", emoji: "🧘" },
  { nome: "Culinária", emoji: "🍳" },
  { nome: "Filmes & Séries", emoji: "🎬" },
  { nome: "Finanças", emoji: "💰" },
];

interface Noticia {
  id: string;
  categoria: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem_emoji: string;
  created_at: string;
}

const MoradorNoticias = () => {
  const { user } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [interesses, setInteresses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [showInteresses, setShowInteresses] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [noticiasRes, interessesRes] = await Promise.all([
      supabase
        .from("noticias")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("morador_interesses")
        .select("categoria")
        .eq("user_id", user!.id),
    ]);

    if (noticiasRes.data) setNoticias(noticiasRes.data as Noticia[]);
    if (interessesRes.data) setInteresses(interessesRes.data.map((i: any) => i.categoria));
    setLoading(false);
  };

  const toggleInteresse = async (categoria: string) => {
    if (!user) return;
    const has = interesses.includes(categoria);

    if (has) {
      await supabase
        .from("morador_interesses")
        .delete()
        .eq("user_id", user.id)
        .eq("categoria", categoria);
      setInteresses((prev) => prev.filter((c) => c !== categoria));
    } else {
      await supabase
        .from("morador_interesses")
        .insert({ user_id: user.id, categoria });
      setInteresses((prev) => [...prev, categoria]);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "agora";
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  // Filter: show interested categories first, then filter by selected
  const filtered = noticias.filter((n) => {
    if (filtroCategoria) return n.categoria === filtroCategoria;
    if (interesses.length > 0) return interesses.includes(n.categoria);
    return true;
  });

  const categoriasAtivas = [...new Set(noticias.map((n) => n.categoria))];

  return (
    <MoradorLayout title="Notícias" showBack>
      <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Feed de Notícias</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInteresses(!showInteresses)}
            className="text-xs"
          >
            {showInteresses ? "Fechar" : "Meus Interesses"}
          </Button>
        </div>

        {/* Interesses Selector */}
        {showInteresses && (
          <Card className="p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground mb-3">
              Selecione seus interesses para personalizar o feed:
            </p>
            <div className="flex flex-wrap gap-2">
              {TODAS_CATEGORIAS.map((cat) => {
                const selected = interesses.includes(cat.nome);
                return (
                  <button
                    key={cat.nome}
                    onClick={() => toggleInteresse(cat.nome)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-background text-muted-foreground border border-border hover:border-primary/50"
                    }`}
                  >
                    {selected ? (
                      <BookmarkCheck className="h-3.5 w-3.5" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5" />
                    )}
                    <span>{cat.emoji}</span>
                    <span>{cat.nome}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Category filter pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <button
            onClick={() => setFiltroCategoria(null)}
            className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all ${
              !filtroCategoria
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {interesses.length > 0 ? "Meus Interesses" : "Todos"}
          </button>
          {categoriasAtivas.map((cat) => {
            const info = TODAS_CATEGORIAS.find((c) => c.nome === cat);
            return (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(filtroCategoria === cat ? null : cat)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filtroCategoria === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {info?.emoji} {cat}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <Newspaper className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">Nenhuma notícia disponível ainda.</p>
            <p className="text-xs text-muted-foreground/60">
              Novas notícias são geradas automaticamente ao longo do dia.
            </p>
          </div>
        )}

        {/* News Cards */}
        {!loading &&
          filtered.map((noticia) => {
            const isExpanded = expandedId === noticia.id;
            return (
              <Card
                key={noticia.id}
                className="overflow-hidden transition-all hover:shadow-md"
              >
                {/* Category + Time header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <Badge variant="secondary" className="text-xs font-normal gap-1">
                    <span>{noticia.imagem_emoji}</span>
                    {noticia.categoria}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(noticia.created_at)}
                  </span>
                </div>

                {/* Content */}
                <div
                  className="px-4 pb-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : noticia.id)}
                >
                  <h3 className="font-semibold text-sm text-foreground leading-snug mb-1">
                    {noticia.titulo}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {noticia.resumo}
                  </p>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                        {noticia.conteudo}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-2">
                    <span className="text-[11px] text-primary flex items-center gap-0.5">
                      {isExpanded ? (
                        <>
                          Menos <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Ler mais <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
      </div>
    </MoradorLayout>
  );
};

export default MoradorNoticias;
