/* global React, Pill, Button */
const { useState: useStateOH } = React;

// ══════════════════════════════════════════════════════
//  OrgHeader — selector de organización + resumen
// ══════════════════════════════════════════════════════
function OrgHeader({ org, onSwitch }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, #0A0F1E 0%, #1A2234 60%, ${org.accent}15 100%)`,
      borderRadius: 20, padding: 28,
      color: "#fff", position: "relative", overflow: "hidden",
      border: `1px solid ${org.accent}40`,
      boxShadow: "0 4px 24px rgba(10,15,30,0.12)",
    }}>
      {/* orb */}
      <div style={{
        position: "absolute", top: -80, right: -60,
        width: 280, height: 280, borderRadius: "50%",
        background: `radial-gradient(circle, ${org.accent}40 0%, transparent 70%)`,
      }}/>
      {/* hairline */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
                    background: `linear-gradient(90deg, transparent, ${org.accent}80, transparent)` }}/>

      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flex: 1, minWidth: 0 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: `linear-gradient(135deg, ${org.accent} 0%, ${org.accent}aa 100%)`,
            color: "#0A0F1E", fontSize: 24, fontWeight: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 32px ${org.accent}66`,
            letterSpacing: -0.8, flexShrink: 0,
          }}>{org.short}</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: org.accent, textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 4 }}>
              Grupo Bolívar · Organización
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, marginBottom: 5, color: "#fff" }}>
              {org.name}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
              {org.description}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <span style={{ fontSize: 10, padding: "3px 10px", background: "rgba(16,185,129,0.18)", color: "#10B981", borderRadius: 999, fontWeight: 700, letterSpacing: 0.6 }}>● ACTIVA</span>
              <span style={{ fontSize: 10, padding: "3px 10px", background: `${org.accent}25`, color: org.accent, borderRadius: 999, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>Plan Enterprise</span>
              <span style={{ fontSize: 10, padding: "3px 10px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", borderRadius: 999, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>ID: {org.id}</span>
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          <OrgSwitcher current={org.key} onSwitch={onSwitch}/>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="dark" size="sm" icon="⚙">Configurar</Button>
            <Button variant="primary" size="sm" icon="⬇">Exportar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgSwitcher({ current, onSwitch }) {
  const orgs = [
    { key: "cb", short: "CB", name: "Constructora Bolívar", accent: "#00C2CB" },
    { key: "dv", short: "DV", name: "Davivienda",           accent: "#0099FF" },
    { key: "sb", short: "SB", name: "Seguros Bolívar",      accent: "#A855F7" },
  ];
  return (
    <div style={{
      display: "flex", background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 3,
    }}>
      {orgs.map(o => {
        const active = o.key === current;
        return (
          <button key={o.key} onClick={() => onSwitch(o.key)} style={{
            background: active ? o.accent : "transparent",
            color: active ? "#0A0F1E" : "rgba(255,255,255,0.7)",
            border: "none", borderRadius: 8,
            padding: "7px 14px", fontSize: 12, fontWeight: 700,
            fontFamily: "inherit", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: active ? `0 0 14px ${o.accent}80` : "none",
            transition: "all .15s",
          }}>
            <span style={{ fontSize: 10, fontWeight: 900 }}>{o.short}</span>
            <span>{o.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  KpiStrip (variante usando accent de la org)
// ══════════════════════════════════════════════════════
function OrgKpiStrip({ org }) {
  const kpis = [
    { label: "Docs este mes",    value: org.docs.toLocaleString(), delta: org.deltaDocs, captionFg: "#10B981", icon: "📄" },
    { label: "Analistas activos", value: String(org.users),        delta: "+3 este mes", captionFg: "#10B981", icon: "👥" },
    { label: "Score promedio",    value: `${org.score}%`,          delta: "+1.2 pts",    captionFg: "#10B981", icon: "✓", accent: true },
    { label: "Tiempo medio",      value: "2m 14s",                  delta: "−18s",        captionFg: "#10B981", icon: "⏱" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
      {kpis.map(k => (
        <div key={k.label} style={{
          background: "#FFFFFF", border: "1px solid rgba(10,15,30,0.08)",
          borderRadius: 14, padding: "16px 18px",
          boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
          position: "relative",
        }}>
          {k.accent && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: org.accent, borderRadius: "14px 14px 0 0",
            }}/>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#8494A8" }}>
              {k.label}
            </div>
            <div style={{ fontSize: 14 }}>{k.icon}</div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: k.accent ? org.accent : "#0A0F1E", letterSpacing: -0.5, lineHeight: 1 }}>{k.value}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: k.captionFg, marginTop: 8 }}>▲ {k.delta.replace(/^[-+−]/, "")}</div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  ToolUsageChart — barras horizontales de herramientas
// ══════════════════════════════════════════════════════
function ToolUsageChart({ accent, data }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 2 }}>
          🛠 Uso por herramienta
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.2 }}>Distribución este mes</div>
      </div>
      {data.map((d, i) => (
        <div key={d.tool} style={{ marginBottom: i < data.length - 1 ? 12 : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
            <span style={{ color: "#2D3A52", fontWeight: 600 }}>{d.icon} {d.tool}</span>
            <span style={{ color: "#0A0F1E", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{d.value.toLocaleString()}</span>
          </div>
          <div style={{ height: 8, background: "#F6F8FB", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              width: `${(d.value / max) * 100}%`,
              height: "100%",
              background: i === 0
                ? `linear-gradient(90deg, ${accent} 0%, ${accent}bb 100%)`
                : `${accent}66`,
              borderRadius: 4,
              boxShadow: i === 0 ? `0 0 12px ${accent}66` : "none",
            }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  ActivityHeatmap — 7 días × 24 horas
// ══════════════════════════════════════════════════════
function ActivityHeatmap({ accent }) {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const hours = [0, 3, 6, 9, 12, 15, 18, 21];
  // 7×24 matrix
  const grid = days.map((_, di) =>
    Array.from({ length: 24 }, (_, hi) => {
      if (di >= 5) return Math.random() * 0.15; // fines de semana bajos
      if (hi < 7 || hi > 20) return Math.random() * 0.2;
      if (hi >= 9 && hi <= 11) return 0.7 + Math.random() * 0.3;
      if (hi >= 14 && hi <= 17) return 0.6 + Math.random() * 0.35;
      return 0.3 + Math.random() * 0.4;
    })
  );
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 2 }}>
          🕒 Actividad por hora
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.2 }}>Última semana · hora local</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: 2, paddingBottom: 20 }}>
          {days.map(d => (
            <div key={d} style={{ fontSize: 10, color: "#8494A8", fontWeight: 600, height: 18, display: "flex", alignItems: "center" }}>{d}</div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div>
            {grid.map((row, di) => (
              <div key={di} style={{ display: "flex", gap: 2, marginBottom: 2, height: 18 }}>
                {row.map((v, hi) => (
                  <div key={hi} title={`${days[di]} ${hi}:00 · ${Math.round(v * 100)}%`} style={{
                    flex: 1,
                    background: v < 0.1 ? "#F6F8FB" :
                                v < 0.3 ? `${accent}25` :
                                v < 0.5 ? `${accent}55` :
                                v < 0.7 ? `${accent}99` :
                                          accent,
                    borderRadius: 3,
                    boxShadow: v > 0.8 ? `0 0 6px ${accent}aa` : "none",
                  }}/>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingLeft: 2 }}>
            {hours.map(h => (
              <div key={h} style={{ fontSize: 9, color: "#8494A8", fontFamily: "'JetBrains Mono', monospace" }}>{String(h).padStart(2,"0")}:00</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 10, color: "#8494A8" }}>
        <span>Menos</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
          <span key={v} style={{ width: 14, height: 10, background: v < 0.2 ? "#F6F8FB" : `${accent}${Math.round(v*99)}`, borderRadius: 2 }}/>
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}

Object.assign(window, { OrgHeader, OrgKpiStrip, ToolUsageChart, ActivityHeatmap });
