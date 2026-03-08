import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCategorias } from "@/hooks/useCategorias";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Check } from "lucide-react";
import { getIcon } from "@/lib/iconMap";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AtivarPrestadorModal = ({ open, onOpenChange, onSuccess }: Props) => {
  const { user, roles } = useAuth();
  const condominioId = roles.find((r) => r.role === "morador")?.condominio_id;
  const { grouped, loading: catLoading } = useCategorias();

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const handleActivate = async () => {
    if (!user || !condominioId || !selectedCat) return;
    setSaving(true);
    try {
      // 1. Create prestador record
      const { error: prestErr } = await supabase.from("prestadores").insert({
        user_id: user.id,
        condominio_id: condominioId,
        especialidade: selectedCat,
        descricao: descricao.trim() || null,
      });
      if (prestErr) throw prestErr;

      // 2. Create prestador role
      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "prestador" as any,
        condominio_id: condominioId,
      });
      if (roleErr) throw roleErr;

      toast.success("Perfil de vendedor ativado! 🎉");
      onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao ativar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            Ativar perfil de vendedor
          </DialogTitle>
          <DialogDescription>
            Ao ativar, você terá acesso ao módulo completo do prestador para criar sua loja, listar produtos e gerenciar pedidos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Selecione sua especialidade *</label>
            <ScrollArea className="h-48 border rounded-lg p-2">
              {catLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
              ) : (
                grouped.map((g) => (
                  <div key={g.group} className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                      {g.group}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((cat) => {
                        const isSelected = selectedCat === cat.nome;
                        const Icon = getIcon(cat.icone);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCat(cat.nome)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-foreground border-border hover:bg-muted"
                            }`}
                          >
                            {Icon && <Icon size={12} />}
                            {cat.nome}
                            {isSelected && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Descrição (opcional)</label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Conte um pouco sobre o que você faz..."
              rows={3}
            />
          </div>

          <Button onClick={handleActivate} disabled={saving || !selectedCat} className="gap-1.5">
            <Sparkles size={16} />
            {saving ? "Ativando..." : "Ativar perfil de vendedor"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AtivarPrestadorModal;
