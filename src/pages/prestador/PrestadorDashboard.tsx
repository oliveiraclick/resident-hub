import { Routes, Route } from "react-router-dom";
import PrestadorHome from "./PrestadorHome";
import PrestadorProdutos from "./PrestadorProdutos";
import PrestadorServicos from "./PrestadorServicos";
import PrestadorPerfil from "./PrestadorPerfil";
import PrestadorFinanceiro from "./PrestadorFinanceiro";

const PrestadorDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<PrestadorHome />} />
      <Route path="produtos" element={<PrestadorProdutos />} />
      <Route path="servicos" element={<PrestadorServicos />} />
      <Route path="perfil" element={<PrestadorPerfil />} />
      <Route path="financeiro" element={<PrestadorFinanceiro />} />
    </Routes>
  );
};

export default PrestadorDashboard;
