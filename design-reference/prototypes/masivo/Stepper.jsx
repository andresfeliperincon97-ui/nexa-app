/* global React */
const { useState: useStateNM2 } = React;

// ══════════════════════════════════════════════════════
//  ExpandedStepper — stepper grande con estado + sub-info
// ══════════════════════════════════════════════════════
function ExpandedStepper({ current, onJump }) {
  const steps = [
    { key: "upload",  num: 1, title: "Cargar archivos",    sub: "Excel + ZIPs con PDFs",          icon: "📤" },
    { key: "detect",  num: 2, title: "Detectar filas",     sub: "42 filas · 1,284 PDFs",          icon: "🔍" },
    { key: "map",     num: 3, title: "Mapear columnas",    sub: "Excel → plantilla",               icon: "🔗" },
    { key: "preview", num: 4, title: "Vista previa",       sub: "Expediente de ejemplo",           icon: "👁" },
    { key: "run",     num: 5, title: "Ejecutar",           sub: "Procesar + validar IA",           icon: "🚀" },
    { key: "done",    num: 6, title: "Descargar ZIP",      sub: "42 expedientes listos",           icon: "📦" },
  ];
  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
      display: "flex", alignItems: "stretch", gap: 0,
    }}>
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "idle";
        const bg = state === "idle" ? "#F6F8FB" : "linear-gradient(135deg,#00C2CB,#0099FF)";
        const color = state === "idle" ? "#8494A8" : "#0A0F1E";
        const shadow =
          state === "active" ? "0 0 20px rgba(0,194,203,0.6)" :
          state === "done" ? "0 0 14px rgba(0,194,203,0.35)" : "none";
        return (
          <React.Fragment key={s.key}>
            <div onClick={() => onJump?.(i)} style={{
              flex: 1, cursor: "pointer", textAlign: "center",
              opacity: state === "idle" ? 0.55 : 1, transition: "opacity .2s",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 800,
                background: bg, color,
                boxShadow: shadow,
                border: state === "idle" ? "2px solid rgba(10,15,30,0.08)" : "none",
                animation: state === "active" ? "nx-pulse 2s infinite" : "none",
              }}>
                {state === "done" ? "✓" : s.icon}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 800, letterSpacing: -0.1,
                color: state === "idle" ? "#8494A8" : state === "active" ? "#00C2CB" : "#0A0F1E",
                marginBottom: 3,
              }}>{s.num}. {s.title}</div>
              <div style={{ fontSize: 10.5, color: "#8494A8", lineHeight: 1.3 }}>{s.sub}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 24, display: "flex", alignItems: "center", paddingTop: 20 }}>
                <div style={{
                  flex: 1, height: 2, borderRadius: 2,
                  background: i < current ? "linear-gradient(90deg,#00C2CB,#0099FF)" : "rgba(10,15,30,0.08)",
                }}/>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

Object.assign(window, { ExpandedStepper });
