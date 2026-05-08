import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import { getStats } from "../services/api";

// ── Static fallback KPIs ───────────────────────────────
const FALLBACK_STATS = {
  documentos_mes: 6211,
  paginas_procesadas: 88700,
  expedientes_nexificados: 2847,
  score_validacion: 97.8,
  tiempo_promedio: 22,
  analistas_activos: 69,
};

function buildKpis(stats) {
  const fmt = (n) => n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString("es-CO");
  return [
    { label: "Documentos este mes",      value: fmt(stats.documentos_mes),          delta: "+18%", tone: "cyan",    icon: "📄" },
    { label: "Páginas procesadas",        value: fmt(stats.paginas_procesadas),       delta: "+14%", tone: "blue",    icon: "📊" },
    { label: "Expedientes nexificados",   value: fmt(stats.expedientes_nexificados),  delta: "+21%", tone: "purple",  icon: "🗂️" },
    { label: "Score de validación",       value: `${stats.score_validacion}%`,        delta: "+1.2", tone: "success", icon: "⚡" },
    { label: "Tiempo promedio",           value: `${stats.tiempo_promedio}s`,         delta: "−8%",  tone: "neutral", icon: "⏱" },
    { label: "Analistas activos",         value: String(stats.analistas_activos),     delta: "+3",   tone: "neutral", icon: "👥" },
  ];
}

const TONES = {
  cyan:    { bg: "rgba(0,194,203,0.08)",  fg: "#00C2CB", bar: "#00C2CB" },
  blue:    { bg: "rgba(0,153,255,0.08)",  fg: "#0099FF", bar: "#0099FF" },
  purple:  { bg: "rgba(168,85,247,0.08)", fg: "#A855F7", bar: "#A855F7" },
  success: { bg: "rgba(16,185,129,0.10)", fg: "#10B981", bar: "#10B981" },
  neutral: { bg: "rgba(10,15,30,0.05)",   fg: "#556070", bar: "#556070" },
};

// ── Volume chart mock ─────────────────────────────────
const VOLUME_DATA = [
  { label: "10 Abr", value: 320 },
  { label: "11 Abr", value: 440 },
  { label: "12 Abr", value: 380 },
  { label: "13 Abr", value: 510 },
  { label: "14 Abr", value: 460 },
  { label: "15 Abr", value: 200 },
  { label: "16 Abr", value: 180 },
  { label: "17 Abr", value: 490 },
  { label: "18 Abr", value: 530 },
  { label: "19 Abr", value: 480 },
  { label: "20 Abr", value: 611 },
  { label: "21 Abr", value: 542 },
  { label: "22 Abr", value: 498 },
  { label: "23 Abr", value: 621 },
];

const DOC_ROWS = [
  { id: "EXP-2026-042", org: "CB", analyst: "Ana María Rojas",    tool: "Nexíficar Masivo", pages: 124, score: 97, status: "ok",   date: "hace 2 min" },
  { id: "EXP-2026-041", org: "CB", analyst: "Carlos Restrepo",    tool: "Validador IA",     pages: 48,  score: 94, status: "warn", date: "hace 8 min" },
  { id: "HIP-2026-031", org: "DV", analyst: "María Lorena Pinto", tool: "Validador IA",     pages: 86,  score: 99, status: "ok",   date: "hace 14 min" },
  { id: "POL-2026-017", org: "SB", analyst: "Laura Gutiérrez",    tool: "Editar PDF",       pages: 14,  score: 96, status: "ok",   date: "hace 22 min" },
  { id: "EXP-2026-040", org: "CB", analyst: "Diana Salazar",      tool: "Dividir PDF",      pages: 12,  score: null, status: "ok", date: "hace 34 min" },
  { id: "CRE-2026-044", org: "DV", analyst: "Ricardo Vélez",      tool: "Nexíficar Masivo", pages: 48,  score: 92, status: "warn", date: "hace 41 min" },
];

const QUICK_ACTIONS = [
  { key: "/masivo",    icon: "🗂️", title: "Nexíficar Masivo", desc: "Ensambla expedientes desde Excel + ZIP", color: "#00C2CB" },
  { key: "/validador", icon: "⚡", title: "Validador IA",     desc: "Revisa PDFs con inteligencia artificial", color: "#10B981" },
  { key: "/pdfs",      icon: "📄", title: "Nexíficar PDFs",   desc: "Une múltiples PDFs en uno",               color: "#0099FF" },
  { key: "/dividir",   icon: "✂️", title: "Dividir PDF",      desc: "Divide por rango de páginas",             color: "#A855F7" },
];

// ── Sub-components ─────────────────────────────────────
function NxButton({ variant = "primary", icon, onClick, children, style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 700,
    fontFamily: "inherit", cursor: "pointer", border: "none",
    transition: "all .15s", ...style,
  };
  const variants = {
    primary:   { background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", boxShadow: "0 4px 14px rgba(0,194,203,0.3)" },
    secondary: { background: "transparent", color: "#556070", border: "1px solid rgba(10,15,30,0.12)" },
    ghost:     { background: "rgba(10,15,30,0.04)", color: "#556070", border: "1px solid transparent" },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

function KpiCard({ kpi, loading }) {
  const t = TONES[kpi.tone];
  const isNeg = kpi.delta.startsWith("−") || kpi.delta.startsWith("-");
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 16, padding: "18px 20px",
      boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#8494A8" }}>{kpi.label}</div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: t.bg, color: t.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{kpi.icon}</div>
      </div>
      {loading ? (
        <div style={{ height: 26, width: "60%", background: "rgba(10,15,30,0.06)", borderRadius: 6, animation: "nx-pulse 1.5s infinite" }} />
      ) : (
        <div style={{ fontSize: 26, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.5, lineHeight: 1 }}>{kpi.value}</div>
      )}
      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8, color: isNeg ? "#EF4444" : "#10B981" }}>
        {isNeg ? "▼" : "▲"} {kpi.delta.replace(/^[−\-+]/, "")} vs. mes anterior
      </div>
    </div>
  );
}

function ValidadorSpotlight({ onOpen }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0A0F1E 0%, #1A2234 60%, rgba(0,194,203,0.08) 100%)",
      borderRadius: 20, padding: 28, color: "#fff",
      border: "1px solid rgba(0,194,203,0.25)",
      boxShadow: "0 4px 24px rgba(10,15,30,0.12)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -80, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,194,203,0.3) 0%, transparent 70%)" }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "linear-gradient(135deg,#00C2CB,#0099FF)",
            color: "#0A0F1E", fontSize: 28, fontWeight: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 32px rgba(0,194,203,0.6)",
            animation: "nx-pulse 3s infinite",
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 4 }}>
              Validador IA · Claude Sonnet 4.6
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>
              Valida expedientes con inteligencia artificial
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
              Detecta inconsistencias, verifica firmas, analiza OCR y conversa con el documento.
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <NxButton variant="primary" icon="⚡" onClick={onOpen} style={{ fontSize: 14, padding: "12px 24px" }}>
            Abrir Validador IA
          </NxButton>
        </div>
      </div>
    </div>
  );
}

function VolumeChart() {
  const max = Math.max(...VOLUME_DATA.map(d => d.value));
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 2 }}>
          📈 Volumen de procesamiento
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E" }}>Documentos por día · últimos 14 días</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
        {VOLUME_DATA.map((d, i) => {
          const h = Math.round((d.value / max) * 120);
          const isLast = i === VOLUME_DATA.length - 1;
          return (
            <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: "100%", height: h,
                background: isLast ? "linear-gradient(180deg,#00C2CB,#0099FF)" : "rgba(0,194,203,0.25)",
                borderRadius: "4px 4px 0 0",
                boxShadow: isLast ? "0 0 12px rgba(0,194,203,0.5)" : "none",
                transition: "height .3s",
              }} />
              <div style={{ fontSize: 8, color: "#8494A8", transform: "rotate(-30deg)", transformOrigin: "top center", whiteSpace: "nowrap" }}>{d.label.split(" ")[0]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActions({ onNavigate }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 2 }}>🚀 Acceso rápido</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E" }}>Herramientas principales</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {QUICK_ACTIONS.map(a => (
          <div key={a.key} onClick={() => onNavigate(a.key)} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", borderRadius: 12,
            border: "1px solid rgba(10,15,30,0.08)",
            cursor: "pointer", transition: "all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = a.color + "44"; e.currentTarget.style.background = a.color + "08"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(10,15,30,0.08)"; e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: a.color + "18", color: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {a.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0A0F1E" }}>{a.title}</div>
              <div style={{ fontSize: 11, color: "#8494A8" }}>{a.desc}</div>
            </div>
            <div style={{ color: "#8494A8", fontSize: 16 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocTable() {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(10,15,30,0.06)" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4 }}>📋 Actividad reciente</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E", marginTop: 2 }}>Últimos expedientes procesados</div>
        </div>
        <NxButton variant="ghost" icon="⬇">Exportar CSV</NxButton>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["Expediente", "Organización", "Analista", "Herramienta", "Páginas", "Score IA", "Estado", "Hace"].map(h => (
              <th key={h} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#8494A8", fontWeight: 700, textAlign: "left", padding: "10px 18px", background: "#F6F8FB", borderBottom: "1px solid rgba(10,15,30,0.06)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DOC_ROWS.map((row, i) => (
            <tr key={row.id} style={{ background: i % 2 ? "rgba(246,248,251,0.4)" : "#fff" }}>
              <td style={{ padding: "11px 18px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "#00C2CB" }}>{row.id}</td>
              <td style={{ padding: "11px 18px" }}>
                <span style={{ fontSize: 11, padding: "2px 8px", background: row.org === "CB" ? "rgba(0,194,203,0.1)" : row.org === "DV" ? "rgba(0,153,255,0.1)" : "rgba(168,85,247,0.1)", color: row.org === "CB" ? "#00C2CB" : row.org === "DV" ? "#0099FF" : "#A855F7", borderRadius: 6, fontWeight: 700 }}>{row.org}</span>
              </td>
              <td style={{ padding: "11px 18px", color: "#2D3A52", fontWeight: 600 }}>{row.analyst}</td>
              <td style={{ padding: "11px 18px", color: "#556070", fontSize: 12 }}>{row.tool}</td>
              <td style={{ padding: "11px 18px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#2D3A52" }}>{row.pages}</td>
              <td style={{ padding: "11px 18px" }}>
                {row.score ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 48, height: 5, background: "#F6F8FB", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${row.score}%`, height: "100%", background: row.score >= 95 ? "#10B981" : row.score >= 85 ? "#00C2CB" : "#F59E0B", borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0A0F1E", fontFamily: "'JetBrains Mono', monospace" }}>{row.score}%</span>
                  </div>
                ) : <span style={{ color: "#8494A8", fontSize: 11 }}>—</span>}
              </td>
              <td style={{ padding: "11px 18px" }}>
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 999, fontWeight: 700,
                  background: row.status === "ok" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                  color: row.status === "ok" ? "#10B981" : "#F59E0B",
                }}>
                  {row.status === "ok" ? "✓ OK" : "⚠ Revisar"}
                </span>
              </td>
              <td style={{ padding: "11px 18px", fontSize: 11, color: "#8494A8" }}>{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(data => setStats(data))
      .catch(() => {/* silently use fallback */})
      .finally(() => setStatsLoading(false));
  }, []);

  const kpiData = buildKpis(stats);

  const topbarActions = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "#F6F8FB", borderRadius: 9, border: "1px solid rgba(10,15,30,0.06)" }}>
        <span style={{ fontSize: 11, color: "#8494A8", fontWeight: 600 }}>Periodo:</span>
        <span style={{ fontSize: 12, color: "#0A0F1E", fontWeight: 700 }}>Últimos 14 días ▾</span>
      </div>
      <input placeholder="Buscar expediente… ⌘K" style={{
        width: 220, height: 36, padding: "0 14px",
        borderRadius: 9, border: "1px solid rgba(10,15,30,0.1)",
        background: "#F6F8FB", fontSize: 13, fontFamily: "inherit",
        color: "#0A0F1E", outline: "none",
      }} />
    </>
  );

  return (
    <>
      <Topbar supertitle="⚡ NEXA Platform · Dashboard" title="Buenos días, Ana María 👋" actions={topbarActions} />
      <div style={{ padding: "24px 32px 64px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.5 }}>Resumen del Grupo Bolívar</div>
            <div style={{ fontSize: 13, color: "#556070", marginTop: 4 }}>
              Jueves 23 de abril · <strong style={{ color: "#00C2CB" }}>{stats.analistas_activos} analistas</strong> conectados en 3 organizaciones
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <NxButton variant="secondary" icon="⬇">Exportar reporte</NxButton>
            <NxButton variant="primary" icon="＋" onClick={() => navigate("/masivo")}>Nuevo expediente</NxButton>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 14 }}>
          {kpiData.map(k => <KpiCard key={k.label} kpi={k} loading={statsLoading} />)}
        </div>

        {/* Validador spotlight */}
        <ValidadorSpotlight onOpen={() => navigate("/validador")} />

        {/* Charts + Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
          <VolumeChart />
          <QuickActions onNavigate={navigate} />
        </div>

        {/* Doc table */}
        <DocTable />
      </div>
    </>
  );
}
