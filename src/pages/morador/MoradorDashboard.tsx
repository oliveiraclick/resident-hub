import { Routes, Route, Navigate } from "react-router-dom";
import MoradorHome from "./MoradorHome";
import MoradorServicos from "./MoradorServicos";
import MoradorDesapegos from "./MoradorDesapegos";
import MoradorProdutos from "./MoradorProdutos";
import MoradorEncomendas from "./MoradorEncomendas";
import MoradorQrId from "./MoradorQrId";
import MoradorAvaliacoes from "./MoradorAvaliacoes";
import MoradorPerfil from "./MoradorPerfil";

const MoradorDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<MoradorHome />} />
      <Route path="servicos" element={<MoradorServicos />} />
      <Route path="desapegos" element={<MoradorDesapegos />} />
      <Route path="produtos" element={<MoradorProdutos />} />
      <Route path="encomendas" element={<MoradorEncomendas />} />
      <Route path="qr-id" element={<MoradorQrId />} />
      <Route path="avaliacoes" element={<MoradorAvaliacoes />} />
      <Route path="perfil" element={<MoradorPerfil />} />
    </Routes>
  );
};

export default MoradorDashboard;
