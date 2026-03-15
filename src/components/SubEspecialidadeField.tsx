import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSubEspecialidades } from "@/hooks/useSubEspecialidades";
import { Plus } from "lucide-react";

interface Props {
  categoriaNome: string;
  value: string;
  onChange: (value: string) => void;
}

const SubEspecialidadeField = ({ categoriaNome, value, onChange }: Props) => {
  const { subs, addSub } = useSubEspecialidades(categoriaNome);
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleAddCustom = async () => {
    if (!custom.trim()) return;
    await addSub(custom.trim());
    onChange(custom.trim());
    setCustom("");
    setShowCustom(false);
  };

  if (!categoriaNome) return null;

  return (
    <div className="flex flex-col gap-2">
      {subs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => { onChange(sub.nome); setShowCustom(false); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                value === sub.nome
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-foreground border-border hover:border-primary/50"
              }`}
            >
              {sub.nome}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-primary/50 flex items-center gap-1"
          >
            <Plus size={12} />
            Outro
          </button>
        </div>
      )}

      {(subs.length === 0 || showCustom) && (
        <div className="flex gap-2">
          <Input
            placeholder="Ex: Churrasqueiro, Confeiteira..."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustom(); } }}
            className="flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={handleAddCustom} disabled={!custom.trim()}>
            Adicionar
          </Button>
        </div>
      )}

      {value && (
        <p className="text-xs text-muted-foreground ml-1">
          Selecionado: <span className="font-semibold text-foreground">{value}</span>
        </p>
      )}
    </div>
  );
};

export default SubEspecialidadeField;
