import { Routes, Route, Navigate } from "react-router-dom";
import MoradorHome from "./MoradorHome";
import MoradorServicos from "./MoradorServicos";
import MoradorServicosCategorias from "./MoradorServicosCategorias";
import MoradorDesapegos from "./MoradorDesapegos";
import MoradorDesapegoDetalhe from "./MoradorDesapegoDetalhe";
import MoradorProdutos from "./MoradorProdutos";
import MoradorProdutoDetalhe from "./MoradorProdutoDetalhe";
import MoradorEncomendas from "./MoradorEncomendas";
import MoradorQrId from "./MoradorQrId";
import MoradorAvaliacoes from "./MoradorAvaliacoes";
import MoradorPerfil from "./MoradorPerfil";
import MoradorReservas from "./MoradorReservas";
import MoradorConvites from "./MoradorConvites";

const MoradorDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<MoradorHome />} />
      <Route path="servicos" element={<MoradorServicos />} />
      <Route path="servicos/categorias" element={<MoradorServicosCategorias />} />
      <Route path="desapegos" element={<MoradorDesapegos />} />
      <Route path="desapegos/:id" element={<MoradorDesapegoDetalhe />} />
      <Route path="produtos" element={<MoradorProdutos />} />
      <Route path="produtos/:id" element={<MoradorProdutoDetalhe />} />
      <Route path="encomendas" element={<MoradorEncomendas />} />
      <Route path="qr-id" element={<MoradorQrId />} />
      <Route path="avaliacoes" element={<MoradorAvaliacoes />} />
      <Route path="perfil" element={<MoradorPerfil />} />
      <Route path="reservas" element={<MoradorReservas />} />
      <Route path="convites" element={<MoradorConvites />} />
    </Routes>
  );
};

export default MoradorDashboard;
