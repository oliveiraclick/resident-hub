import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";

/**
 * Floating button that appears when a user has both morador + prestador roles.
 * Allows quick switching between modules.
 */
const ModuleSwitcher = () => {
  const { roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const uniqueRoleNames = [...new Set(roles.map((r) => r.role))];
  const hasMorador = uniqueRoleNames.includes("morador");
  const hasPrestador = uniqueRoleNames.includes("prestador");

  if (!hasMorador || !hasPrestador) return null;

  const isInMorador = location.pathname.startsWith("/morador");
  const isInPrestador = location.pathname.startsWith("/prestador");

  if (!isInMorador && !isInPrestador) return null;

  const targetPath = isInMorador ? "/prestador" : "/morador";
  const targetLabel = isInMorador ? "Prestador" : "Morador";

  return (
    <button
      onClick={() => navigate(targetPath)}
      className="fixed z-30 flex items-center gap-2 px-4 py-2.5 rounded-full border border-border shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
      style={{
        bottom: 86,
        right: 16,
        background: "hsl(var(--card))",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      }}
      title={`Ir para ${targetLabel}`}
    >
      <ArrowLeftRight size={16} className="text-primary" />
      <span className="text-xs font-semibold text-foreground">{targetLabel}</span>
    </button>
  );
};

export default ModuleSwitcher;
