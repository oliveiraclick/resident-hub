import { Routes, Route, Navigate } from "react-router-dom";
import AdminHome from "./AdminHome";
import AdminFinanceiro from "./AdminFinanceiro";
import AdminUsuarios from "./AdminUsuarios";
import AdminConfiguracoes from "./AdminConfiguracoes";
import AdminPerfil from "./AdminPerfil";
import EncomendasIndex from "./encomendas/EncomendasIndex";
import NovoLote from "./encomendas/NovoLote";
import Leitura from "./encomendas/Leitura";
import Triagem from "./encomendas/Triagem";
import Retirada from "./encomendas/Retirada";
import Historico from "./encomendas/Historico";

const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminHome />} />
      <Route path="encomendas" element={<EncomendasIndex />} />
      <Route path="encomendas/novo-lote" element={<NovoLote />} />
      <Route path="encomendas/leitura" element={<Leitura />} />
      <Route path="encomendas/triagem" element={<Triagem />} />
      <Route path="encomendas/retirada" element={<Retirada />} />
      <Route path="encomendas/historico" element={<Historico />} />
      <Route path="financeiro" element={<AdminFinanceiro />} />
      <Route path="usuarios" element={<AdminUsuarios />} />
      <Route path="configuracoes" element={<AdminConfiguracoes />} />
      <Route path="perfil" element={<AdminPerfil />} />
    </Routes>
  );
};

export default AdminDashboard;
