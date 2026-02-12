import { Routes, Route } from "react-router-dom";
import PrestadorHome from "./PrestadorHome";
import PrestadorProdutos from "./PrestadorProdutos";

const PrestadorDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<PrestadorHome />} />
      <Route path="produtos" element={<PrestadorProdutos />} />
    </Routes>
  );
};

export default PrestadorDashboard;
