import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, isPlatformAdmin, rolesLoading, roles } = useAuth();
  const location = useLocation();

  if (loading || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-body">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const path = location.pathname;
  const firstRole = roles[0]?.role;

  // platform_admin must go to /master
  if (isPlatformAdmin && !path.startsWith("/master")) {
    return <Navigate to="/master" replace />;
  }

  // non platform_admin cannot access /master
  if (!isPlatformAdmin && path.startsWith("/master")) {
    return <Navigate to="/dashboard" replace />;
  }

  // Role-based route restrictions
  const roleRouteMap: Record<string, string[]> = {
    admin: ["/admin", "/dashboard"],
    morador: ["/morador", "/dashboard"],
    prestador: ["/prestador", "/dashboard"],
    porteiro: ["/porteiro", "/dashboard"],
  };

  if (firstRole && !isPlatformAdmin) {
    const allowedPrefixes = roleRouteMap[firstRole] || ["/dashboard"];
    const isAllowed = allowedPrefixes.some((prefix) => path.startsWith(prefix));

    if (!isAllowed) {
      // Redirect to the correct module
      const redirectMap: Record<string, string> = {
        admin: "/admin",
        morador: "/morador",
        prestador: "/prestador",
        porteiro: "/porteiro",
      };
      return <Navigate to={redirectMap[firstRole] || "/dashboard"} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
