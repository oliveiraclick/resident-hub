import { Routes, Route, Navigate } from "react-router-dom";
import MasterHome from "./MasterHome";
import MasterCondominios from "./MasterCondominios";
import MasterUsuarios from "./MasterUsuarios";
import MasterFinanceiro from "./MasterFinanceiro";
import MasterMetricas from "./MasterMetricas";

const MasterDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<MasterHome />} />
      <Route path="/condominios" element={<MasterCondominios />} />
      <Route path="/usuarios" element={<MasterUsuarios />} />
      <Route path="/financeiro" element={<MasterFinanceiro />} />
      <Route path="/metricas" element={<MasterMetricas />} />
    </Routes>
  );
};

export default MasterDashboard;
