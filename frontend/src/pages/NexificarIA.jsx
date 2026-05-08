import { useState, useRef, useEffect } from "react";
import { nexificarIA } from "../services/api";
import Topbar from "../components/Topbar";

const INSTRUCCIONES_GUARDADAS = [
  "Renombrar con cédula del beneficiario + Habitabilidad",
  "Renombrar con cédula del beneficiario + Desembolso",
  "Renombrar con número de radicado",
  "Extraer página 1 de cada PDF",
  "Renombrar con cédula + Habitabilidad",
  "Renombrar con cédula + Desembolso",
  "Unir ESC y PYS por número de cédula",
];

// ── ZIP parser (client-side, no deps) ─────────────────
function parseZipFiles(arrayBuffer) {
  const view  = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  const out   = [];

  // Find End of Central Directory record (signature 0x06054b50)
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) return out;

  const cdOffset = view.getUint32(eocd + 16, true);
  const cdSize   = view.getUint32(eocd + 12, true);
  const dec      = new TextDecoder("utf-8");
  let   off      = cdOffset;

  while (off < cdOffset + cdSize && off + 46 <= bytes.length) {
    if (view.getUint32(off, true) !== 0x02014b50) break;
    const uncompSize = view.getUint32(off + 24, true);
    const fnLen      = view.getUint16(off + 28, true);
    const extraLen   = view.getUint16(off + 30, true);
    const cmtLen     = view.getUint16(off + 32, true);
    const fullName   = dec.decode(bytes.slice(off + 46, off + 46 + fnLen));
    const base       = fullName.split("/").pop();
    if (base.toLowerCase().endsWith(".pdf") && !fullName.includes("__MACOSX") && base.length > 0) {
      out.push({ name: base, size: uncompSize });
    }
    off += 46 + fnLen + extraLen + cmtLen;
  }
  return out;
}

// ── ZIP file list ─────────────────────────────────────
function ZipFileList({ files }) {
  const shown = files.slice(0, 50);
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(10,15,30,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0A0F1E" }}>📁 Archivos detectados ({files.length} PDFs)</div>
        {files.length > shown.length && (
          <span style={{ fontSize: 11, color: "#8494A8" }}>mostrando {shown.length} de {files.length}</span>
        )}
      </div>
      <div style={{ maxHeight: 260, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F6F8FB" }}>
              {["", "Nombre del archivo", "Tamaño"].map((h, i) => (
                <th key={i} style={{ padding: "8px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "1px solid rgba(10,15,30,0.06)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((f, i) => (
              <tr key={i} style={{ background: i % 2 ? "rgba(246,248,251,0.4)" : "#fff" }}>
                <td style={{ padding: "8px 16px", fontSize: 15 }}>📄</td>
                <td style={{ padding: "8px 16px", color: "#2D3A52", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{f.name}</td>
                <td style={{ padding: "8px 16px", color: "#8494A8", fontSize: 11, whiteSpace: "nowrap" }}>{f.size > 0 ? `${Math.round(f.size / 1024)} KB` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Drop zone ─────────────────────────────────────────
function DropZone({ file, onFile }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);

  const pick = (f) => {
    if (f && f.name.toLowerCase().endsWith(".zip")) onFile(f);
  };

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${drag ? "#00C2CB" : file ? "#10B981" : "rgba(10,15,30,0.15)"}`,
        borderRadius: 14, padding: "32px 24px", textAlign: "center", cursor: "pointer",
        background: drag ? "rgba(0,194,203,0.04)" : file ? "rgba(16,185,129,0.04)" : "#F6F8FB",
        transition: "all .2s",
      }}
    >
      <input ref={ref} type="file" accept=".zip" style={{ display: "none" }} onChange={e => pick(e.target.files[0])} />
      {file ? (
        <>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#10B981" }}>{file.name}</div>
          <div style={{ fontSize: 12, color: "#8494A8", marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Haz clic para cambiar</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 32, marginBottom: 8 }}>☁️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#2D3A52" }}>Arrastra tu ZIP aquí o haz clic</div>
          <div style={{ fontSize: 12, color: "#8494A8", marginTop: 4 }}>Solo archivos .zip con PDFs dentro</div>
        </>
      )}
    </div>
  );
}

// ── Preview table ─────────────────────────────────────
function PreviewTable({ rows, total }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(10,15,30,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0A0F1E" }}>Vista previa · primeros {rows.length} de {total} PDFs</div>
        <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(0,194,203,0.1)", color: "#00C2CB", borderRadius: 999, fontWeight: 700 }}>{total} PDFs en total</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#F6F8FB" }}>
            {["Archivo original", "→", "Nombre propuesto"].map(h => (
              <th key={h} style={{ padding: "9px 18px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "1px solid rgba(10,15,30,0.06)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isError = row.propuesto.startsWith("ERROR");
            return (
              <tr key={i} style={{ background: i % 2 ? "rgba(246,248,251,0.5)" : "#fff" }}>
                <td style={{ padding: "10px 18px", color: "#556070", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{row.original}</td>
                <td style={{ padding: "10px 8px", color: "#00C2CB", fontWeight: 800, fontSize: 16, textAlign: "center" }}>→</td>
                <td style={{ padding: "10px 18px", fontWeight: 700, color: isError ? "#EF4444" : "#10B981", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{row.propuesto}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 14, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0A0F1E" }}>
          ⚙️ Procesando {current}/{total} PDFs…
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#00C2CB", fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</div>
      </div>
      <div style={{ height: 8, background: "#F6F8FB", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg,#00C2CB,#0099FF)",
          borderRadius: 4, transition: "width .5s ease",
          boxShadow: "0 0 10px rgba(0,194,203,0.4)",
        }} />
      </div>
      <div style={{ fontSize: 11, color: "#8494A8", marginTop: 8 }}>
        Claude Sonnet 4.5 está analizando y renombrando cada documento…
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────
export default function NexificarIA() {
  const [file, setFile]               = useState(null);
  const [zipFiles, setZipFiles]       = useState([]);
  const [instruccion, setInstruccion] = useState("");
  const [phase, setPhase]             = useState("upload"); // upload | loading_preview | preview | loading_ejecutar | done
  const [previewData, setPreviewData] = useState(null);    // {total_pdfs, preview[]}
  const [progreso, setProgreso]       = useState(0);
  const [resultado, setResultado]     = useState(null);    // {blob, ok, errores}
  const [error, setError]             = useState(null);
  const intervalRef                   = useRef(null);

  const handleFileSelect = async (f) => {
    setFile(f);
    setZipFiles([]);
    try {
      const buf = await f.arrayBuffer();
      setZipFiles(parseZipFiles(buf));
    } catch {
      // proceed without file list if parse fails
    }
  };

  // Simulated progress counter
  useEffect(() => {
    if (phase !== "loading_ejecutar" || !previewData) return;
    const total = previewData.total_pdfs;
    const msPerPdf = Math.max(400, 2500);
    intervalRef.current = setInterval(() => {
      setProgreso(p => {
        const cap = Math.floor(total * 0.88);
        return p >= cap ? cap : p + 1;
      });
    }, msPerPdf);
    return () => clearInterval(intervalRef.current);
  }, [phase, previewData]);

  const handlePreview = async () => {
    if (!file || !instruccion.trim()) return;
    setPhase("loading_preview");
    setError(null);
    try {
      const data = await nexificarIA(file, instruccion, "preview");
      setPreviewData(data);
      setPhase("preview");
    } catch (e) {
      setError(e.message);
      setPhase("upload");
    }
  };

  const handleEjecutar = async () => {
    setProgreso(0);
    setPhase("loading_ejecutar");
    setError(null);
    try {
      const data = await nexificarIA(file, instruccion, "ejecutar");
      clearInterval(intervalRef.current);
      setProgreso(previewData.total_pdfs);
      setResultado(data);
      setPhase("done");
    } catch (e) {
      clearInterval(intervalRef.current);
      setError(e.message);
      setPhase("preview");
    }
  };

  const handleDescargar = () => {
    if (!resultado?.blob) return;
    const url = URL.createObjectURL(resultado.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexificado.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setZipFiles([]);
    setInstruccion("");
    setPhase("upload");
    setPreviewData(null);
    setProgreso(0);
    setResultado(null);
    setError(null);
  };

  const selectInstruccion = (val) => {
    if (val) setInstruccion(val);
  };

  const canPreview = file && instruccion.trim().length > 0;

  return (
    <>
      <Topbar
        supertitle="✨ Nexificar IA"
        title="Procesa tus PDFs con instrucciones en lenguaje natural"
      />
      <div style={{ padding: "28px 32px 64px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>

        {/* Upload + instrucción */}
        {(phase === "upload" || phase === "loading_preview") && (
          <>
            {/* Upload zone */}
            <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 12 }}>📦 Archivo ZIP</div>
              <DropZone file={file} onFile={handleFileSelect} />
            </div>

            {/* Detected files list */}
            {zipFiles.length > 0 && <ZipFileList files={zipFiles} />}

            {/* Instrucción — solo visible cuando hay archivos detectados */}
            {zipFiles.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 12 }}>💬 Instrucción para la IA</div>

              <textarea
                value={instruccion}
                onChange={e => setInstruccion(e.target.value)}
                rows={4}
                placeholder={"Ej: Renombra cada PDF con la cédula del beneficiario + Habitabilidad\nEj: Une los archivos que comparten el mismo número, ESC va primero que PYS, nómbralo con ese número"}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(10,15,30,0.12)", fontSize: 13, fontFamily: "inherit", color: "#0A0F1E", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#556070", flexShrink: 0 }}>Instrucciones guardadas:</div>
                <select
                  defaultValue=""
                  onChange={e => selectInstruccion(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(10,15,30,0.12)", fontSize: 13, fontFamily: "inherit", color: "#0A0F1E", background: "#fff", outline: "none", cursor: "pointer" }}
                >
                  <option value="" disabled>Selecciona una instrucción…</option>
                  {INSTRUCCIONES_GUARDADAS.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>
            </div>
            )}

            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#EF4444", fontWeight: 600 }}>
                ✕ {error}
              </div>
            )}

            {zipFiles.length > 0 && (
            <button
              onClick={handlePreview}
              disabled={!canPreview || phase === "loading_preview"}
              style={{
                padding: "14px 24px", borderRadius: 12, border: "none",
                background: canPreview ? "linear-gradient(135deg,#00C2CB,#0099FF)" : "rgba(10,15,30,0.08)",
                color: canPreview ? "#0A0F1E" : "#8494A8",
                fontSize: 15, fontWeight: 800, fontFamily: "inherit", cursor: canPreview ? "pointer" : "not-allowed",
                boxShadow: canPreview ? "0 4px 18px rgba(0,194,203,0.3)" : "none",
                transition: "all .2s",
              }}
            >
              {phase === "loading_preview" ? "⟳ Generando vista previa…" : "👁 Vista previa"}
            </button>
            )}
          </>
        )}

        {/* Preview */}
        {phase === "preview" && previewData && (
          <>
            <PreviewTable rows={previewData.preview} total={previewData.total_pdfs} />

            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#EF4444", fontWeight: 600 }}>
                ✕ {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleReset}
                style={{ padding: "12px 20px", borderRadius: 10, border: "1px solid rgba(10,15,30,0.12)", background: "#fff", color: "#556070", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
              >
                ← Cambiar archivo o instrucción
              </button>
              <button
                onClick={handleEjecutar}
                style={{
                  flex: 1, padding: "14px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg,#10B981,#00C2CB)",
                  color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
                  boxShadow: "0 4px 18px rgba(16,185,129,0.3)", transition: "all .2s",
                }}
              >
                ✨ Ejecutar Nexificación IA · {previewData.total_pdfs} PDFs
              </button>
            </div>
          </>
        )}

        {/* Progress */}
        {phase === "loading_ejecutar" && previewData && (
          <ProgressBar current={progreso} total={previewData.total_pdfs} />
        )}

        {/* Done */}
        {phase === "done" && resultado && previewData && (
          <>
            <div style={{ background: "#fff", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: 28, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 16 }}>✓ Nexificación completada</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total procesados", value: previewData.total_pdfs, color: "#0A0F1E" },
                  { label: "Procesados OK",     value: resultado.ok,          color: "#10B981" },
                  { label: "Con error",          value: resultado.errores,     color: resultado.errores > 0 ? "#EF4444" : "#8494A8" },
                ].map(kpi => (
                  <div key={kpi.label} style={{ textAlign: "center", padding: "16px 0", background: "#F6F8FB", borderRadius: 12 }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: kpi.color, letterSpacing: -1 }}>{kpi.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 }}>{kpi.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleDescargar}
                  style={{
                    flex: 1, padding: "14px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg,#00C2CB,#0099FF)",
                    color: "#0A0F1E", fontSize: 15, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
                    boxShadow: "0 4px 18px rgba(0,194,203,0.3)",
                  }}
                >
                  ⤓ Descargar ZIP nexificado
                </button>
                <button
                  onClick={handleReset}
                  style={{ padding: "14px 20px", borderRadius: 12, border: "1px solid rgba(10,15,30,0.12)", background: "#fff", color: "#556070", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}
                >
                  ＋ Nueva nexificación
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
