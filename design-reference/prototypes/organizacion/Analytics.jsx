/* global React, Button, Pill */
const { useState: useStateOA } = React;

// ══════════════════════════════════════════════════════
//  OrgKpiRow — 5 KPIs específicos de la organización
// ══════════════════════════════════════════════════════
function OrgKpiRow({ org }) {
  const kpis = [
    { label: "Docs este mes",    value: org.metrics.docs,      delta: org.metrics.docsDelta, tone: "cyan", icon: "📄" },
    { label: "Páginas",          value: org.metrics.pages,     delta: org.metrics.pagesDelta, tone: "blue", icon: "📊" },
    { label: "Analistas activos", value: org.metrics.users,    delta: org.metrics.usersDelta, tone: "neutral", icon: "👥" },
    { label: "Validación IA",    value: `${org.metrics.validation}%`, delta: org.metrics.validationDelta, tone: "success", icon: "✓" },
    { label: "Tiempo promedio",  value: org.metrics.avgTime,   delta: org.metrics.timeDelta, tone: "neutral", icon: "⏱" },
  ];
  const tones = {
    cyan:    { bg: "rgba(0,194,203,0.08)",  fg: "#00C2CB" },
    blue:    { bg: "rgba(0,153,255,0.08)",  fg: "#0099FF" },
    success: { bg: "rgba(16,185,129,0.10)", fg: "#10B981" },
    neutral: { bg: "rgba(10,15,30,0.05)",   fg: "#556070" },
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
      {kpis.map(k => {
        const t = tones[k.tone];
        const isNegative = k.delta.startsWith("−") || k.delta.startsWith("-");
        return (
          <div key={k.label} style={{
            background: "#FFFFFF", border: "1px solid rgba(10,15,30,0.08)",
            borderRadius: 14, padding: 16, boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#8494A8" }}>{k.label}</div>
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: t.bg, color: t.fg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13,
              }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.5, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 6, color: isNegative ? "#EF4444" : "#10B981" }}>
              {isNegative ? "▼" : "▲"} {k.delta.replace(/^[−\-+]/, "")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  ToolUsageChart — barras horizontales por herramienta
// ══════════════════════════════════════════════════════
function ToolUsageChart({ org }) {
  const tools = org.toolUsage;
  const max = Math.max(...tools.map(t => t.count));
  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
    }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: org.accent, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 3 }}>
          🔧 Uso por herramienta
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.2 }}>
          Ranking de herramientas · 30 días
        </div>
      </div>
      {tools.map((t, i) => (
        <div key={t.name} style={{ marginBottom: i < tools.length - 1 ? 14 : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5, fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              <span style={{ color: "#2D3A52", fontWeight: 600 }}>{t.name}</span>
            </div>
            <div>
              <span style={{ color: "#0A0F1E", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{t.count.toLocaleString()}</span>
              <span style={{ color: "#8494A8", marginLeft: 6, fontSize: 11 }}>({t.share}%)</span>
            </div>
          </div>
          <div style={{ height: 8, background: "#F6F8FB", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(t.count / max) * 100}%`,
              background: i === 0
                ? `linear-gradient(90deg, ${org.accent}, ${org.accent}88)`
                : `linear-gradient(90deg, ${org.accent}aa, ${org.accent}44)`,
              borderRadius: 4,
              boxShadow: i === 0 ? `0 0 12px ${org.accent}55` : "none",
              transition: "width .5s ease",
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  HourHeatmap — heatmap 7×24 de actividad
// ══════════════════════════════════════════════════════
function HourHeatmap({ org }) {
  // Deterministic pseudo data seeded by org key
  const seed = org.key.charCodeAt(0) + org.key.charCodeAt(1);
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const hours = Array.from({length: 24}, (_, h) => h);
  const data = days.map((_, d) => hours.map(h => {
    if (d >= 5) return Math.max(0, (Math.sin((h + seed) * 0.5) + 1) * 8);  // weekend low
    if (h < 7 || h > 20) return Math.max(0, (Math.sin((h + seed) * 0.3) + 0.3) * 6);
    const peak = h >= 9 && h <= 17 ? 1 : 0.4;
    return (Math.sin((h + d + seed) * 0.7) + 1.2) * 30 * peak;
  }));
  const max = Math.max(...data.flat());

  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
    }}>
      <div style={{ marginBottom: 18, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: org.accent, textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 3 }}>
            🔥 Horas pico
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.2 }}>
            Heatmap de actividad
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#8494A8" }}>
          <span>Menos</span>
          {[0.1, 0.3, 0.5, 0.75, 1].map((o, i) => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: 2, background: `${org.accent}`, opacity: o }}/>
          ))}
          <span>Más</span>
        </div>
      </div>
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "20px repeat(24, 1fr)", gap: 2, marginBottom: 4 }}>
          <div/>
          {hours.map(h => (
            <div key={h} style={{ fontSize: 8, color: "#8494A8", textAlign: "center", lineHeight: 1 }}>
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {data.map((row, di) => (
          <div key={di} style={{ display: "grid", gridTemplateColumns: "20px repeat(24, 1fr)", gap: 2, marginBottom: 2 }}>
            <div style={{ fontSize: 10, color: "#8494A8", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{days[di]}</div>
            {row.map((v, hi) => {
              const opacity = Math.max(0.06, v / max);
              return (
                <div key={hi} style={{
                  aspectRatio: "1",
                  background: org.accent,
                  opacity,
                  borderRadius: 3,
                }} title={`${days[di]} ${hi}h · ${Math.round(v)} docs`}/>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#8494A8", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(10,15,30,0.06)" }}>
        Hora pico: <strong style={{ color: "#0A0F1E" }}>{org.peakHour}</strong> · Día más activo: <strong style={{ color: "#0A0F1E" }}>{org.peakDay}</strong>
      </div>
    </div>
  );
}

Object.assign(window, { OrgKpiRow, ToolUsageChart, HourHeatmap });
