import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { key: "/",           icon: "◈",  name: "Dashboard",         desc: "Vista general" },
  { key: "/masivo",       icon: "🗂️", name: "Nexíficar Masivo",  desc: "Excel + ZIP" },
  { key: "/nexificar-ia", icon: "✨", name: "Nexificar IA",      desc: "Con lenguaje natural" },
  { key: "/pdfs",         icon: "📄", name: "Nexíficar PDFs",    desc: "Une múltiples" },
  { key: "/dividir",    icon: "✂️", name: "Dividir PDF",         desc: "Por páginas" },
  { key: "/editar",     icon: "✏️", name: "Editar PDF",          desc: "Editor visual" },
  { key: "/eliminar",   icon: "🗑️", name: "Eliminar Páginas",    desc: "Visualmente" },
  { key: "/validador",  icon: "⚡", name: "Validador IA",        desc: "Revisar con IA" },
];

const ORGS = [
  { short: "CB", name: "Constructora Bolívar", accent: "#00C2CB", count: 34 },
  { short: "DV", name: "Davivienda",            accent: "#0099FF", count: 21 },
  { short: "SB", name: "Seguros Bolívar",        accent: "#A855F7", count: 14 },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside style={{
      width: 240, minWidth: 240, background: "#0A0F1E",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg,#00C2CB 0%,#0099FF 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#0A0F1E", fontSize: 14, fontWeight: 900,
            boxShadow: "0 0 18px rgba(0,194,203,0.5)",
          }}>NX</div>
          <div>
            <div style={{
              fontSize: 18, fontWeight: 900, letterSpacing: -0.5,
              background: "linear-gradient(135deg,#00C2CB,#66E0E4)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>NEXA</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 1 }}>
              Grupo Bolívar
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "18px 12px", overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2, padding: "0 8px 10px" }}>
          Menú principal
        </div>
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.key;
          return (
            <div
              key={item.key}
              onClick={() => navigate(item.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 10,
                marginBottom: 2, cursor: "pointer",
                background: isActive ? "rgba(0,194,203,0.12)" : "transparent",
                border: isActive ? "1px solid rgba(0,194,203,0.3)" : "1px solid transparent",
                transition: "all .15s",
              }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                background: isActive ? "linear-gradient(135deg,#00C2CB,#0099FF)" : "rgba(255,255,255,0.04)",
              }}>{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#fff" : "#C8D1E0" }}>{item.name}</div>
                {item.desc && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{item.desc}</div>}
              </div>
              {isActive && (
                <div style={{ width: 4, height: 22, borderRadius: 4, background: "#00C2CB", boxShadow: "0 0 10px rgba(0,194,203,0.7)" }} />
              )}
            </div>
          );
        })}

        {/* Orgs section */}
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2, padding: "18px 8px 10px" }}>
          🏢 Organizaciones
        </div>
        {ORGS.map(org => (
          <div key={org.short} onClick={() => navigate("/organizacion")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 7, cursor: "pointer" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: org.accent, color: "#0A0F1E", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{org.short}</div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 11, color: "#C8D1E0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.name}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>{org.count}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 16px 18px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 10 }}>
        NEXA © 2026 · Grupo Bolívar
      </div>
    </aside>
  );
}
