import { Routes, Route } from "react-router-dom";
import PrestadorHome from "./PrestadorHome";
import PrestadorProdutos from "./PrestadorProdutos";
import PrestadorServicos from "./PrestadorServicos";

const PrestadorDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<PrestadorHome />} />
      <Route path="produtos" element={<PrestadorProdutos />} />
      <Route path="servicos" element={<PrestadorServicos />} />
    </Routes>
  );
};

export default PrestadorDashboard;
