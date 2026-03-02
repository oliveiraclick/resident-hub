import { Routes, Route } from "react-router-dom";
import PrestadorHome from "./PrestadorHome";
import PrestadorProdutos from "./PrestadorProdutos";
import PrestadorServicos from "./PrestadorServicos";
import PrestadorPerfil from "./PrestadorPerfil";
import PrestadorFinanceiro from "./PrestadorFinanceiro";
import PrestadorCondominios from "./PrestadorCondominios";
import PrestadorIndicacoes from "./PrestadorIndicacoes";
import PrestadorBanners from "./PrestadorBanners";

const PrestadorDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<PrestadorHome />} />
      <Route path="produtos" element={<PrestadorProdutos />} />
      <Route path="servicos" element={<PrestadorServicos />} />
      <Route path="perfil" element={<PrestadorPerfil />} />
      <Route path="financeiro" element={<PrestadorFinanceiro />} />
      <Route path="condominios" element={<PrestadorCondominios />} />
      <Route path="indicacoes" element={<PrestadorIndicacoes />} />
      <Route path="banners" element={<PrestadorBanners />} />
    </Routes>
  );
};

export default PrestadorDashboard;
