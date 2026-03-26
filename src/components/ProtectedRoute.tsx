import { Navigate, useLocation } from "react-router-dom";

const DEBUG_NAV = true;
import { useAuth } from "@/hooks/useAuth";
import TermsAcceptanceModal from "@/components/TermsAcceptanceModal";

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
    if (DEBUG_NAV) console.log("[ProtectedRoute] REDIRECT platform_admin to /master from:", path);
    return <Navigate to="/master" replace />;
  }

  // non platform_admin cannot access /master
  if (!isPlatformAdmin && path.startsWith("/master")) {
    if (DEBUG_NAV) console.log("[ProtectedRoute] REDIRECT non-admin away from /master, path:", path);
    return <Navigate to="/dashboard" replace />;
  }

  // Role-based route restrictions — collect ALL user roles
  const roleRouteMap: Record<string, string[]> = {
    admin: ["/admin", "/dashboard"],
    morador: ["/morador", "/prestador", "/dashboard"],
    prestador: ["/prestador", "/morador", "/dashboard"],
    porteiro: ["/porteiro", "/dashboard"],
  };

  if (roles.length > 0 && !isPlatformAdmin) {
    // Build allowed prefixes from ALL roles
    const allAllowedPrefixes = roles.flatMap(
      (r) => roleRouteMap[r.role] || ["/dashboard"]
    );
    const isAllowed = allAllowedPrefixes.some((prefix) => path.startsWith(prefix));

    if (!isAllowed) {
      if (DEBUG_NAV) console.log("[ProtectedRoute] REDIRECT role mismatch, path:", path, "roles:", roles.map(r => r.role), "allowed:", allAllowedPrefixes);
      const redirectMap: Record<string, string> = {
        admin: "/admin",
        morador: "/morador",
        prestador: "/prestador",
        porteiro: "/porteiro",
      };
      return <Navigate to={redirectMap[firstRole] || "/dashboard"} replace />;
    }
  }

  return (
    <>
      <TermsAcceptanceModal />
      {children}
    </>
  );
};

export default ProtectedRoute;
