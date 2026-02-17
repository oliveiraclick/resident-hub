import { Routes, Route } from "react-router-dom";
import PorteiroScanner from "./PorteiroScanner";

const PorteiroDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<PorteiroScanner />} />
    </Routes>
  );
};

export default PorteiroDashboard;
