/* global React, Pill, Button */
const { useState: useStateOR } = React;

// ══════════════════════════════════════════════════════
//  AnalystsTable — lista de analistas con métricas
// ══════════════════════════════════════════════════════
function AnalystsTable({ org }) {
  const [sortBy, setSortBy] = useStateOR("docs");
  const sorted = [...org.analysts].sort((a, b) => {
    if (sortBy === "docs") return b.docs - a.docs;
    if (sortBy === "validation") return b.validation - a.validation;
    if (sortBy === "hours") return b.hours - a.hours;
    return 0;
  });

  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
    }}>
      <div style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(10,15,30,0.06)" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: org.accent, textTransform: "uppercase", letterSpacing: 1.4 }}>
            👥 Equipo
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E", marginTop: 2 }}>
            Analistas — {org.metrics.users} activos
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["docs","Por docs"],["validation","Por calidad"],["hours","Por horas"]].map(([k, label]) => (
            <button key={k} onClick={() => setSortBy(k)} style={{
              padding: "6px 12px", fontSize: 11, fontWeight: 700,
              border: `1px solid ${sortBy === k ? org.accent : "rgba(10,15,30,0.1)"}`,
              background: sortBy === k ? `${org.accent}14` : "#fff",
              color: sortBy === k ? org.accent : "#556070",
              borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Analista", "Rol", "Docs", "Validación", "Horas", "Últ. actividad", "Estado"].map(h =>
              <th key={h} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#8494A8", fontWeight: 700, textAlign: "left", padding: "10px 22px", background: "#F6F8FB", borderBottom: "1px solid rgba(10,15,30,0.06)" }}>{h}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((a, i) => (
            <tr key={a.name} style={{ background: i % 2 ? "rgba(246,248,251,0.4)" : "#fff" }}>
              <td style={{ padding: "12px 22px", fontSize: 13, color: "#0A0F1E" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${org.accent}, ${org.accent}99)`,
                    color: "#0A0F1E", fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                  }}>
                    {a.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    {a.online && <span style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 9, height: 9, borderRadius: "50%",
                      background: "#10B981", border: "2px solid #fff",
                    }}/>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: "#8494A8" }}>{a.email}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: "12px 22px", fontSize: 12, color: "#556070" }}>{a.role}</td>
              <td style={{ padding: "12px 22px", fontSize: 13, fontWeight: 700, color: "#0A0F1E", fontFamily: "'JetBrains Mono', monospace" }}>{a.docs}</td>
              <td style={{ padding: "12px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 60, height: 6, background: "#F6F8FB", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${a.validation}%`, height: "100%", background: a.validation >= 95 ? "#10B981" : a.validation >= 90 ? "#F59E0B" : "#EF4444", borderRadius: 3 }}/>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2D3A52", fontFamily: "'JetBrains Mono', monospace" }}>{a.validation}%</span>
                </div>
              </td>
              <td style={{ padding: "12px 22px", fontSize: 12, color: "#556070", fontFamily: "'JetBrains Mono', monospace" }}>{a.hours}h</td>
              <td style={{ padding: "12px 22px", fontSize: 11, color: "#8494A8" }}>{a.lastActivity}</td>
              <td style={{ padding: "12px 22px" }}>
                <span style={{
                  fontSize: 10, padding: "3px 9px", borderRadius: 999, fontWeight: 700, letterSpacing: 0.5,
                  background: a.online ? "rgba(16,185,129,0.1)" : "rgba(132,148,168,0.1)",
                  color: a.online ? "#10B981" : "#8494A8",
                }}>● {a.online ? "EN LÍNEA" : "OFFLINE"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  ActivityFeed — feed detallado en tiempo real
// ══════════════════════════════════════════════════════
function ActivityFeed({ org }) {
  const [filter, setFilter] = useStateOR("all");
  const filters = [
    { key: "all",      label: "Todo",         count: org.feed.length },
    { key: "nexify",   label: "Nexificación", count: org.feed.filter(f => f.type === "nexify").length },
    { key: "validate", label: "Validación",   count: org.feed.filter(f => f.type === "validate").length },
    { key: "edit",     label: "Edición",      count: org.feed.filter(f => f.type === "edit").length },
    { key: "warn",     label: "Alertas",      count: org.feed.filter(f => f.type === "warn").length },
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
    <div style={{
      background: "#FFFFFF", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 16, boxShadow: "0 1px 3px rgba(10,15,30,0.06)", height: "fit-content",
    }}>
      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: org.accent, textTransform: "uppercase", letterSpacing: 1.4 }}>
              ⏱ Actividad en vivo
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0F1E", marginTop: 2 }}>
              Feed de actividad
            </div>
          </div>
          <span style={{ fontSize: 10, padding: "3px 9px", background: "rgba(16,185,129,0.14)", color: "#10B981", borderRadius: 999, fontWeight: 700, letterSpacing: 0.6 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#10B981", marginRight: 5, animation: "nx-pulse 1.5s infinite" }}/>
            EN VIVO
          </span>
        </div>

        <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: "5px 10px", fontSize: 11, fontWeight: 600,
              border: `1px solid ${filter === f.key ? org.accent : "rgba(10,15,30,0.1)"}`,
              background: filter === f.key ? `${org.accent}14` : "#fff",
              color: filter === f.key ? org.accent : "#556070",
              borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              {f.label}
              <span style={{ fontSize: 9, padding: "1px 6px", background: filter === f.key ? org.accent : "rgba(10,15,30,0.06)", color: filter === f.key ? "#fff" : "#8494A8", borderRadius: 10, fontWeight: 700 }}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxHeight: 680, overflowY: "auto", padding: "0 22px 18px" }}>
        {filtered.map((e, i) => {
          const t = typeColors[e.type];
          return (
            <div key={i} style={{
              display: "flex", gap: 12,
              padding: "12px 0",
              borderBottom: i < filtered.length - 1 ? "1px solid rgba(10,15,30,0.05)" : "none",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: t.bg, color: t.fg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, flexShrink: 0,
              }}>{t.icon}</div>
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

Object.assign(window, { AnalystsTable, ActivityFeed });
