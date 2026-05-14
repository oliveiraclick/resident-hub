import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Search, MessageCircle, User, Ticket, Star, ChevronRight } from "lucide-react";
import { getIcon } from "@/lib/iconMap";
import { Button } from "@/components/ui/button";
import AvaliarPrestadorDialog from "@/components/AvaliarPrestadorDialog";
import AvaliacoesListDialog, { AvaliacaoItem } from "@/components/AvaliacoesListDialog";

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

interface CategoriaIconMap {
  [nome: string]: string;
}

interface Categoria {
  nome: string;
  count: number;
}

interface PrestadorResumo {
  id: string;
  especialidade: string;
  descricao: string | null;
  user_id: string;
  nome: string;
  cover_url: string | null;
}

interface CupomInfo {
  codigo: string;
  desconto_percent: number;
}

interface AvaliacaoResumo {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  avaliador_nome: string;
}

interface PrestadorCompleto {
  id: string;
  especialidade: string;
  descricao: string | null;
  user_id: string;
  nome: string;
  telefone: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  cupom: CupomInfo | null;
  servicos: {
    id: string;
    titulo: string;
    descricao: string | null;
    preco: number | null;
  }[];
  avaliacoes: AvaliacaoResumo[];
  mediaNota: number | null;
  totalAvaliacoes: number;
}

const MoradorServicos = () => {
  const { user, roles } = useAuth();
  const condominioId = roles[0]?.condominio_id;
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const nomeFromUrl = searchParams.get("nome") || "";

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [iconMap, setIconMap] = useState<CategoriaIconMap>({});
  const [allPrestadores, setAllPrestadores] = useState<PrestadorResumo[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedNomeFilter, setSelectedNomeFilter] = useState<string | null>(null);
  const [prestadoresCompletos, setPrestadoresCompletos] = useState<PrestadorCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());
  const [avaliarDialog, setAvaliarDialog] = useState<{ userId: string; nome: string } | null>(null);
  const [verAvaliacoesDialog, setVerAvaliacoesDialog] = useState<{ nome: string; avaliacoes: AvaliacaoItem[]; media: number | null } | null>(null);
  const [todasAvaliacoesPorPrestador, setTodasAvaliacoesPorPrestador] = useState<Record<string, AvaliacaoItem[]>>({});

  useEffect(() => {
    if (!condominioId) return;
    const fetchPrestadores = async () => {
      setLoading(true);
      const { data: catData } = await supabase.from("categorias_servico").select("nome, icone").eq("ativo", true);
      if (catData) {
        const map: CategoriaIconMap = {};
        catData.forEach((c) => { map[c.nome] = c.icone; });
        setIconMap(map);
      }
      const { data } = await supabase.from("prestadores").select("id, especialidade, descricao, user_id, cover_url").eq("condominio_id", condominioId);
      if (data) {
        const userIds = data.map((p) => p.user_id);
        const { data: profiles } = await supabase.rpc("get_prestador_profiles", { _user_ids: userIds }) as { data: any[] };
        const enriched: PrestadorResumo[] = data.map((p: any) => {
          const profile = profiles?.find((pr) => pr.user_id === p.user_id);
          return { id: p.id, especialidade: p.especialidade, descricao: p.descricao, user_id: p.user_id, nome: profile?.nome || "Prestador", cover_url: p.cover_url || null };
        });
        setAllPrestadores(enriched);
        const map: Record<string, number> = {};
        enriched.forEach((p) => { map[p.especialidade] = (map[p.especialidade] || 0) + 1; });
        setCategorias(Object.entries(map).map(([nome, count]) => ({ nome, count })));
      }
      setLoading(false);
    };
    fetchPrestadores();
  }, [condominioId]);

  useEffect(() => {
    if (queryFromUrl && categorias.length > 0) {
      const exactMatch = categorias.find((c) => c.nome.toLowerCase() === queryFromUrl.toLowerCase());
      if (exactMatch) {
        setSelectedCategoria(exactMatch.nome);
        setSelectedNomeFilter(nomeFromUrl || null);
      } else {
        setSearchTerm(queryFromUrl);
      }
      setSearchParams({}, { replace: true });
    }
  }, [queryFromUrl, categorias, nomeFromUrl]);

  useEffect(() => {
    if (!condominioId || !selectedCategoria) return;
    const fetchPrestadoresCompletos = async () => {
      setLoadingDetail(true);
      const prestadoresFiltrados = allPrestadores.filter((p) => p.especialidade === selectedCategoria);
      if (!prestadoresFiltrados.length) { setPrestadoresCompletos([]); setLoadingDetail(false); return; }
      const userIds = prestadoresFiltrados.map((p) => p.user_id);
      const prestadorIds = prestadoresFiltrados.map((p) => p.id);
      const { data: profiles } = await supabase.rpc("get_prestador_profiles", { _user_ids: userIds }) as { data: any[] };
      const [{ data: servicos }, { data: cupons }, { data: avaliacoesRaw }] = await Promise.all([
        supabase.from("servicos").select("id, titulo, descricao, preco, prestador_id").eq("condominio_id", condominioId).in("prestador_id", prestadorIds).eq("status", "ativo"),
        supabase.from("cupons_prestador").select("prestador_id, codigo, desconto_percent").in("prestador_id", prestadorIds).eq("ativo", true),
        supabase.from("avaliacoes").select("id, nota, comentario, created_at, avaliado_id, avaliador_id").in("avaliado_id", userIds).order("created_at", { ascending: false }),
      ]);
      const avaliadorIds = Array.from(new Set((avaliacoesRaw || []).map((a: any) => a.avaliador_id)));
      let avaliadorMap: Record<string, string> = {};
      if (avaliadorIds.length > 0) {
        const { data: avaliadorProfiles } = await supabase.rpc("get_evento_participant_profiles", { _user_ids: avaliadorIds }) as { data: any[] };
        (avaliadorProfiles || []).forEach((p) => { avaliadorMap[p.user_id] = p.nome; });
      }
      const result: PrestadorCompleto[] = prestadoresFiltrados.map((p) => {
        const profile = profiles?.find((pr) => pr.user_id === p.user_id);
        const prestadorServicos = servicos?.filter((s) => s.prestador_id === p.id) || [];
        const cupom = (cupons as any[])?.find((c) => c.prestador_id === p.id) || null;
        const todasAvaliacoes = (avaliacoesRaw as any[])?.filter((a) => a.avaliado_id === p.user_id) || [];
        const avaliacoes: AvaliacaoResumo[] = todasAvaliacoes.slice(0, 3).map((a) => ({ id: a.id, nota: a.nota, comentario: a.comentario, created_at: a.created_at, avaliador_nome: avaliadorMap[a.avaliador_id] || "Morador" }));
        const mediaNota = todasAvaliacoes.length > 0 ? todasAvaliacoes.reduce((sum, a) => sum + a.nota, 0) / todasAvaliacoes.length : null;
        return { id: p.id, especialidade: p.especialidade, descricao: p.descricao, user_id: p.user_id, nome: profile?.nome || "Prestador", telefone: profile?.telefone || null, avatar_url: profile?.avatar_url || null, cover_url: p.cover_url, cupom: cupom ? { codigo: cupom.codigo, desconto_percent: cupom.desconto_percent } : null, servicos: prestadorServicos, avaliacoes, mediaNota, totalAvaliacoes: todasAvaliacoes.length };
      });
      const allAvalMap: Record<string, AvaliacaoItem[]> = {};
      prestadoresFiltrados.forEach((p) => {
        const todas = (avaliacoesRaw as any[])?.filter((a) => a.avaliado_id === p.user_id) || [];
        allAvalMap[p.user_id] = todas.map((a) => ({ id: a.id, nota: a.nota, comentario: a.comentario, created_at: a.created_at, avaliador_nome: avaliadorMap[a.avaliador_id] || "Morador" }));
      });
      setTodasAvaliacoesPorPrestador(allAvalMap);
      if (selectedNomeFilter) {
        const nf = selectedNomeFilter.toLowerCase();
        setPrestadoresCompletos(result.filter((p) => p.nome.toLowerCase().includes(nf)));
      } else {
        setPrestadoresCompletos(result);
      }
      setLoadingDetail(false);
    };
    fetchPrestadoresCompletos();
  }, [condominioId, selectedCategoria, allPrestadores, selectedNomeFilter]);

  useEffect(() => {
    if (!user) return;
    supabase.from("solicitacoes_servico").select("prestador_user_id").eq("morador_id", user.id).then(({ data }) => {
      setSolicitados(new Set((data || []).map((s) => s.prestador_user_id)));
    });
  }, [user]);

  const openWhatsApp = async (prestadorUserId: string, telefone: string, nome: string, especialidade: string, cupom?: CupomInfo | null) => {
    if (user && condominioId && !solicitados.has(prestadorUserId)) {
      await supabase.from("solicitacoes_servico").insert({ morador_id: user.id, prestador_user_id: prestadorUserId, condominio_id: condominioId });
      setSolicitados((prev) => new Set(prev).add(prestadorUserId));
    }
    const cleaned = telefone.replace(/\D/g, "");
    const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    let text = `Olá ${nome}! Vi seu perfil de ${especialidade} no app do condomínio e gostaria de saber mais sobre seus serviços.`;
    if (cupom) text += ` Tenho o cupom ${cupom.codigo} (${cupom.desconto_percent}% de desconto).`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (selectedCategoria) {
    return (
      <MoradorLayout title={selectedCategoria} showBack>
        <div className="flex flex-col gap-6 pb-20">
          <div className="flex items-center justify-between px-1">
             <h1 className="text-2xl font-black tracking-tight">{selectedCategoria}</h1>
             <p className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
               {prestadoresCompletos.length} Disponíveis
             </p>
          </div>
          {loadingDetail ? (
            <div className="flex flex-col gap-4">
               {[1, 2].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-[32px]" />)}
            </div>
          ) : prestadoresCompletos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-20 px-8 bg-card rounded-[40px] border border-dashed">
              <Wrench size={48} className="text-muted-foreground/20" />
              <p className="text-muted-foreground font-bold">Nenhum prestador encontrado.</p>
            </div>
          ) : (
            prestadoresCompletos.map((prestador) => (
              <Card key={prestador.id} className="overflow-hidden border-none shadow-premium rounded-[40px] bg-card group animate-in fade-in-up duration-500">
                <div className="relative h-[180px] overflow-hidden">
                  <img src={prestador.cover_url || coverImages[prestador.especialidade] || coverImages.Jardinagem} alt={prestador.especialidade} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  {prestador.cupom && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 animate-in zoom-in-90">
                      <Ticket size={16} />
                      <span className="text-xs font-black uppercase tracking-wider">{prestador.cupom.desconto_percent}% OFF</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-6 -mt-12 relative">
                  <div className="flex items-end gap-4 mb-6">
                    <div className="h-20 w-20 rounded-[28px] bg-card border-[6px] border-card flex items-center justify-center flex-shrink-0 overflow-hidden shadow-premium">
                      {prestador.avatar_url ? <img src={prestador.avatar_url} alt={prestador.nome} className="h-full w-full object-cover" /> : <User size={32} className="text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <h2 className="text-xl font-black text-foreground truncate leading-none mb-1">{prestador.nome}</h2>
                      <div className="flex items-center gap-2">
                        {prestador.mediaNota !== null && <div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded-lg"><Star size={12} className="fill-yellow-500 text-yellow-500" /><span className="text-xs font-black text-yellow-700">{prestador.mediaNota.toFixed(1)}</span></div>}
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{prestador.especialidade}</p>
                      </div>
                    </div>
                  </div>
                  {prestador.descricao && <p className="text-[14px] text-foreground/70 leading-relaxed font-medium mb-6 px-1 italic">"{prestador.descricao}"</p>}
                  {prestador.avaliacoes.length > 0 && (
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between"><label className="mb-0">Avaliações Recentes</label><button onClick={() => setVerAvaliacoesDialog({ nome: prestador.nome, avaliacoes: todasAvaliacoesPorPrestador[prestador.user_id] || [], media: prestador.mediaNota })} className="text-[10px] font-black uppercase text-primary tracking-widest">Ver Todas</button></div>
                      <div className="space-y-3">
                        {prestador.avaliacoes.map((av) => (
                          <div key={av.id} className="bg-muted/40 rounded-3xl p-4 border border-white/50">
                            <div className="flex items-center justify-between gap-2 mb-2"><p className="text-xs font-black text-foreground">{av.avaliador_nome}</p><div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} size={10} className={i < av.nota ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/20"} />))}</div></div>
                            {av.comentario && <p className="text-[13px] text-muted-foreground leading-snug line-clamp-2">"{av.comentario}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
                    <Button className="h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 gap-3" onClick={() => openWhatsApp(prestador.user_id, prestador.telefone || "", prestador.nome, prestador.especialidade, prestador.cupom)} disabled={!prestador.telefone}><MessageCircle size={22} /> Contatar agora</Button>
                    <Button variant="outline" className="h-14 rounded-2xl font-black text-base border-2 hover:bg-muted" onClick={() => setAvaliarDialog({ userId: prestador.user_id, nome: prestador.nome })} disabled={!solicitados.has(prestador.user_id)}>Avaliar Profissional</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {avaliarDialog && condominioId && <AvaliarPrestadorDialog open={!!avaliarDialog} onOpenChange={(o) => !o && setAvaliarDialog(null)} prestadorUserId={avaliarDialog.userId} prestadorNome={avaliarDialog.nome} condominioId={condominioId} />}
        {verAvaliacoesDialog && <AvaliacoesListDialog open={!!verAvaliacoesDialog} onOpenChange={(o) => !o && setVerAvaliacoesDialog(null)} prestadorNome={verAvaliacoesDialog.nome} avaliacoes={verAvaliacoesDialog.avaliacoes} mediaNota={verAvaliacoesDialog.media} />}
      </MoradorLayout>
    );
  }

  const filteredCategorias = searchTerm ? categorias.filter((cat) => {
    const term = searchTerm.toLowerCase();
    const matchCategoria = cat.nome.toLowerCase().includes(term);
    const matchPrestadorNome = allPrestadores.some((p) => p.especialidade === cat.nome && p.nome.toLowerCase().includes(term));
    return matchCategoria || matchPrestadorNome;
  }) : categorias;

  return (
    <MoradorLayout title="Serviços" showBack>
      <div className="flex flex-col gap-8 pb-20">
        <header className="px-1">
          <h1 className="text-4xl font-black tracking-tight mb-2">Serviços</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Profissionais por categoria</p>
        </header>
        <div className="relative z-10"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="O que você precisa hoje?" className="w-full h-14 rounded-[24px] bg-card pl-12 pr-6 text-sm font-bold border-none shadow-soft focus:ring-2 focus:ring-primary/20 transition-all outline-none" /></div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-[28px]" />)}</div>
        ) : filteredCategorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-4 py-20 px-8 bg-card rounded-[40px] border border-dashed"><Wrench size={48} className="text-muted-foreground/20" /><p className="text-muted-foreground font-bold">{searchTerm ? `Nenhum resultado para "${searchTerm}"` : "Nenhum prestador disponível"}</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-up duration-500">
            {filteredCategorias.map((cat) => {
              const Icon = getIcon(iconMap[cat.nome] || "Wrench");
              return (
                <Card key={cat.nome} className="group cursor-pointer border-none shadow-soft hover:shadow-premium rounded-[32px] transition-all active:scale-[0.98] overflow-hidden bg-card" onClick={() => { setSelectedNomeFilter(null); setSelectedCategoria(cat.nome); }}>
                  <CardContent className="flex items-center gap-5 p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300"><Icon size={26} /></div>
                    <div className="flex-1 min-w-0 space-y-1"><p className="text-lg font-black tracking-tight text-foreground">{cat.nome}</p><p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{cat.count} {cat.count === 1 ? 'Profissional' : 'Profissionais'} disponível</p></div>
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"><ChevronRight size={20} /></div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MoradorLayout>
  );
};

export default MoradorServicos;
