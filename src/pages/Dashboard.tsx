import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, Wrench, Shield, DoorOpen } from "lucide-react";

const roleConfig: Record<string, { label: string; path: string; icon: typeof Home; color: string }> = {
  morador: { label: "Morador", path: "/morador", icon: Home, color: "hsl(var(--primary))" },
  prestador: { label: "Prestador", path: "/prestador", icon: Wrench, color: "hsl(var(--primary))" },
  admin: { label: "Administrador", path: "/admin", icon: Shield, color: "hsl(var(--primary))" },
  porteiro: { label: "Porteiro", path: "/porteiro", icon: DoorOpen, color: "hsl(var(--primary))" },
};

const Dashboard = () => {
  const { roles, rolesLoading, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();

  if (rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isPlatformAdmin) return <Navigate to="/master" replace />;

  // Deduplicate roles by role name
  const uniqueRoles = roles.reduce<typeof roles>((acc, r) => {
    if (!acc.find((x) => x.role === r.role)) acc.push(r);
    return acc;
  }, []);

  // Single role → redirect directly
  if (uniqueRoles.length === 1) {
    const cfg = roleConfig[uniqueRoles[0].role];
    if (cfg) return <Navigate to={cfg.path} replace />;
  }

  // Multiple roles → show selector
  if (uniqueRoles.length > 1) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Escolha seu perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">Você possui mais de um perfil ativo</p>
          </div>
          <div className="flex flex-col gap-3">
            {uniqueRoles.map((r) => {
              const cfg = roleConfig[r.role];
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <button
                  key={r.role}
                  onClick={() => navigate(cfg.path)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary/10">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground">Acessar módulo {cfg.label.toLowerCase()}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Sem role atribuída ainda
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <p className="text-center text-muted-foreground">
        Sua conta ainda não possui um perfil vinculado. Entre em contato com a administração do seu condomínio.
      </p>
    </div>
  );
};

export default Dashboard;
