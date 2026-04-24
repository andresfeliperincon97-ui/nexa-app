import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";

// ── Data ──────────────────────────────────────────────
const STEPS = [
  { num: 1, title: "Cargar archivos",   sub: "Excel + ZIPs con PDFs",    icon: "📤" },
  { num: 2, title: "Detectar filas",    sub: "42 filas · 1,284 PDFs",    icon: "🔍" },
  { num: 3, title: "Mapear columnas",   sub: "Excel → plantilla",         icon: "🔗" },
  { num: 4, title: "Vista previa",      sub: "Expediente de ejemplo",     icon: "👁" },
  { num: 5, title: "Ejecutar",          sub: "Procesar + validar IA",     icon: "🚀" },
  { num: 6, title: "Descargar ZIP",     sub: "42 expedientes listos",     icon: "📦" },
];

const EXCEL_COLS = ["N°", "Nombre_Salida", "Cedula", "Expediente", "PDFs", "Páginas", "Fecha"];
const EXCEL_ROWS = [
  ["1",  "EXP-2026-041", "79.582.114",     "Lote Torre 3 - Apto 401", "8", "124", "2026-04-18"],
  ["2",  "EXP-2026-042", "43.221.088",     "Lote Torre 3 - Apto 402", "7", "98",  "2026-04-18"],
  ["3",  "EXP-2026-043", "1.020.876.334",  "Lote Torre 3 - Apto 403", "9", "142", "2026-04-19"],
  ["4",  "EXP-2026-044", "52.108.337",     "Lote Torre 3 - Apto 404", "6", "82",  "2026-04-19"],
  ["5",  "EXP-2026-045", "80.447.192",     "Lote Torre 3 - Apto 405", "8", "118", "2026-04-19"],
  ["6",  "EXP-2026-046", "1.010.223.447",  "Lote Torre 3 - Apto 501", "7", "102", "2026-04-19"],
  ["7",  "EXP-2026-047", "79.881.204",     "Lote Torre 3 - Apto 502", "9", "148", "2026-04-20"],
  ["8",  "EXP-2026-048", "42.998.116",     "Lote Torre 3 - Apto 503", "7", "94",  "2026-04-20"],
  ["…",  "…", "…", "…", "…", "…", "…"],
  ["42", "EXP-2026-082", "1.022.445.901",  "Lote Torre 3 - Apto 802", "8", "126", "2026-04-21"],
];

const ZIP_FILES = [
  { name: "docs_torre3_apto401-410.zip", size: "28.4 MB", count: 82 },
  { name: "docs_torre3_apto501-510.zip", size: "24.1 MB", count: 76 },
  { name: "docs_torre3_apto601-610.zip", size: "26.8 MB", count: 84 },
  { name: "docs_torre3_apto701-710.zip", size: "30.2 MB", count: 88 },
];

const MAPPING_FIELDS = [
  { key: "filename", label: "Nombre del archivo",    required: true,  hint: "Nombre del PDF de salida" },
  { key: "ced",      label: "Identificación",         required: true,  hint: "Reemplaza {{CEDULA}} en portada" },
  { key: "exp",      label: "Descripción expediente", required: true,  hint: "Reemplaza {{EXPEDIENTE}}" },
  { key: "date",     label: "Fecha de emisión",       required: false, hint: "Reemplaza {{FECHA}} · formato ISO" },
  { key: "pages",    label: "Conteo de páginas",      required: false, hint: "Validación contra ZIP" },
];

const EXCEL_OPTIONS = ["Nombre_Salida", "Cedula", "Expediente", "PDFs", "Páginas", "Fecha", "(ninguna)"];

const SAMPLES = [
  { name: "EXP-2026-041", ced: "79.582.114",    desc: "Lote Torre 3 - Apto 401", pages: 124, date: "2026-04-18", pdfs: 8 },
  { name: "EXP-2026-042", ced: "43.221.088",    desc: "Lote Torre 3 - Apto 402", pages: 98,  date: "2026-04-18", pdfs: 7 },
  { name: "EXP-2026-043", ced: "1.020.876.334", desc: "Lote Torre 3 - Apto 403", pages: 142, date: "2026-04-19", pdfs: 9 },
  { name: "EXP-2026-044", ced: "52.108.337",    desc: "Lote Torre 3 - Apto 404", pages: 82,  date: "2026-04-19", pdfs: 6 },
  { name: "EXP-2026-045", ced: "80.447.192",    desc: "Lote Torre 3 - Apto 405", pages: 118, date: "2026-04-19", pdfs: 8 },
  { name: "EXP-2026-046", ced: "1.010.223.447", desc: "Lote Torre 3 - Apto 501", pages: 102, date: "2026-04-19", pdfs: 7 },
  { name: "EXP-2026-047", ced: "79.881.204",    desc: "Lote Torre 3 - Apto 502", pages: 148, date: "2026-04-20", pdfs: 9 },
  { name: "EXP-2026-048", ced: "42.998.116",    desc: "Lote Torre 3 - Apto 503", pages: 94,  date: "2026-04-20", pdfs: 7 },
];

// ── Stepper ───────────────────────────────────────────
function ExpandedStepper({ current, onJump }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
      display: "flex", alignItems: "stretch", gap: 0,
    }}>
      {STEPS.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "idle";
        return (
          <div key={s.num} style={{ display: "flex", flex: 1, alignItems: "center" }}>
            <div onClick={() => onJump?.(i)} style={{ flex: 1, cursor: "pointer", textAlign: "center", opacity: state === "idle" ? 0.55 : 1, transition: "opacity .2s" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 800,
                background: state === "idle" ? "#F6F8FB" : "linear-gradient(135deg,#00C2CB,#0099FF)",
                color: state === "idle" ? "#8494A8" : "#0A0F1E",
                boxShadow: state === "active" ? "0 0 20px rgba(0,194,203,0.6)" : state === "done" ? "0 0 14px rgba(0,194,203,0.35)" : "none",
                border: state === "idle" ? "2px solid rgba(10,15,30,0.08)" : "none",
                animation: state === "active" ? "nx-pulse 2s infinite" : "none",
              }}>
                {state === "done" ? "✓" : s.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: state === "idle" ? "#8494A8" : state === "active" ? "#00C2CB" : "#0A0F1E", marginBottom: 3, letterSpacing: -0.1 }}>
                {s.num}. {s.title}
              </div>
              <div style={{ fontSize: 10.5, color: "#8494A8", lineHeight: 1.3 }}>{s.sub}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 24, display: "flex", alignItems: "center", paddingTop: 20 }}>
                <div style={{ flex: 1, height: 2, borderRadius: 2, background: i < current ? "linear-gradient(90deg,#00C2CB,#0099FF)" : "rgba(10,15,30,0.08)" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Excel preview ─────────────────────────────────────
function ExcelPreview({ selectedRow, onSelectRow }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(10,15,30,0.06)", background: "#F6F8FB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0A0F1E" }}>plantilla_042.xlsx</div>
            <div style={{ fontSize: 11, color: "#8494A8" }}>42 filas detectadas · 7 columnas · 98 KB</div>
          </div>
        </div>
        <span style={{ fontSize: 10, padding: "3px 9px", background: "rgba(16,185,129,0.12)", color: "#10B981", borderRadius: 999, fontWeight: 700 }}>✓ VÁLIDO</span>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead style={{ position: "sticky", top: 0, background: "#fff" }}>
            <tr>
              {EXCEL_COLS.map(c => (
                <th key={c} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, color: "#8494A8", fontWeight: 700, textAlign: "left", padding: "9px 14px", borderBottom: "1px solid rgba(10,15,30,0.08)", background: "#fff" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EXCEL_ROWS.map((row, i) => {
              const isEllipsis = row[0] === "…";
              const isSel = selectedRow === i;
              return (
                <tr key={i} onClick={() => !isEllipsis && onSelectRow(i)} style={{
                  background: isSel ? "rgba(0,194,203,0.08)" : i % 2 ? "rgba(246,248,251,0.5)" : "#fff",
                  cursor: isEllipsis ? "default" : "pointer",
                  borderLeft: isSel ? "3px solid #00C2CB" : "3px solid transparent",
                }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding: "9px 14px",
                      fontFamily: [0, 2, 4, 5].includes(j) ? "'JetBrains Mono', monospace" : "inherit",
                      fontSize: [0, 2, 4, 5].includes(j) ? 11 : 12,
                      fontWeight: j === 1 ? 700 : 500,
                      color: isEllipsis ? "#B8C2D0" : j === 1 ? "#0A0F1E" : "#2D3A52",
                    }}>{cell}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ZIP panel ─────────────────────────────────────────
function ZipPanel() {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4 }}>🗜️ Archivos ZIP</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0A0F1E", marginTop: 2 }}>4 ZIPs · 330 PDFs detectados</div>
        </div>
        <span style={{ fontSize: 10, padding: "3px 9px", background: "rgba(16,185,129,0.12)", color: "#10B981", borderRadius: 999, fontWeight: 700 }}>✓ TODO OK</span>
      </div>
      {ZIP_FILES.map((z, i) => (
        <div key={z.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: i % 2 ? "#F6F8FB" : "transparent" }}>
          <span style={{ fontSize: 16 }}>🗜️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0A0F1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{z.name}</div>
            <div style={{ fontSize: 10, color: "#8494A8", fontFamily: "'JetBrains Mono', monospace" }}>{z.size} · {z.count} PDFs</div>
          </div>
          <span style={{ color: "#10B981", fontSize: 14 }}>✓</span>
        </div>
      ))}
    </div>
  );
}

// ── Mapping panel ─────────────────────────────────────
function MappingPanel({ mappings, onUpdate }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 3 }}>🔗 Mapeo de columnas</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0A0F1E" }}>Excel → plantilla PDF</div>
        <div style={{ fontSize: 11, color: "#8494A8", marginTop: 3 }}>Asocia cada columna del Excel con el campo de la plantilla que reemplazará.</div>
      </div>
      {MAPPING_FIELDS.map(f => (
        <div key={f.key} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(10,15,30,0.04)" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0A0F1E", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#8494A8", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{`{{${f.key.toUpperCase()}}}`}</span>
              {f.required && <span style={{ fontSize: 9, color: "#EF4444", fontWeight: 700 }}>● requerido</span>}
            </div>
            <div style={{ fontSize: 10.5, color: "#8494A8", marginTop: 2 }}>{f.label}</div>
          </div>
          <div style={{ color: "#00C2CB", fontSize: 16, fontWeight: 700 }}>→</div>
          <select value={mappings[f.key]} onChange={e => onUpdate(f.key, e.target.value)} style={{
            padding: "7px 10px", fontSize: 12, fontFamily: "inherit",
            border: `1px solid ${mappings[f.key] === "(ninguna)" && f.required ? "#EF4444" : "rgba(0,194,203,0.3)"}`,
            background: mappings[f.key] === "(ninguna)" && f.required ? "rgba(239,68,68,0.05)" : "rgba(0,194,203,0.04)",
            color: "#0A0F1E", borderRadius: 8, fontWeight: 600, cursor: "pointer", outline: "none",
          }}>
            {EXCEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      ))}
      <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, fontSize: 11.5, color: "#0A7D5E", display: "flex", alignItems: "center", gap: 8 }}>
        <span>✓</span>
        <span>5 de 5 campos mapeados correctamente. Listo para vista previa.</span>
      </div>
    </div>
  );
}

// ── Live preview ──────────────────────────────────────
function LivePreview({ rowIndex }) {
  const r = SAMPLES[Math.min(rowIndex, SAMPLES.length - 1)] || SAMPLES[0];
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4 }}>👁 Vista previa en vivo</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0A0F1E", marginTop: 2 }}>Expediente de muestra · fila {rowIndex + 1}</div>
        </div>
        <span style={{ fontSize: 10, padding: "3px 9px", background: "rgba(0,194,203,0.1)", color: "#00C2CB", borderRadius: 999, fontWeight: 700 }}>EN VIVO</span>
      </div>
      <div style={{ background: "#F6F8FB", borderRadius: 12, padding: 24, display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 12, minHeight: 280 }}>
        <div style={{
          width: 210, aspectRatio: "0.77", background: "#fff",
          borderRadius: 6, boxShadow: "0 20px 60px rgba(10,15,30,0.15), 0 0 0 1px rgba(10,15,30,0.06)",
          padding: 18, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg,#00C2CB,#0099FF)" }} />
          <div style={{ fontSize: 7, fontWeight: 700, color: "#00C2CB", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 5, marginBottom: 12 }}>⚡ NEXA · Constructora Bolívar</div>
          <div style={{ fontSize: 8, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", marginBottom: 3 }}>Expediente</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#0A0F1E", marginBottom: 12, padding: "2px 5px", borderLeft: "2px solid #00C2CB", borderRadius: "0 4px 4px 0", background: "rgba(0,194,203,0.08)" }}>{r.name}</div>
          {[["IDENTIFICACIÓN", r.ced, "#0099FF"], ["DESCRIPCIÓN", r.desc, "#00C2CB"], ["FECHA EMISIÓN", r.date, "#A855F7"], ["# DOCUMENTOS", `${r.pdfs} PDFs`, "#10B981"]].map(([lbl, val, col]) => (
            <div key={lbl} style={{ marginBottom: 7 }}>
              <div style={{ fontSize: 6, fontWeight: 700, color: "#8494A8", letterSpacing: 0.5, textTransform: "uppercase" }}>{lbl}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#0A0F1E", padding: "1px 4px", borderRadius: 3, background: col + "14", display: "inline-block", marginTop: 1 }}>{val}</div>
            </div>
          ))}
          <div style={{ position: "absolute", bottom: 12, left: 18, right: 18 }}>
            <div style={{ height: 2, background: "#F6F8FB", borderRadius: 2, marginBottom: 3 }} />
            <div style={{ fontSize: 5.5, color: "#8494A8", textAlign: "center", fontWeight: 600 }}>Página 1 de {r.pages} · Validado con IA ⚡</div>
          </div>
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg, rgba(0,194,203,0.06), rgba(0,153,255,0.04))", border: "1px solid rgba(0,194,203,0.2)", borderRadius: 10, padding: 12, fontSize: 11.5, lineHeight: 1.5 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>📦 Se generará:</div>
        <div style={{ color: "#2D3A52" }}>
          <code style={{ background: "#fff", padding: "1px 6px", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00C2CB", border: "1px solid rgba(0,194,203,0.2)" }}>{r.name}.pdf</code>
          {" "}· {r.pages} páginas · portada + {r.pdfs} PDFs anexos, ordenados cronológicamente.
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────
export default function NexificarMasivo() {
  const navigate = useNavigate();
  const [step, setStep] = useState(2);
  const [selectedRow, setSelectedRow] = useState(1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [mappings, setMappings] = useState({
    filename: "Nombre_Salida", ced: "Cedula", exp: "Expediente", date: "Fecha", pages: "Páginas",
  });

  const execute = () => {
    setStep(4); setRunning(true);
    setTimeout(() => { setRunning(false); setDone(true); setStep(5); }, 2800);
  };

  const topbarActions = (
    <>
      <button onClick={() => {}} style={{ background: "rgba(10,15,30,0.04)", border: "1px solid rgba(10,15,30,0.1)", padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "#556070", cursor: "pointer", fontFamily: "inherit" }}>📋 Plantilla de ejemplo</button>
      <button onClick={() => {}} style={{ background: "rgba(10,15,30,0.04)", border: "1px solid rgba(10,15,30,0.1)", padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "#556070", cursor: "pointer", fontFamily: "inherit" }}>💾 Guardar borrador</button>
    </>
  );

  if (done) {
    return (
      <>
        <Topbar supertitle="🗂️ Nexíficar Masivo" title="Ensambla cientos de expedientes de una sola vez" actions={topbarActions} />
        <div style={{ padding: "24px 32px 64px", display: "flex", flexDirection: "column", gap: 20 }}>
          <ExpandedStepper current={5} onJump={setStep} />
          <div style={{ background: "linear-gradient(135deg,#F6F8FB 0%,#FFFFFF 50%,rgba(0,194,203,0.04) 100%)", border: "1px solid rgba(0,194,203,0.28)", borderRadius: 20, padding: 48, textAlign: "center", boxShadow: "0 8px 40px rgba(0,194,203,0.08)" }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#00C2CB", letterSpacing: -0.4, marginBottom: 8 }}>¡Nexificación completada!</div>
            <div style={{ fontSize: 15, color: "#556070", marginBottom: 28, maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
              <strong>42 expedientes</strong> ensamblados · <strong>1,284 páginas</strong> procesadas · <strong>98.4%</strong> validados con IA en <strong>2m 18s</strong>.
            </div>
            <div style={{ display: "inline-flex", gap: 10, marginBottom: 24 }}>
              <button style={{ background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", padding: "11px 22px", borderRadius: 10, border: "none", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(0,194,203,0.35)" }}>⬇️ Descargar ZIP (42 PDFs · 184 MB)</button>
              <button onClick={() => navigate("/validador")} style={{ background: "#fff", color: "#00C2CB", padding: "11px 22px", borderRadius: 10, border: "1px solid rgba(0,194,203,0.3)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>⚡ Abrir en Validador IA</button>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#8494A8" }}>
              <span onClick={() => { setDone(false); setStep(0); }} style={{ color: "#00C2CB", cursor: "pointer", fontWeight: 700 }}>← Nexíficar otro lote</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (running) {
    return (
      <>
        <Topbar supertitle="🗂️ Nexíficar Masivo" title="Ensambla cientos de expedientes de una sola vez" actions={topbarActions} />
        <div style={{ padding: "24px 32px 64px", display: "flex", flexDirection: "column", gap: 20 }}>
          <ExpandedStepper current={4} onJump={() => {}} />
          <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, padding: 48, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%", background: "linear-gradient(135deg,#00C2CB,#0099FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, animation: "nx-pulse 1.6s infinite", color: "#0A0F1E" }}>🚀</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.3, marginBottom: 8 }}>Nexificando 42 expedientes…</div>
            <div style={{ fontSize: 13, color: "#8494A8" }}>Leyendo ZIPs · Ensamblando portadas · Validando con IA</div>
            <div style={{ width: 360, height: 6, background: "#F6F8FB", borderRadius: 3, margin: "24px auto 10px", overflow: "hidden" }}>
              <div style={{ width: "68%", height: "100%", background: "linear-gradient(90deg,#00C2CB,#0099FF)", borderRadius: 3, boxShadow: "0 0 12px rgba(0,194,203,0.5)" }} />
            </div>
            <div style={{ fontSize: 11, color: "#556070", fontFamily: "'JetBrains Mono', monospace" }}>28 / 42 · 67%</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar supertitle="🗂️ Nexíficar Masivo" title="Ensambla cientos de expedientes de una sola vez" actions={topbarActions} />
      <div style={{ padding: "24px 32px 64px", display: "flex", flexDirection: "column", gap: 20 }}>
        <ExpandedStepper current={step} onJump={setStep} />

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, alignItems: "flex-start" }}>
          <ExcelPreview selectedRow={selectedRow} onSelectRow={setSelectedRow} />
          <ZipPanel />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, alignItems: "flex-start" }}>
          <MappingPanel mappings={mappings} onUpdate={(k, v) => setMappings({ ...mappings, [k]: v })} />
          <LivePreview rowIndex={selectedRow} />
        </div>

        {/* Execute bar */}
        <div style={{
          background: "linear-gradient(135deg, #0A0F1E 0%, #1A2234 100%)",
          borderRadius: 16, padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          border: "1px solid rgba(0,194,203,0.2)", boxShadow: "0 4px 24px rgba(10,15,30,0.12)",
        }}>
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 4 }}>🎯 Listo para ejecutar</div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.2 }}>42 expedientes · 1,284 páginas · ~2m 30s estimado</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Todos los campos requeridos están mapeados. El resultado se valida automáticamente con IA.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>👁 Ver 5 ejemplos más</button>
            <button onClick={execute} style={{ background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", padding: "12px 28px", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: "pointer", border: "none", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(0,194,203,0.4)" }}>
              🚀 Nexíficar 42 expedientes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
