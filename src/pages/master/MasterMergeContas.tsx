import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Merge, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserInfo {
  userId: string;
  nome: string;
  role: string;
  condominioNome: string;
  especialidade?: string | null;
}

const MasterMergeContas = () => {
  const [searchMorador, setSearchMorador] = useState("");
  const [searchPrestador, setSearchPrestador] = useState("");
  const [moradores, setMoradores] = useState<UserInfo[]>([]);
  const [prestadores, setPrestadores] = useState<UserInfo[]>([]);
  const [selectedMorador, setSelectedMorador] = useState<UserInfo | null>(null);
  const [selectedPrestador, setSelectedPrestador] = useState<UserInfo | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [merging, setMerging] = useState(false);

  // Search moradores
  useEffect(() => {
    if (searchMorador.length < 2) { setMoradores([]); return; }
    const timer = setTimeout(async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, condominio_id, role")
        .eq("role", "morador");
      if (!roles) return;

      const userIds = roles.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .in("user_id", userIds);

      const condIds = [...new Set(roles.map((r: any) => r.condominio_id).filter(Boolean))];
      const { data: conds } = await supabase
        .from("condominios")
        .select("id, nome")
        .in("id", condIds);
      const condMap = new Map((conds || []).map((c: any) => [c.id, c.nome]));

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.nome]));

      const results: UserInfo[] = roles
        .map((r: any) => ({
          userId: r.user_id,
          nome: profileMap.get(r.user_id) || "Sem nome",
          role: r.role,
          condominioNome: r.condominio_id ? condMap.get(r.condominio_id) || "—" : "—",
        }))
        .filter((u: UserInfo) => u.nome.toLowerCase().includes(searchMorador.toLowerCase()));

      setMoradores(results.slice(0, 10));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchMorador]);

  // Search prestadores
  useEffect(() => {
    if (searchPrestador.length < 2) { setPrestadores([]); return; }
    const timer = setTimeout(async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, condominio_id, role")
        .eq("role", "prestador");
      if (!roles) return;

      const userIds = roles.map((r: any) => r.user_id);
      const [profilesRes, prestadoresRes] = await Promise.all([
        supabase.from("profiles").select("user_id, nome").in("user_id", userIds),
        supabase.from("prestadores").select("user_id, especialidade").in("user_id", userIds),
      ]);

      const condIds = [...new Set(roles.map((r: any) => r.condominio_id).filter(Boolean))];
      const { data: conds } = await supabase.from("condominios").select("id, nome").in("id", condIds);
      const condMap = new Map((conds || []).map((c: any) => [c.id, c.nome]));
      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.nome]));
      const espMap = new Map((prestadoresRes.data || []).map((p: any) => [p.user_id, p.especialidade]));

      const results: UserInfo[] = roles
        .map((r: any) => ({
          userId: r.user_id,
          nome: profileMap.get(r.user_id) || "Sem nome",
          role: r.role,
          condominioNome: r.condominio_id ? condMap.get(r.condominio_id) || "—" : "—",
          especialidade: espMap.get(r.user_id) || null,
        }))
        .filter((u: UserInfo) => u.nome.toLowerCase().includes(searchPrestador.toLowerCase()));

      setPrestadores(results.slice(0, 10));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchPrestador]);

  const handleMerge = async () => {
    if (!selectedMorador || !selectedPrestador) return;
    setMerging(true);
    try {
      const { data, error } = await supabase.functions.invoke("merge-accounts", {
        body: {
          morador_user_id: selectedMorador.userId,
          prestador_user_id: selectedPrestador.userId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Contas unificadas com sucesso! 🎉");
      setSelectedMorador(null);
      setSelectedPrestador(null);
      setSearchMorador("");
      setSearchPrestador("");
      setShowConfirm(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao unificar contas");
    } finally {
      setMerging(false);
    }
  };

  return (
    <MasterLayout title="Unificar Contas">
      <div className="flex flex-col gap-6 max-w-lg mx-auto">
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <Merge size={20} className="text-primary" />
              <h2 className="text-base font-semibold text-foreground">Unificar contas duplicadas</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Selecione a conta de <strong>morador</strong> (que será mantida) e a conta de <strong>prestador</strong> (que será absorvida). 
              Os dados do prestador serão migrados para a conta do morador e a conta antiga do prestador será excluída.
            </p>
          </CardContent>
        </Card>

        {/* Morador selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</span>
            Conta do Morador (será mantida)
          </label>

          {selectedMorador ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedMorador.nome}</p>
                  <p className="text-xs text-muted-foreground">{selectedMorador.condominioNome}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">morador</Badge>
                  <CheckCircle size={16} className="text-primary" />
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMorador(null)}>Trocar</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar morador por nome..."
                  value={searchMorador}
                  onChange={(e) => setSearchMorador(e.target.value)}
                  className="pl-9"
                />
              </div>
              {moradores.length > 0 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {moradores.map((u) => (
                    <button
                      key={u.userId}
                      onClick={() => { setSelectedMorador(u); setSearchMorador(""); setMoradores([]); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <p className="text-sm font-medium text-foreground">{u.nome}</p>
                      <p className="text-xs text-muted-foreground">{u.condominioNome}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowRight size={18} className="text-muted-foreground rotate-90" />
          </div>
        </div>

        {/* Prestador selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">2</span>
            Conta do Prestador (será excluída)
          </label>

          {selectedPrestador ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedPrestador.nome}</p>
                  <p className="text-xs text-muted-foreground">{selectedPrestador.condominioNome}</p>
                  {selectedPrestador.especialidade && (
                    <p className="text-xs text-muted-foreground">🔧 {selectedPrestador.especialidade}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-[10px]">prestador</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPrestador(null)}>Trocar</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar prestador por nome..."
                  value={searchPrestador}
                  onChange={(e) => setSearchPrestador(e.target.value)}
                  className="pl-9"
                />
              </div>
              {prestadores.length > 0 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {prestadores.map((u) => (
                    <button
                      key={u.userId}
                      onClick={() => { setSelectedPrestador(u); setSearchPrestador(""); setPrestadores([]); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <p className="text-sm font-medium text-foreground">{u.nome}</p>
                      <p className="text-xs text-muted-foreground">{u.condominioNome} {u.especialidade ? `· 🔧 ${u.especialidade}` : ""}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Merge button */}
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={!selectedMorador || !selectedPrestador}
          className="gap-2"
          size="lg"
        >
          <Merge size={18} />
          Unificar contas
        </Button>

        {/* Confirmation dialog */}
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-destructive" />
                Confirmar unificação?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Esta ação é <strong>irreversível</strong>. Vai acontecer o seguinte:</p>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li>Os dados de prestador (produtos, serviços, loja) serão transferidos para <strong>{selectedMorador?.nome}</strong></li>
                  <li>A conta de <strong>{selectedPrestador?.nome}</strong> (prestador) será <strong>excluída permanentemente</strong></li>
                  <li><strong>{selectedMorador?.nome}</strong> terá acesso aos módulos Morador e Prestador</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleMerge}
                disabled={merging}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {merging ? "Unificando..." : "Confirmar unificação"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MasterLayout>
  );
};

export default MasterMergeContas;
