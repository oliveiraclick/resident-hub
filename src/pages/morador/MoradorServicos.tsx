import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Search, MessageCircle, Star, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";

import coverJardinagem from "@/assets/cover-jardinagem.jpg";
import coverFaxina from "@/assets/cover-faxina.jpg";
import coverEletricista from "@/assets/cover-eletricista.jpg";
import coverEncanador from "@/assets/cover-encanador.jpg";
import coverPintura from "@/assets/cover-pintura.jpg";
import coverReparos from "@/assets/cover-reparos.jpg";
import coverLimpeza from "@/assets/cover-limpeza.jpg";

const coverImages: Record<string, string> = {
  Jardinagem: coverJardinagem,
  Faxina: coverFaxina,
  Eletricista: coverEletricista,
  Encanador: coverEncanador,
  Pintura: coverPintura,
  Reparos: coverReparos,
  Limpeza: coverLimpeza,
};

interface Categoria {
  nome: string;
  count: number;
}

interface PrestadorCompleto {
  id: string;
  especialidade: string;
  descricao: string | null;
  user_id: string;
  nome: string;
  telefone: string | null;
  avatar_url: string | null;
  servicos: {
    id: string;
    titulo: string;
    descricao: string | null;
    preco: number | null;
  }[];
}

const MoradorServicos = () => {
  const { roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [allPrestadores, setAllPrestadores] = useState<any[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [prestadoresCompletos, setPrestadoresCompletos] = useState<PrestadorCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all prestadores for categories
  useEffect(() => {
    if (!condominioId) return;

    const fetchPrestadores = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("prestadores")
        .select("id, especialidade, descricao, user_id")
        .eq("condominio_id", condominioId);

      if (data) {
        setAllPrestadores(data);
        const map: Record<string, number> = {};
        data.forEach((p) => {
          map[p.especialidade] = (map[p.especialidade] || 0) + 1;
        });
        setCategorias(
          Object.entries(map).map(([nome, count]) => ({ nome, count }))
        );
      }
      setLoading(false);
    };

    fetchPrestadores();
  }, [condominioId]);

  // Auto-select category if exact match from URL param
  useEffect(() => {
    if (queryFromUrl && categorias.length > 0) {
      const exactMatch = categorias.find(
        (c) => c.nome.toLowerCase() === queryFromUrl.toLowerCase()
      );
      if (exactMatch) {
        setSelectedCategoria(exactMatch.nome);
      } else {
        setSearchTerm(queryFromUrl);
      }
      setSearchParams({}, { replace: true });
    }
  }, [queryFromUrl, categorias]);

  // Fetch full prestador details when category is selected
  useEffect(() => {
    if (!condominioId || !selectedCategoria) return;

    const fetchPrestadoresCompletos = async () => {
      setLoadingDetail(true);

      const prestadoresFiltrados = allPrestadores.filter(
        (p) => p.especialidade === selectedCategoria
      );

      if (!prestadoresFiltrados.length) {
        setPrestadoresCompletos([]);
        setLoadingDetail(false);
        return;
      }

      // Fetch profiles for these prestadores (secure function - only prestador data)
      const userIds = prestadoresFiltrados.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .rpc("get_prestador_profiles", { _user_ids: userIds }) as { data: { user_id: string; nome: string; avatar_url: string | null; telefone: string | null }[] | null };

      // Fetch servicos for these prestadores
      const prestadorIds = prestadoresFiltrados.map((p) => p.id);
      const { data: servicos } = await supabase
        .from("servicos")
        .select("id, titulo, descricao, preco, prestador_id")
        .eq("condominio_id", condominioId)
        .in("prestador_id", prestadorIds)
        .eq("status", "ativo");

      const result: PrestadorCompleto[] = prestadoresFiltrados.map((p) => {
        const profile = profiles?.find((pr) => pr.user_id === p.user_id);
        const prestadorServicos = servicos?.filter((s) => s.prestador_id === p.id) || [];
        return {
          id: p.id,
          especialidade: p.especialidade,
          descricao: p.descricao,
          user_id: p.user_id,
          nome: profile?.nome || "Prestador",
          telefone: profile?.telefone || null,
          avatar_url: profile?.avatar_url || null,
          servicos: prestadorServicos,
        };
      });

      setPrestadoresCompletos(result);
      setLoadingDetail(false);
    };

    fetchPrestadoresCompletos();
  }, [condominioId, selectedCategoria, allPrestadores]);

  const openWhatsApp = (telefone: string, nome: string, especialidade: string) => {
    const cleaned = telefone.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const msg = encodeURIComponent(
      `Olá ${nome}! Vi seu perfil de ${especialidade} no app do condomínio e gostaria de saber mais sobre seus serviços.`
    );
    window.open(`https://wa.me/${number}?text=${msg}`, "_blank");
  };

  // Category detail view
  if (selectedCategoria) {
    return (
      <MoradorLayout title={selectedCategoria}>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              setSelectedCategoria(null);
              setPrestadoresCompletos([]);
            }}
            className="flex items-center gap-1.5 text-[13px] font-medium text-primary w-fit"
          >
            <ArrowLeft size={16} />
            Voltar às categorias
          </button>

          {loadingDetail ? (
            <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
          ) : prestadoresCompletos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Wrench size={40} className="text-muted-foreground" />
              <p className="text-[14px] text-muted-foreground">
                Nenhum prestador de {selectedCategoria} disponível
              </p>
            </div>
          ) : (
            prestadoresCompletos.map((prestador) => (
              <Card key={prestador.id} className="overflow-hidden">
                {/* Cover image */}
                <div className="relative h-[120px] overflow-hidden">
                  <img
                    src={coverImages[prestador.especialidade] || coverImages.Jardinagem}
                    alt={prestador.especialidade}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                </div>

                <CardContent className="p-4 -mt-8 relative flex flex-col gap-3">
                  {/* Avatar overlapping cover */}
                  <div className="flex items-end gap-3">
                    <div className="h-14 w-14 rounded-full bg-card border-[3px] border-card flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                      {prestador.avatar_url ? (
                        <img
                          src={prestador.avatar_url}
                          alt={prestador.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={24} className="text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-0.5">
                      <p className="text-[15px] font-semibold text-foreground truncate">
                        {prestador.nome}
                      </p>
                      <p className="text-[12px] text-primary font-medium">
                        {prestador.especialidade}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {prestador.descricao && (
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {prestador.descricao}
                    </p>
                  )}

                  {/* Serviços oferecidos */}
                  {prestador.servicos.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Serviços oferecidos
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {prestador.servicos.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-foreground truncate">
                                {s.titulo}
                              </p>
                              {s.descricao && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {s.descricao}
                                </p>
                              )}
                            </div>
                            {s.preco != null && (
                              <span className="text-[13px] font-bold text-primary ml-2 flex-shrink-0">
                                R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WhatsApp button */}
                  {prestador.telefone ? (
                    <Button
                      onClick={() =>
                        openWhatsApp(prestador.telefone!, prestador.nome, prestador.especialidade)
                      }
                      className="w-full rounded-xl gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold"
                    >
                      <MessageCircle size={18} />
                      Falar no WhatsApp
                    </Button>
                  ) : (
                    <p className="text-[12px] text-muted-foreground text-center py-1">
                      Telefone não cadastrado
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </MoradorLayout>
    );
  }

  // Filter categories by search term
  const filteredCategorias = searchTerm
    ? categorias.filter((cat) =>
        cat.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categorias;

  return (
    <MoradorLayout title="Serviços">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por especialidade..."
            className="w-full h-11 rounded-full bg-muted pl-11 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground outline-none border-0 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {loading ? (
          <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
        ) : filteredCategorias.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Wrench size={40} className="text-muted-foreground" />
            <p className="text-[14px] text-muted-foreground">
              {searchTerm ? `Nenhum resultado para "${searchTerm}"` : "Nenhum prestador disponível"}
            </p>
          </div>
        ) : (
          filteredCategorias.map((cat) => (
            <Card
              key={cat.nome}
              className="cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => setSelectedCategoria(cat.nome)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Wrench size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-foreground">{cat.nome}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {cat.count} prestador{cat.count > 1 ? "es" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorServicos;
