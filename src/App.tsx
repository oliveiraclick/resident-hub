import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MoradorDashboard from "./pages/morador/MoradorDashboard";
import PrestadorDashboard from "./pages/prestador/PrestadorDashboard";
import MasterDashboard from "./pages/master/MasterDashboard";
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";
import CadastroMorador from "./pages/CadastroMorador";
import CadastroPrestador from "./pages/CadastroPrestador";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cadastro/morador" element={<CadastroMorador />} />
            <Route path="/cadastro/prestador" element={<CadastroPrestador />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/morador/*"
              element={
                <ProtectedRoute>
                  <MoradorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prestador/*"
              element={
                <ProtectedRoute>
                  <PrestadorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/master/*"
              element={
                <ProtectedRoute>
                  <MasterDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
