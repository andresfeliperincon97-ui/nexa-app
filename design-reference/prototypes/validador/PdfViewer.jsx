/* global React, Pill, Button */
const { useState: useStateVL } = React;

// ══════════════════════════════════════════════════════
//  PdfViewer — visor con anotaciones IA sobre páginas
// ══════════════════════════════════════════════════════
function PdfViewer({ currentPage, setCurrentPage, annotations }) {
  const totalPages = 48;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#2D3A52" }}>
      {/* Toolbar */}
      <div style={{
        height: 48, background: "#1A2234",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", color: "#fff", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ToolBtn icon="◀" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}/>
            <div style={{
              background: "rgba(255,255,255,0.06)", borderRadius: 7,
              padding: "4px 12px", fontSize: 12, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace", color: "#fff",
              minWidth: 78, textAlign: "center",
            }}>
              <span style={{ color: "#00C2CB" }}>{String(currentPage).padStart(2, "0")}</span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}> / {totalPages}</span>
            </div>
            <ToolBtn icon="▶" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}/>
          </div>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }}/>
          <ToolBtn icon="−" label="Zoom out"/>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace", minWidth: 42, textAlign: "center" }}>100%</div>
          <ToolBtn icon="+" label="Zoom in"/>
          <ToolBtn icon="⛶" label="Fit"/>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>expediente_042.pdf</div>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }}/>
          <ToolBtn icon="⤓" label="Descargar"/>
          <ToolBtn icon="⌕" label="Buscar"/>
          <ToolBtn icon="⚡" label="Re-validar" tone="accent"/>
        </div>
      </div>

      {/* Page area */}
      <div style={{
        flex: 1, overflow: "auto",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "28px 0",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}>
        <PdfPage page={currentPage} annotations={annotations[currentPage] || []}/>
      </div>

      {/* Thumbnail strip */}
      <div style={{
        height: 88, background: "#1A2234",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 8, padding: "10px 16px",
        overflowX: "auto", flexShrink: 0,
      }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const page = i + 1;
          const isActive = page === currentPage;
          const hasIssue = annotations[page]?.length > 0;
          return (
            <div key={page} onClick={() => setCurrentPage(page)} style={{
              flexShrink: 0, width: 50, aspectRatio: "0.77",
              background: "#fff", borderRadius: 5, cursor: "pointer",
              border: isActive ? "2px solid #00C2CB" : "1px solid rgba(255,255,255,0.12)",
              boxShadow: isActive ? "0 0 14px rgba(0,194,203,0.5)" : "none",
              position: "relative", padding: 4,
              transition: "all .15s",
            }}>
              <div style={{
                height: "100%", width: "100%",
                backgroundImage: "repeating-linear-gradient(180deg,transparent 0 4px,rgba(10,15,30,0.12) 4px 5px)",
                backgroundPosition: "0 6px",
              }}/>
              <div style={{
                position: "absolute", bottom: -16, left: 0, right: 0,
                textAlign: "center", fontSize: 9, fontWeight: 700,
                color: isActive ? "#00C2CB" : "rgba(255,255,255,0.5)",
              }}>{page}</div>
              {hasIssue && (
                <div style={{
                  position: "absolute", top: -4, right: -4,
                  width: 14, height: 14, borderRadius: "50%",
                  background: "#F59E0B", color: "#0A0F1E",
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 2px #1A2234",
                }}>!</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToolBtn({ icon, label, tone, onClick }) {
  const [hover, setHover] = useStateVL(false);
  const bg = tone === "accent"
    ? (hover ? "linear-gradient(135deg,#00C2CB,#0099FF)" : "rgba(0,194,203,0.15)")
    : (hover ? "rgba(255,255,255,0.1)" : "transparent");
  const color = tone === "accent"
    ? (hover ? "#0A0F1E" : "#00C2CB")
    : "rgba(255,255,255,0.75)";
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        width: 30, height: 30, borderRadius: 7, border: "none",
        background: bg, color, fontSize: 14, fontWeight: 700,
        cursor: "pointer", transition: "all .15s",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</button>
  );
}

// ══════════════════════════════════════════════════════
//  PdfPage — ilustración de página con anotaciones
// ══════════════════════════════════════════════════════
function PdfPage({ page, annotations }) {
  return (
    <div style={{
      width: 600, background: "#fff", borderRadius: 6,
      boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
      position: "relative", overflow: "hidden",
      aspectRatio: "0.77",
    }}>
      {/* Header */}
      <div style={{ padding: "40px 54px 0" }}>
        <div style={{ fontSize: 10, color: "#8494A8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>
          Constructora Bolívar S.A.
        </div>
        <div style={{ height: 18, width: "75%", background: "#0A0F1E", borderRadius: 2, marginBottom: 6 }}/>
        <div style={{ height: 10, width: "55%", background: "rgba(10,15,30,0.5)", borderRadius: 1 }}/>
        <div style={{ fontSize: 9, color: "#8494A8", marginTop: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          EXP-2026-042 · Página {page} de 48
        </div>
      </div>

      {/* Body mock lines */}
      <div style={{ padding: "24px 54px" }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            height: 5, borderRadius: 1, marginBottom: 7,
            background: "rgba(10,15,30,0.15)",
            width: `${95 - (i % 5) * 8}%`,
          }}/>
        ))}
      </div>

      {/* Signature area on page 14 */}
      {page === 14 && (
        <div style={{ position: "absolute", bottom: 90, left: 54, right: 54 }}>
          <div style={{ fontSize: 9, color: "#8494A8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Firmas</div>
          <div style={{ display: "flex", gap: 18 }}>
            <div style={{ flex: 1, borderTop: "1px solid #0A0F1E", paddingTop: 6 }}>
              <div style={{ fontSize: 8, color: "#8494A8" }}>Comprador</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0A0F1E", marginTop: 2 }}>C.C. 1.082.934.221</div>
            </div>
            <div style={{ flex: 1, borderTop: "1px solid #0A0F1E", paddingTop: 6 }}>
              <div style={{ fontSize: 8, color: "#8494A8" }}>Representante legal</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0A0F1E", marginTop: 2 }}>Apoderado CB</div>
            </div>
          </div>
        </div>
      )}

      {/* Annotations overlay */}
      {annotations.map((a, i) => (
        <Annotation key={i} {...a}/>
      ))}
    </div>
  );
}

function Annotation({ type, top, left, width, height, label, note }) {
  const tones = {
    warn:   { stroke: "#F59E0B", fill: "rgba(245,158,11,0.18)", labelBg: "#F59E0B", labelFg: "#0A0F1E" },
    danger: { stroke: "#EF4444", fill: "rgba(239,68,68,0.18)",  labelBg: "#EF4444", labelFg: "#fff" },
    info:   { stroke: "#00C2CB", fill: "rgba(0,194,203,0.18)",  labelBg: "#00C2CB", labelFg: "#0A0F1E" },
  };
  const t = tones[type] || tones.info;
  return (
    <div style={{
      position: "absolute",
      top: `${top}%`, left: `${left}%`,
      width: `${width}%`, height: `${height}%`,
      border: `2px solid ${t.stroke}`,
      background: t.fill,
      borderRadius: 4,
      animation: "nx-annot-flash 2.5s infinite",
    }}>
      <div style={{
        position: "absolute", top: -24, left: -2,
        background: t.labelBg, color: t.labelFg,
        fontSize: 10, fontWeight: 800, padding: "3px 8px",
        borderRadius: "4px 4px 4px 0",
        whiteSpace: "nowrap",
        letterSpacing: 0.3,
      }}>{label}</div>
      {note && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 6,
          background: "#0A0F1E", color: "#fff",
          fontSize: 10, padding: "6px 10px", borderRadius: 7,
          maxWidth: 220, lineHeight: 1.4,
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          whiteSpace: "normal",
        }}>{note}</div>
      )}
    </div>
  );
}

Object.assign(window, { PdfViewer });
