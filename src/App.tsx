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
import RecuperarSenha from "./pages/auth/RecuperarSenha";
import ResetarSenha from "./pages/auth/ResetarSenha";
import CadastroMorador from "./pages/CadastroMorador";
import CadastroPrestador from "./pages/CadastroPrestador";
import PreviewHome from "./pages/PreviewHome";
import PreviewHome2 from "./pages/PreviewHome2";
import PreviewHome3 from "./pages/PreviewHome3";
import PreviewHome4 from "./pages/PreviewHome4";
import PreviewHome5 from "./pages/PreviewHome5";

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
            <Route path="/auth/recuperar" element={<RecuperarSenha />} />
            <Route path="/auth/resetar" element={<ResetarSenha />} />
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
            <Route path="/preview-home" element={<PreviewHome />} />
            <Route path="/preview-home2" element={<PreviewHome2 />} />
            <Route path="/preview-home3" element={<PreviewHome3 />} />
            <Route path="/preview-home4" element={<PreviewHome4 />} />
            <Route path="/preview-home5" element={<PreviewHome5 />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
