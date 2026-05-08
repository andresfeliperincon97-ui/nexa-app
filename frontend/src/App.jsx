import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import NexificarMasivo from "./pages/NexificarMasivo";
import NexificarIA from "./pages/NexificarIA";
import NexificarPDFs from "./pages/NexificarPDFs";
import ValidadorIA from "./pages/ValidadorIA";
import Organizacion from "./pages/Organizacion";

function PlaceholderPage({ title, icon }) {
  return (
    <div style={{ padding: "48px 32px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#0A0F1E", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: "#8494A8" }}>Esta sección estará disponible próximamente.</div>
    </div>
  );
}

function AppLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#F6F8FB" }}>
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/masivo"       element={<NexificarMasivo />} />
          <Route path="/nexificar-ia" element={<NexificarIA />} />
          <Route path="/validador"    element={<ValidadorIA />} />
          <Route path="/organizacion" element={<Organizacion />} />
          <Route path="/nexificar-pdfs" element={<NexificarPDFs />} />
          <Route path="/pdfs"         element={<PlaceholderPage title="Nexíficar PDFs" icon="📄" />} />
          <Route path="/dividir"      element={<PlaceholderPage title="Dividir PDF" icon="✂️" />} />
          <Route path="/editar"       element={<PlaceholderPage title="Editar PDF" icon="✏️" />} />
          <Route path="/eliminar"     element={<PlaceholderPage title="Eliminar Páginas" icon="🗑️" />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
