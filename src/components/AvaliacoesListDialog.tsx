import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";

export interface AvaliacaoItem {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  avaliador_nome: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  prestadorNome: string;
  avaliacoes: AvaliacaoItem[];
  mediaNota: number | null;
}

const AvaliacoesListDialog = ({ open, onOpenChange, prestadorNome, avaliacoes, mediaNota }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliações de {prestadorNome}</DialogTitle>
        </DialogHeader>
        {mediaNota !== null && (
          <div className="flex items-center gap-2 pb-2 border-b">
            <Star size={18} className="fill-yellow-500 text-yellow-500" />
            <span className="text-[16px] font-bold text-foreground">{mediaNota.toFixed(1)}</span>
            <span className="text-[12px] text-muted-foreground">
              ({avaliacoes.length} avaliaç{avaliacoes.length === 1 ? "ão" : "ões"})
            </span>
          </div>
        )}
        <div className="flex flex-col gap-2.5">
          {avaliacoes.length === 0 ? (
            <p className="text-[13px] text-muted-foreground text-center py-6">
              Nenhuma avaliação ainda
            </p>
          ) : (
            avaliacoes.map((av) => (
              <div key={av.id} className="bg-muted/50 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {av.avaliador_nome}
                  </p>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        className={i < av.nota ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}
                      />
                    ))}
                  </div>
                </div>
                {av.comentario && (
                  <p className="text-[12px] text-muted-foreground leading-snug">
                    "{av.comentario}"
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(av.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvaliacoesListDialog;
