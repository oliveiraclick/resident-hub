import { Routes, Route, Navigate } from "react-router-dom";
import EncomendasIndex from "./encomendas/EncomendasIndex";
import NovoLote from "./encomendas/NovoLote";
import Leitura from "./encomendas/Leitura";
import Triagem from "./encomendas/Triagem";
import Retirada from "./encomendas/Retirada";
import Historico from "./encomendas/Historico";

const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="encomendas" replace />} />
      <Route path="encomendas" element={<EncomendasIndex />} />
      <Route path="encomendas/novo-lote" element={<NovoLote />} />
      <Route path="encomendas/leitura" element={<Leitura />} />
      <Route path="encomendas/triagem" element={<Triagem />} />
      <Route path="encomendas/retirada" element={<Retirada />} />
      <Route path="encomendas/historico" element={<Historico />} />
    </Routes>
  );
};

export default AdminDashboard;
