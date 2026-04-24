import { useState } from "react";
import Topbar from "../components/Topbar";

// ── Orgs data ─────────────────────────────────────────
const ORGS = {
  cb: {
    key: "cb", short: "CB", name: "Constructora Bolívar", id: "ORG-CB-001", accent: "#00C2CB",
    description: "División de construcción y desarrollo inmobiliario. Procesa expedientes de lotes, planos, contratos de obra y avalúos.",
    metrics: { docs: "2,847", docsDelta: "+18%", pages: "42.1k", pagesDelta: "+14%", users: 34, usersDelta: "+3", validation: 98.4, validationDelta: "+1.2 pts", avgTime: "22s", timeDelta: "−8%" },
    peakHour: "10:00 – 11:00", peakDay: "Miércoles",
    toolUsage: [
      { name: "Nexíficar Masivo", icon: "🗂️", count: 1842, share: 64 },
      { name: "Validador IA",     icon: "⚡", count: 612,  share: 21 },
      { name: "Editar PDF",       icon: "✏️", count: 248,  share: 9  },
      { name: "Dividir PDF",      icon: "✂️", count: 98,   share: 3  },
      { name: "Eliminar páginas", icon: "🗑️", count: 47,   share: 2  },
    ],
    analysts: [
      { name: "Ana María Rojas",   email: "ana.rojas@cb.com.co",  role: "Líder Expedientes", docs: 342, validation: 98.9, hours: 148, lastActivity: "ahora",      online: true  },
      { name: "Carlos Restrepo",   email: "c.restrepo@cb.com.co", role: "Analista Sr.",       docs: 298, validation: 97.8, hours: 142, lastActivity: "hace 3 min", online: true  },
      { name: "Diana Salazar",     email: "d.salazar@cb.com.co",  role: "Analista Sr.",       docs: 276, validation: 98.2, hours: 136, lastActivity: "hace 12 min", online: true },
      { name: "Julián Pardo",      email: "j.pardo@cb.com.co",    role: "Analista Jr.",       docs: 184, validation: 94.1, hours: 128, lastActivity: "hace 22 min", online: true },
      { name: "Laura Giraldo",     email: "l.giraldo@cb.com.co",  role: "Analista Sr.",       docs: 172, validation: 96.5, hours: 124, lastActivity: "hace 1 h",    online: false },
      { name: "Sofía Arango",      email: "s.arango@cb.com.co",   role: "Revisora",            docs: 132, validation: 99.1, hours: 96,  lastActivity: "hace 34 min", online: true  },
    ],
    feed: [
      { user: "Ana M.",    type: "nexify",   action: "nexificó",          target: "expediente_LT-042",      time: "hace 2 min",  pages: 124, duration: "18s" },
      { user: "Carlos R.", type: "validate", action: "validó con IA",     target: "contrato_vivienda_8821", time: "hace 8 min",  pages: 48 },
      { user: "Diana S.",  type: "split",    action: "dividió",           target: "planos_torre_3.pdf",     time: "hace 14 min", pages: 12 },
      { user: "Julián P.", type: "warn",     action: "reportó inconsistencia en", target: "avaluo_inmueble_77", time: "hace 22 min", detail: "fecha no coincide" },
      { user: "Laura G.",  type: "edit",     action: "editó",             target: "contrato_lote_332",      time: "hace 34 min", pages: 22 },
      { user: "Sofía A.",  type: "validate", action: "validó con IA",     target: "cesion_derechos_19",     time: "hace 41 min", pages: 14 },
    ],
  },
  dv: {
    key: "dv", short: "DV", name: "Davivienda", id: "ORG-DV-002", accent: "#0099FF",
    description: "Banco del Grupo Bolívar. Nexifica hipotecas, pagarés, contratos de crédito y documentación de respaldo para análisis de riesgo.",
    metrics: { docs: "1,956", docsDelta: "+9%", pages: "28.4k", pagesDelta: "+11%", users: 21, usersDelta: "+2", validation: 97.1, validationDelta: "+0.8 pts", avgTime: "28s", timeDelta: "−4%" },
    peakHour: "09:00 – 10:00", peakDay: "Martes",
    toolUsage: [
      { name: "Validador IA",     icon: "⚡", count: 982, share: 50 },
      { name: "Nexíficar Masivo", icon: "🗂️", count: 624, share: 32 },
      { name: "Editar PDF",       icon: "✏️", count: 212, share: 11 },
      { name: "Dividir PDF",      icon: "✂️", count: 98,  share: 5  },
      { name: "Eliminar páginas", icon: "🗑️", count: 40,  share: 2  },
    ],
    analysts: [
      { name: "María Lorena Pinto", email: "m.pinto@davivienda.com",  role: "Líder Riesgo",     docs: 264, validation: 98.4, hours: 146, lastActivity: "hace 5 min",  online: true  },
      { name: "Ricardo Vélez",      email: "r.velez@davivienda.com",  role: "Analista Crédito", docs: 221, validation: 97.2, hours: 138, lastActivity: "hace 19 min", online: true  },
      { name: "Sofía Acosta",       email: "s.acosta@davivienda.com", role: "Analista Sr.",     docs: 198, validation: 96.8, hours: 132, lastActivity: "hace 34 min", online: true  },
      { name: "Verónica Mejía",     email: "v.mejia@davivienda.com",  role: "Revisora",         docs: 142, validation: 98.9, hours: 104, lastActivity: "hace 1 h",    online: false },
      { name: "Andrés Bernal",      email: "a.bernal@davivienda.com", role: "Analista Jr.",     docs: 98,  validation: 92.4, hours: 92,  lastActivity: "hace 2 h",    online: false },
    ],
    feed: [
      { user: "María L.",   type: "validate", action: "validó con IA",   target: "hipoteca_vivienda_2031", time: "hace 5 min",  pages: 86 },
      { user: "Ricardo V.", type: "nexify",   action: "nexificó",         target: "lote_credito_44",        time: "hace 19 min", pages: 48, duration: "22s" },
      { user: "Sofía A.",   type: "edit",     action: "editó",            target: "pagares_abril_2026",     time: "hace 34 min", pages: 18 },
      { user: "Verónica M.", type: "warn",    action: "marcó para revisión", target: "credito_vehiculo_881", time: "hace 52 min", detail: "firma faltante" },
    ],
  },
  sb: {
    key: "sb", short: "SB", name: "Seguros Bolívar", id: "ORG-SB-003", accent: "#A855F7",
    description: "Aseguradora del Grupo Bolívar. Procesa pólizas, siniestros, renovaciones y documentación médica para análisis actuarial.",
    metrics: { docs: "1,408", docsDelta: "+24%", pages: "18.2k", pagesDelta: "+19%", users: 14, usersDelta: "+1", validation: 96.0, validationDelta: "+2.4 pts", avgTime: "31s", timeDelta: "−11%" },
    peakHour: "14:00 – 15:00", peakDay: "Jueves",
    toolUsage: [
      { name: "Editar PDF",       icon: "✏️", count: 584, share: 42 },
      { name: "Validador IA",     icon: "⚡", count: 412, share: 29 },
      { name: "Nexíficar Masivo", icon: "🗂️", count: 268, share: 19 },
      { name: "Dividir PDF",      icon: "✂️", count: 98,  share: 7  },
      { name: "Eliminar páginas", icon: "🗑️", count: 42,  share: 3  },
    ],
    analysts: [
      { name: "Laura Gutiérrez",  email: "l.gutierrez@sb.com.co", role: "Líder Suscripción",    docs: 198, validation: 98.2, hours: 144, lastActivity: "hace 11 min", online: true  },
      { name: "Felipe Torres",    email: "f.torres@sb.com.co",    role: "Analista Siniestros",  docs: 172, validation: 97.0, hours: 138, lastActivity: "hace 27 min", online: true  },
      { name: "Valentina Castro", email: "v.castro@sb.com.co",    role: "Analista Sr.",          docs: 154, validation: 94.8, hours: 132, lastActivity: "hace 38 min", online: true  },
      { name: "Andrés Bedoya",    email: "a.bedoya@sb.com.co",    role: "Analista Jr.",          docs: 128, validation: 93.2, hours: 118, lastActivity: "hace 52 min", online: true  },
      { name: "Camila Ríos",      email: "c.rios@sb.com.co",      role: "Revisora",               docs: 112, validation: 99.4, hours: 98,  lastActivity: "hace 1 h",    online: false },
    ],
    feed: [
      { user: "Laura G.",     type: "edit",     action: "editó",                  target: "poliza_2026_0412",          time: "hace 11 min", pages: 14 },
      { user: "Felipe T.",    type: "validate", action: "validó con IA",           target: "siniestro_auto_332",        time: "hace 27 min", pages: 22 },
      { user: "Valentina C.", type: "warn",     action: "señaló discrepancia en",  target: "poliza_salud_17",           time: "hace 38 min", detail: "diagnóstico no coincide con CIE-10" },
      { user: "Andrés B.",    type: "nexify",   action: "nexificó",                target: "renovaciones_abril_lote_2", time: "hace 52 min", pages: 184, duration: "54s" },
    ],
  },
};

// ── KPI row ───────────────────────────────────────────
function OrgKpiRow({ org }) {
  const kpis = [
    { label: "Docs este mes",      value: org.metrics.docs,       delta: org.metrics.docsDelta,        tone: "cyan",    icon: "📄" },
    { label: "Páginas",            value: org.metrics.pages,      delta: org.metrics.pagesDelta,       tone: "blue",    icon: "📊" },
    { label: "Analistas activos",  value: org.metrics.users,      delta: org.metrics.usersDelta,       tone: "neutral", icon: "👥" },
    { label: "Validación IA",      value: `${org.metrics.validation}%`, delta: org.metrics.validationDelta, tone: "success", icon: "✓" },
    { label: "Tiempo promedio",    value: org.metrics.avgTime,    delta: org.metrics.timeDelta,        tone: "neutral", icon: "⏱" },
  ];
  const tones = { cyan: { bg: "rgba(0,194,203,0.08)", fg: "#00C2CB" }, blue: { bg: "rgba(0,153,255,0.08)", fg: "#0099FF" }, success: { bg: "rgba(16,185,129,0.10)", fg: "#10B981" }, neutral: { bg: "rgba(10,15,30,0.05)", fg: "#556070" } };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
      {kpis.map(k => {
        const t = tones[k.tone];
        const isNeg = k.delta.startsWith("−") || k.delta.startsWith("-");
        return (
          <div key={k.label} style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 14, padding: 16, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#8494A8" }}>{k.label}</div>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: t.bg, color: t.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.5, lineHeight: 1 }}>{String(k.value)}</div>
            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 6, color: isNeg ? "#EF4444" : "#10B981" }}>{isNeg ? "▼" : "▲"} {k.delta.replace(/^[−\-+]/, "")}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tool usage chart ──────────────────────────────────
function ToolUsageChart({ org }) {
  const max = Math.max(...org.toolUsage.map(t => t.count));
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: org.accent, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 3 }}>🔧 Uso por herramienta</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E" }}>Ranking de herramientas · 30 días</div>
      </div>
      {org.toolUsage.map((t, i) => (
        <div key={t.name} style={{ marginBottom: i < org.toolUsage.length - 1 ? 14 : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14 }}>{t.icon}</span><span style={{ color: "#2D3A52", fontWeight: 600 }}>{t.name}</span></div>
            <div><span style={{ color: "#0A0F1E", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{t.count.toLocaleString()}</span><span style={{ color: "#8494A8", marginLeft: 6, fontSize: 11 }}>({t.share}%)</span></div>
          </div>
          <div style={{ height: 8, background: "#F6F8FB", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(t.count / max) * 100}%`, background: i === 0 ? `linear-gradient(90deg, ${org.accent}, ${org.accent}88)` : `linear-gradient(90deg, ${org.accent}aa, ${org.accent}44)`, borderRadius: 4, boxShadow: i === 0 ? `0 0 12px ${org.accent}55` : "none", transition: "width .5s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Heatmap ───────────────────────────────────────────
function HourHeatmap({ org }) {
  const seed = org.key.charCodeAt(0) + org.key.charCodeAt(1);
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const data = days.map((_, d) => hours.map(h => {
    if (d >= 5) return Math.max(0, (Math.sin((h + seed) * 0.5) + 1) * 8);
    if (h < 7 || h > 20) return Math.max(0, (Math.sin((h + seed) * 0.3) + 0.3) * 6);
    const peak = h >= 9 && h <= 17 ? 1 : 0.4;
    return (Math.sin((h + d + seed) * 0.7) + 1.2) * 30 * peak;
  }));
  const max = Math.max(...data.flat());

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ marginBottom: 18, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: org.accent, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 3 }}>🔥 Horas pico</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E" }}>Heatmap de actividad</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#8494A8" }}>
          <span>Menos</span>
          {[0.1, 0.3, 0.5, 0.75, 1].map((o, i) => <span key={i} style={{ width: 12, height: 12, borderRadius: 2, background: org.accent, opacity: o, display: "inline-block" }} />)}
          <span>Más</span>
        </div>
      </div>
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "20px repeat(24, 1fr)", gap: 2, marginBottom: 4 }}>
          <div />
          {hours.map(h => <div key={h} style={{ fontSize: 8, color: "#8494A8", textAlign: "center" }}>{h % 3 === 0 ? h : ""}</div>)}
        </div>
        {data.map((row, di) => (
          <div key={di} style={{ display: "grid", gridTemplateColumns: "20px repeat(24, 1fr)", gap: 2, marginBottom: 2 }}>
            <div style={{ fontSize: 10, color: "#8494A8", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{days[di]}</div>
            {row.map((v, hi) => <div key={hi} style={{ aspectRatio: "1", background: org.accent, opacity: Math.max(0.06, v / max), borderRadius: 3 }} />)}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#8494A8", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(10,15,30,0.06)" }}>
        Hora pico: <strong style={{ color: "#0A0F1E" }}>{org.peakHour}</strong> · Día más activo: <strong style={{ color: "#0A0F1E" }}>{org.peakDay}</strong>
      </div>
    </div>
  );
}

// ── Analysts table ────────────────────────────────────
function AnalystsTable({ org }) {
  const [sortBy, setSortBy] = useState("docs");
  const sorted = [...org.analysts].sort((a, b) => sortBy === "docs" ? b.docs - a.docs : sortBy === "validation" ? b.validation - a.validation : b.hours - a.hours);
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(10,15,30,0.06)" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: org.accent, textTransform: "uppercase", letterSpacing: 1.4 }}>👥 Equipo</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E", marginTop: 2 }}>Analistas — {org.metrics.users} activos</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["docs", "Por docs"], ["validation", "Por calidad"], ["hours", "Por horas"]].map(([k, label]) => (
            <button key={k} onClick={() => setSortBy(k)} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, border: `1px solid ${sortBy === k ? org.accent : "rgba(10,15,30,0.1)"}`, background: sortBy === k ? `${org.accent}14` : "#fff", color: sortBy === k ? org.accent : "#556070", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
          ))}
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{["Analista", "Rol", "Docs", "Validación", "Horas", "Últ. actividad", "Estado"].map(h => <th key={h} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#8494A8", fontWeight: 700, textAlign: "left", padding: "10px 22px", background: "#F6F8FB", borderBottom: "1px solid rgba(10,15,30,0.06)" }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {sorted.map((a, i) => {
            const initials = a.name.split(" ").map(w => w[0]).join("").slice(0, 2);
            return (
              <tr key={a.name} style={{ background: i % 2 ? "rgba(246,248,251,0.4)" : "#fff" }}>
                <td style={{ padding: "12px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${org.accent},${org.accent}99)`, color: "#0A0F1E", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      {initials}
                      {a.online && <span style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: "#10B981", border: "2px solid #fff" }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0A0F1E" }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: "#8494A8" }}>{a.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 22px", fontSize: 12, color: "#556070" }}>{a.role}</td>
                <td style={{ padding: "12px 22px", fontSize: 13, fontWeight: 700, color: "#0A0F1E", fontFamily: "'JetBrains Mono', monospace" }}>{a.docs}</td>
                <td style={{ padding: "12px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: "#F6F8FB", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${a.validation}%`, height: "100%", background: a.validation >= 95 ? "#10B981" : a.validation >= 90 ? "#F59E0B" : "#EF4444", borderRadius: 3 }} /></div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#2D3A52", fontFamily: "'JetBrains Mono', monospace" }}>{a.validation}%</span>
                  </div>
                </td>
                <td style={{ padding: "12px 22px", fontSize: 12, color: "#556070", fontFamily: "'JetBrains Mono', monospace" }}>{a.hours}h</td>
                <td style={{ padding: "12px 22px", fontSize: 11, color: "#8494A8" }}>{a.lastActivity}</td>
                <td style={{ padding: "12px 22px" }}>
                  <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 999, fontWeight: 700, background: a.online ? "rgba(16,185,129,0.1)" : "rgba(132,148,168,0.1)", color: a.online ? "#10B981" : "#8494A8" }}>● {a.online ? "EN LÍNEA" : "OFFLINE"}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Activity feed ─────────────────────────────────────
function ActivityFeed({ org }) {
  const [filter, setFilter] = useState("all");
  const filters = [
    { key: "all", label: "Todo", count: org.feed.length },
    { key: "nexify", label: "Nexificación", count: org.feed.filter(f => f.type === "nexify").length },
    { key: "validate", label: "Validación", count: org.feed.filter(f => f.type === "validate").length },
    { key: "edit", label: "Edición", count: org.feed.filter(f => f.type === "edit").length },
    { key: "warn", label: "Alertas", count: org.feed.filter(f => f.type === "warn").length },
  ];
  const filtered = filter === "all" ? org.feed : org.feed.filter(f => f.type === filter);
  const typeColors = {
    nexify:   { bg: `${org.accent}14`, fg: org.accent, icon: "🗂️" },
    validate: { bg: "rgba(16,185,129,0.1)", fg: "#10B981", icon: "✓" },
    edit:     { bg: "rgba(0,153,255,0.1)",  fg: "#0099FF", icon: "✏️" },
    split:    { bg: "rgba(168,85,247,0.1)", fg: "#A855F7", icon: "✂️" },
    warn:     { bg: "rgba(245,158,11,0.12)", fg: "#F59E0B", icon: "⚠" },
    error:    { bg: "rgba(239,68,68,0.12)",  fg: "#EF4444", icon: "✕" },
  };
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: org.accent, textTransform: "uppercase", letterSpacing: 1.4 }}>⏱ Actividad en vivo</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E", marginTop: 2 }}>Feed de actividad</div>
          </div>
          <span style={{ fontSize: 10, padding: "3px 9px", background: "rgba(16,185,129,0.14)", color: "#10B981", borderRadius: 999, fontWeight: 700 }}>● EN VIVO</span>
        </div>
        <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "5px 10px", fontSize: 11, fontWeight: 600, border: `1px solid ${filter === f.key ? org.accent : "rgba(10,15,30,0.1)"}`, background: filter === f.key ? `${org.accent}14` : "#fff", color: filter === f.key ? org.accent : "#556070", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
              {f.label}
              <span style={{ fontSize: 9, padding: "1px 6px", background: filter === f.key ? org.accent : "rgba(10,15,30,0.06)", color: filter === f.key ? "#fff" : "#8494A8", borderRadius: 10, fontWeight: 700 }}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxHeight: 420, overflowY: "auto", padding: "0 22px 18px" }}>
        {filtered.map((e, i) => {
          const t = typeColors[e.type] || typeColors.nexify;
          return (
            <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < filtered.length - 1 ? "1px solid rgba(10,15,30,0.05)" : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: t.bg, color: t.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: "#2D3A52", lineHeight: 1.5 }}>
                  <strong style={{ color: "#0A0F1E" }}>{e.user}</strong> {e.action}{" "}
                  <span style={{ color: t.fg, fontWeight: 700 }}>{e.target}</span>
                  {e.detail && <span style={{ color: "#8494A8" }}> · {e.detail}</span>}
                </div>
                <div style={{ fontSize: 10.5, color: "#8494A8", marginTop: 3, display: "flex", gap: 10 }}>
                  <span>⏱ {e.time}</span>
                  {e.pages && <span>📄 {e.pages} páginas</span>}
                  {e.duration && <span>⚡ {e.duration}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────
export default function Organizacion() {
  const [activeOrg, setActiveOrg] = useState("cb");
  const org = ORGS[activeOrg];

  const topbarActions = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "#F6F8FB", borderRadius: 9, border: "1px solid rgba(10,15,30,0.06)" }}>
        <span style={{ fontSize: 11, color: "#8494A8", fontWeight: 600 }}>Periodo:</span>
        <span style={{ fontSize: 12, color: "#0A0F1E", fontWeight: 700 }}>Últimos 30 días ▾</span>
      </div>
      <button style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.12)", color: "#556070", padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⬇ Exportar CSV</button>
    </>
  );

  return (
    <>
      <Topbar supertitle={`🏢 Actividad por organización`} title={org.name} actions={topbarActions} />
      <div style={{ padding: "24px 32px 64px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Org header */}
        <div style={{ background: `linear-gradient(135deg, #0A0F1E 0%, #1A2234 60%, ${org.accent}15 100%)`, borderRadius: 20, padding: 28, color: "#fff", position: "relative", overflow: "hidden", border: `1px solid ${org.accent}40`, boxShadow: "0 4px 24px rgba(10,15,30,0.12)" }}>
          <div style={{ position: "absolute", top: -80, right: -60, width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${org.accent}40 0%, transparent 70%)` }} />
          <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flex: 1, minWidth: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: `linear-gradient(135deg,${org.accent},${org.accent}aa)`, color: "#0A0F1E", fontSize: 24, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 32px ${org.accent}66`, flexShrink: 0 }}>{org.short}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: org.accent, textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 4 }}>Grupo Bolívar · Organización</div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, marginBottom: 5 }}>{org.name}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, maxWidth: 560 }}>{org.description}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <span style={{ fontSize: 10, padding: "3px 10px", background: "rgba(16,185,129,0.18)", color: "#10B981", borderRadius: 999, fontWeight: 700 }}>● ACTIVA</span>
                  <span style={{ fontSize: 10, padding: "3px 10px", background: `${org.accent}25`, color: org.accent, borderRadius: 999, fontWeight: 700, textTransform: "uppercase" }}>Plan Enterprise</span>
                  <span style={{ fontSize: 10, padding: "3px 10px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", borderRadius: 999, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>ID: {org.id}</span>
                </div>
              </div>
            </div>
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
              {/* Org switcher */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 3 }}>
                {Object.values(ORGS).map(o => (
                  <button key={o.key} onClick={() => setActiveOrg(o.key)} style={{ background: activeOrg === o.key ? o.accent : "transparent", color: activeOrg === o.key ? "#0A0F1E" : "rgba(255,255,255,0.7)", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: activeOrg === o.key ? `0 0 14px ${o.accent}80` : "none", transition: "all .15s" }}>
                    <span style={{ fontSize: 10, fontWeight: 900 }}>{o.short}</span>
                    <span>{o.name}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⚙ Configurar</button>
                <button style={{ background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 800, cursor: "pointer", border: "none", fontFamily: "inherit" }}>⬇ Exportar</button>
              </div>
            </div>
          </div>
        </div>

        <OrgKpiRow org={org} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <ToolUsageChart org={org} />
          <HourHeatmap org={org} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 20 }}>
          <AnalystsTable org={org} />
          <ActivityFeed org={org} />
        </div>
      </div>
    </>
  );
}
