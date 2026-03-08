import { Routes, Route, Navigate } from "react-router-dom";
import MasterHome from "./MasterHome";
import MasterCondominios from "./MasterCondominios";
import MasterUsuarios from "./MasterUsuarios";
import MasterFinanceiro from "./MasterFinanceiro";
import MasterMetricas from "./MasterMetricas";
import MasterPerfil from "./MasterPerfil";
import MasterCategorias from "./MasterCategorias";
import MasterBanners from "./MasterBanners";
import MasterBannerPrecos from "./MasterBannerPrecos";
import MasterBannerSolicitacoes from "./MasterBannerSolicitacoes";
import MasterLP from "./MasterLP";
import MasterPush from "./MasterPush";
import MasterMergeContas from "./MasterMergeContas";

const MasterDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<MasterHome />} />
      <Route path="/condominios" element={<MasterCondominios />} />
      <Route path="/usuarios" element={<MasterUsuarios />} />
      <Route path="/financeiro" element={<MasterFinanceiro />} />
      <Route path="/metricas" element={<MasterMetricas />} />
      <Route path="/categorias" element={<MasterCategorias />} />
      <Route path="/banners" element={<MasterBanners />} />
      <Route path="/banner-precos" element={<MasterBannerPrecos />} />
      <Route path="/banner-solicitacoes" element={<MasterBannerSolicitacoes />} />
      <Route path="/lp" element={<MasterLP />} />
      <Route path="/push" element={<MasterPush />} />
      <Route path="/merge-contas" element={<MasterMergeContas />} />
      <Route path="/perfil" element={<MasterPerfil />} />
    </Routes>
  );
};

export default MasterDashboard;
