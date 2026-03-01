import { RefreshCw, X } from "lucide-react";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";

const UpdateBanner = () => {
  const { updateAvailable, applyUpdate, dismissUpdate } = useUpdateChecker();

  if (!updateAvailable) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 py-3 text-white animate-in slide-in-from-top-4 duration-300"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--header-bg)))",
      }}
    >
      <RefreshCw size={16} className="animate-spin flex-shrink-0" style={{ animationDuration: "3s" }} />
      <p className="text-[13px] font-medium">Nova atualização disponível!</p>
      <button
        onClick={applyUpdate}
        className="ml-1 px-3 py-1 rounded-full text-[12px] font-bold border border-white/30 cursor-pointer active:opacity-70"
        style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
      >
        Atualizar
      </button>
      <button
        onClick={dismissUpdate}
        className="ml-auto h-7 w-7 rounded-full flex items-center justify-center cursor-pointer"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default UpdateBanner;
