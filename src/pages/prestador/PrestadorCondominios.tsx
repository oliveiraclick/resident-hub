import { useEffect, useState } from "react";
import PrestadorLayout from "@/components/PrestadorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Users, Check, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CondominioItem {
  id: string;
  nome: string;
  endereco: string | null;
  logo_url: string | null;
  totalMoradores: number;
  jaInscrito: boolean;
  assinaturaStatus: string | null;
}

const PrestadorCondominios = () => {
  const { user, roles } = useAuth();
  const [condominios, setCondominios] = useState<CondominioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  const prestadorRoles = roles.filter((r) => r.role === "prestador");
  const meuCondominioIds = prestadorRoles.map((r) => r.condominio_id);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar todos os condomínios
      const { data: conds } = await supabase
        .from("condominios")
        .select("id, nome, endereco, logo_url")
        .order("nome");

      // Buscar contagem de moradores via RPC segura
      const { data: countsData } = await supabase.rpc("get_condominio_morador_counts");

      // Buscar prestadores do usuário atual
      const { data: meusPrestadores } = await supabase
        .from("prestadores")
        .select("id, condominio_id")
        .eq("user_id", user!.id);

      // Buscar assinaturas do prestador
      const prestadorIds = (meusPrestadores || []).map((p) => p.id);
      let assinaturas: any[] = [];
      if (prestadorIds.length > 0) {
        const { data } = await supabase
          .from("assinaturas_prestador")
          .select("prestador_id, condominio_id, status")
          .in("prestador_id", prestadorIds);
        assinaturas = data || [];
      }

      const inscritosCondIds = (meusPrestadores || []).map((p) => p.condominio_id);

      const list: CondominioItem[] = (conds || []).map((c) => {
        const countRow = (countsData || []).find((r: any) => r.condominio_id === c.id);
        const moradores = countRow ? Number(countRow.total) : 0;
        const jaInscrito = inscritosCondIds.includes(c.id);
        const assinatura = assinaturas.find((a) => a.condominio_id === c.id);
        return {
          ...c,
          totalMoradores: moradores,
          jaInscrito,
          assinaturaStatus: assinatura?.status || null,
        };
      });

      setCondominios(list);
    } catch (e) {
      console.error("fetchData error", e);
    }
    setLoading(false);
  };

  const handleSolicitar = async (condId: string) => {
    if (!user) return;
    setAdding(condId);
    try {
      // Buscar especialidade do prestador existente
      const { data: meuPrestador } = await supabase
        .from("prestadores")
        .select("especialidade, descricao")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!meuPrestador) {
        toast.error("Perfil de prestador não encontrado");
        setAdding(null);
        return;
      }

      // Criar registro de prestador no novo condomínio
      const { data: novoPrestador, error: errPrest } = await supabase
        .from("prestadores")
        .insert({
          user_id: user.id,
          condominio_id: condId,
          especialidade: meuPrestador.especialidade,
          descricao: meuPrestador.descricao,
        })
        .select("id")
        .single();

      if (errPrest) throw errPrest;

      // Criar user_role para o novo condomínio
      await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "prestador",
        condominio_id: condId,
      });

      // Criar assinatura trial
      if (novoPrestador) {
        await supabase.from("assinaturas_prestador").insert({
          prestador_id: novoPrestador.id,
          condominio_id: condId,
          status: "trial",
          valor_mensal: 24.90,
        });
      }

      toast.success("Condomínio adicionado com sucesso!");
      fetchData();
    } catch (e: any) {
      console.error("handleSolicitar error", e);
      toast.error("Erro ao adicionar condomínio");
    }
    setAdding(null);
  };

  const isFirst = (condId: string) => {
    return meuCondominioIds.length === 0 || 
      (meuCondominioIds.length === 1 && meuCondominioIds[0] === condId);
  };

  return (
    <PrestadorLayout title="Condomínios" showBack>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Escolha os condomínios onde deseja oferecer seus serviços e produtos.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {condominios.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-border bg-card p-4"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-start gap-3">
                  {/* Logo / Ícone */}
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={22} className="text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-foreground truncate">{c.nome}</h3>
                    {c.endereco && (
                      <p className="text-[12px] text-muted-foreground truncate mt-0.5">{c.endereco}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      <Users size={13} className="text-primary" />
                      <span className="text-[12px] font-semibold text-primary">
                        {c.totalMoradores} morador{c.totalMoradores !== 1 ? "es" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Ação */}
                  <div className="flex-shrink-0">
                    {c.jaInscrito ? (
                      <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-0">
                        <Check size={12} /> Ativo
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSolicitar(c.id)}
                        disabled={adding === c.id}
                        className="gap-1 rounded-xl text-xs h-8"
                      >
                        {adding === c.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Plus size={14} />
                        )}
                        Adicionar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Info de preço */}
                {!c.jaInscrito && (
                  <p className="text-[11px] text-muted-foreground mt-2.5 ml-[60px]">
                    {isFirst(c.id) ? "R$ 29,90/mês" : "+R$ 24,90/mês"} • 60 dias grátis
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorCondominios;
