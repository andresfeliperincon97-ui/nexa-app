/* global React */

// ══════════════════════════════════════════════════════
//  LivePreview — preview del expediente resultante
// ══════════════════════════════════════════════════════
function LivePreview({ rowIndex }) {
  const samples = [
    { name: "EXP-2026-041", ced: "79.582.114",     desc: "Lote Torre 3 - Apto 401", pages: 124, date: "2026-04-18", pdfs: 8 },
    { name: "EXP-2026-042", ced: "43.221.088",     desc: "Lote Torre 3 - Apto 402", pages: 98,  date: "2026-04-18", pdfs: 7 },
    { name: "EXP-2026-043", ced: "1.020.876.334",  desc: "Lote Torre 3 - Apto 403", pages: 142, date: "2026-04-19", pdfs: 9 },
    { name: "EXP-2026-044", ced: "52.108.337",     desc: "Lote Torre 3 - Apto 404", pages: 82,  date: "2026-04-19", pdfs: 6 },
    { name: "EXP-2026-045", ced: "80.447.192",     desc: "Lote Torre 3 - Apto 405", pages: 118, date: "2026-04-19", pdfs: 8 },
    { name: "EXP-2026-046", ced: "1.010.223.447",  desc: "Lote Torre 3 - Apto 501", pages: 102, date: "2026-04-19", pdfs: 7 },
    { name: "EXP-2026-047", ced: "79.881.204",     desc: "Lote Torre 3 - Apto 502", pages: 148, date: "2026-04-20", pdfs: 9 },
    { name: "EXP-2026-048", ced: "42.998.116",     desc: "Lote Torre 3 - Apto 503", pages: 94,  date: "2026-04-20", pdfs: 7 },
  ];
  const r = samples[Math.min(rowIndex, samples.length - 1)] || samples[0];

  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4 }}>
            👁 Vista previa en vivo
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0A0F1E", marginTop: 2 }}>
            Expediente de muestra · fila {rowIndex + 1}
          </div>
        </div>
        <span style={{ fontSize: 10, padding: "3px 9px", background: "rgba(0,194,203,0.1)", color: "#00C2CB", borderRadius: 999, fontWeight: 700, letterSpacing: 0.6 }}>EN VIVO</span>
      </div>

      {/* PDF preview — portada */}
      <div style={{
        background: "#F6F8FB", borderRadius: 12, padding: 24,
        display: "flex", justifyContent: "center", alignItems: "center",
        marginBottom: 12, minHeight: 320,
      }}>
        <div style={{
          width: 240, aspectRatio: "0.77", background: "#fff",
          borderRadius: 6, boxShadow: "0 20px 60px rgba(10,15,30,0.15), 0 0 0 1px rgba(10,15,30,0.06)",
          padding: 20, position: "relative", overflow: "hidden",
        }}>
          {/* NEXA brand strip */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 6,
            background: "linear-gradient(90deg,#00C2CB,#0099FF)",
          }}/>
          <div style={{ fontSize: 8, fontWeight: 700, color: "#00C2CB", letterSpacing: 1.4, textTransform: "uppercase", marginTop: 6, marginBottom: 14 }}>
            ⚡ NEXA · Constructora Bolívar
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Expediente</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#0A0F1E", marginBottom: 14, letterSpacing: -0.2, lineHeight: 1.2,
                        background: "linear-gradient(90deg, rgba(0,194,203,0.1), transparent)",
                        padding: "3px 6px", borderLeft: "2px solid #00C2CB", borderRadius: "0 4px 4px 0" }}>
            {r.name}
          </div>

          {[
            ["IDENTIFICACIÓN", r.ced,  "#0099FF"],
            ["DESCRIPCIÓN",    r.desc, "#00C2CB"],
            ["FECHA EMISIÓN",  r.date, "#A855F7"],
            ["# DOCUMENTOS",   `${r.pdfs} PDFs`, "#10B981"],
          ].map(([lbl, val, col]) => (
            <div key={lbl} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 6, fontWeight: 700, color: "#8494A8", letterSpacing: 0.6, textTransform: "uppercase" }}>{lbl}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#0A0F1E",
                            padding: "2px 5px", borderRadius: 3,
                            background: `${col}14`, display: "inline-block", marginTop: 1 }}>
                {val}
              </div>
            </div>
          ))}

          <div style={{ position: "absolute", bottom: 14, left: 20, right: 20 }}>
            <div style={{ height: 3, background: "#F6F8FB", borderRadius: 2, marginBottom: 4 }}/>
            <div style={{ fontSize: 6, color: "#8494A8", textAlign: "center", fontWeight: 600 }}>
              Página 1 de {r.pages} · Validado con IA ⚡
            </div>
          </div>
        </div>
      </div>

      {/* Outcome summary */}
      <div style={{
        background: "linear-gradient(135deg, rgba(0,194,203,0.06) 0%, rgba(0,153,255,0.04) 100%)",
        border: "1px solid rgba(0,194,203,0.2)",
        borderRadius: 10, padding: 12, fontSize: 11.5, lineHeight: 1.5,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          📦 Se generará:
        </div>
        <div style={{ color: "#2D3A52" }}>
          <code style={{ background: "#fff", padding: "1px 6px", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00C2CB", border: "1px solid rgba(0,194,203,0.2)" }}>{r.name}.pdf</code>
          {" "}· {r.pages} páginas · portada + {r.pdfs} PDFs anexos, ordenados cronológicamente.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LivePreview });
