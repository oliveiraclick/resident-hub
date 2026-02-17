import { useNavigate } from "react-router-dom";
import MoradorLayout from "@/components/MoradorLayout";
import { useCategorias } from "@/hooks/useCategorias";
import { getIcon } from "@/lib/iconMap";

const MoradorServicosCategorias = () => {
  const navigate = useNavigate();
  const { grouped, loading } = useCategorias();

  return (
    <MoradorLayout title="Serviços" showBack>
      {loading ? (
        <p className="text-[13px] text-muted-foreground text-center py-8">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map((cat) => (
            <div key={cat.group}>
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {cat.group}
              </p>
              <div className="grid grid-cols-4 gap-3">
                {cat.items.map((item) => {
                  const Icon = getIcon(item.icone);
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/morador/servicos?q=${encodeURIComponent(item.nome)}`)}
                      className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <div className="h-14 w-14 rounded-2xl bg-card shadow-sm flex items-center justify-center">
                        <Icon size={22} className="text-primary" />
                      </div>
                      <span className="text-[11px] font-medium text-foreground leading-tight text-center">
                        {item.nome}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </MoradorLayout>
  );
};

export default MoradorServicosCategorias;
