import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";

const HERO_CARDS = [
  {
    icon: "✨",
    title: "Nexificar IA",
    description: "Renombra y procesa PDFs masivamente con instrucciones en lenguaje natural",
    color: "#00C2CB",
    href: "/nexificar-ia",
  },
  {
    icon: "⚡",
    title: "Validador IA",
    description: "Valida expedientes con inteligencia artificial y detecta inconsistencias antes de radicar",
    color: "#10B981",
    href: "/validador",
  },
  {
    icon: "📋",
    title: "Nexificar Clásico",
    description: "Ensambla expedientes masivamente usando tu plantilla Excel y archivos ZIP",
    color: "#0099FF",
    href: "/masivo",
  },
];

const HOW_STEPS = [
  { num: "01", title: "Sube tus documentos", desc: "PDF individuales o un ZIP con múltiples archivos" },
  { num: "02", title: "Indica qué hacer",     desc: "Con lenguaje natural o usa una plantilla predefinida" },
  { num: "03", title: "Descarga el resultado", desc: "Documentos procesados y listos para radicar" },
];

const OTHER_TOOLS = [
  { icon: "📄", title: "Nexificar PDFs",   desc: "Une múltiples PDFs en uno solo",   href: "/nexificar-pdfs" },
  { icon: "✂️", title: "Dividir PDF",       desc: "Divide por rango de páginas",       href: "/dividir" },
  { icon: "✏️", title: "Editar PDF",        desc: "Editor visual de páginas",          href: "/editar" },
  { icon: "🗑️", title: "Eliminar Páginas",  desc: "Elimina páginas visualmente",       href: "/eliminar" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <>
      <Topbar supertitle="⚡ NEXA Platform" title="Bienvenido a NEXA ⚡" />
      <div style={{ padding: "40px 40px 80px", display: "flex", flexDirection: "column", gap: 48, maxWidth: 1100 }}>

        {/* Header */}
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#0A0F1E", letterSpacing: -1 }}>
            Bienvenido a NEXA ⚡
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 16, color: "#556070", fontWeight: 400 }}>
            Plataforma inteligente de gestión documental
          </p>
        </div>

        {/* Hero cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {HERO_CARDS.map(card => (
            <div key={card.href} style={{
              background: "#fff", border: `1px solid rgba(10,15,30,0.08)`,
              borderRadius: 20, padding: 28,
              boxShadow: "0 2px 8px rgba(10,15,30,0.06)",
              display: "flex", flexDirection: "column", gap: 16,
              transition: "all .2s",
              cursor: "default",
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${card.color}22`; e.currentTarget.style.borderColor = card.color + "44"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(10,15,30,0.06)"; e.currentTarget.style.borderColor = "rgba(10,15,30,0.08)"; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: card.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                {card.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0A0F1E", marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 13, color: "#556070", lineHeight: 1.6 }}>{card.description}</div>
              </div>
              <button
                onClick={() => navigate(card.href)}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: card.color, color: card.color === "#10B981" ? "#fff" : "#0A0F1E",
                  fontSize: 14, fontWeight: 800, fontFamily: "inherit",
                  cursor: "pointer", alignSelf: "flex-start",
                  boxShadow: `0 4px 14px ${card.color}44`,
                  transition: "opacity .15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                Abrir →
              </button>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 6 }}>Guía rápida</div>
          <h2 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.5 }}>¿Cómo funciona?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {HOW_STEPS.map(step => (
              <div key={step.num} style={{
                background: "#fff", border: "1px solid rgba(10,15,30,0.08)",
                borderRadius: 16, padding: "24px 22px",
                boxShadow: "0 1px 4px rgba(10,15,30,0.05)",
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "rgba(0,194,203,0.2)", letterSpacing: -2, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0A0F1E", marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: "#556070", lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Other tools */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 6 }}>Más herramientas</div>
          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.5 }}>Herramientas disponibles</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {OTHER_TOOLS.map(tool => (
              <div key={tool.href}
                onClick={() => navigate(tool.href)}
                style={{
                  background: "#fff", border: "1px solid rgba(10,15,30,0.08)",
                  borderRadius: 14, padding: "18px 16px",
                  cursor: "pointer", transition: "all .15s",
                  boxShadow: "0 1px 4px rgba(10,15,30,0.05)",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,194,203,0.4)"; e.currentTarget.style.background = "rgba(0,194,203,0.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(10,15,30,0.08)"; e.currentTarget.style.background = "#fff"; }}
              >
                <div style={{ fontSize: 22, marginBottom: 10 }}>{tool.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0A0F1E", marginBottom: 4 }}>{tool.title}</div>
                <div style={{ fontSize: 11, color: "#8494A8", lineHeight: 1.5 }}>{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
