import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Topbar from "../components/Topbar";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const API_URL = import.meta.env.VITE_API_URL || "https://nexa-app-backend.onrender.com";

function parseRange(str, total) {
  const pages = new Set();
  if (!str.trim()) return pages;
  str.split(",").forEach(part => {
    part = part.trim();
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(s => parseInt(s.trim(), 10));
      if (!isNaN(a) && !isNaN(b))
        for (let i = Math.max(1, a); i <= Math.min(total, b); i++) pages.add(i);
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= total) pages.add(n);
    }
  });
  return pages;
}

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export default function DividirPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [numPages, setNumPages] = useState(0);
  const [thumbLoading, setThumbLoading] = useState(false);
  const [mode, setMode] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [partsSize, setPartsSize] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const loadPDF = useCallback(async (file) => {
    setPdfFile(file);
    setThumbnails([]);
    setSelected(new Set());
    setRangeInput("");
    setThumbLoading(true);

    const buf = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buf }).promise;
    const n = doc.numPages;
    setNumPages(n);

    const thumbs = [];
    for (let i = 1; i <= n; i++) {
      const pg = await doc.getPage(i);
      const vp = pg.getViewport({ scale: 0.28 });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      thumbs.push(c.toDataURL());
      setThumbnails([...thumbs]);
    }
    setThumbLoading(false);
  }, []);

  const togglePage = (n) => {
    if (mode !== "select") return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  };

  const handleRangeChange = (val) => {
    setRangeInput(val);
    setSelected(parseRange(val, numPages));
  };

  const handleSplit = async () => {
    if (!pdfFile) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", pdfFile);
      form.append("mode", mode);
      form.append("pages", [...selected].sort((a, b) => a - b).join(","));
      form.append("parts_size", partsSize);
      const res = await fetch(`${API_URL}/api/split-pdf`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Error al dividir");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pdfFile.name.replace(/\.pdf$/i, "")}_dividido.zip`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.toLowerCase().endsWith(".pdf")) loadPDF(f);
  };

  const partCount = numPages > 0 ? Math.ceil(numPages / Math.max(1, partsSize)) : 0;

  const summary = () => {
    if (mode === "all") return `${numPages} PDFs individuales (1 por página)`;
    if (mode === "select") return selected.size > 0 ? `${selected.size} páginas → 1 PDF combinado` : "Ninguna página seleccionada";
    return `${partCount} parte${partCount !== 1 ? "s" : ""} de ${partsSize} página${partsSize !== 1 ? "s" : ""} c/u`;
  };

  const canSplit = pdfFile && !loading && !(mode === "select" && selected.size === 0);

  // ── Upload screen ─────────────────────────────────────
  if (!pdfFile) return (
    <>
      <Topbar supertitle="Herramientas PDF" title="Dividir PDF" />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F6F8FB", padding: 40 }}>
        <div
          onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)}
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}
          onClick={() => document.getElementById("dividir-input").click()}
          style={{ border: `2px dashed ${dragging ? "#00C2CB" : "rgba(10,15,30,0.15)"}`, borderRadius: 20, padding: "60px 48px", textAlign: "center", cursor: "pointer", background: dragging ? "rgba(0,194,203,0.04)" : "#fff", maxWidth: 440, width: "100%", transition: "all .2s" }}>
          <input id="dividir-input" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => e.target.files[0] && loadPDF(e.target.files[0])} />
          <div style={{ fontSize: 48, marginBottom: 14 }}>✂️</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0A0F1E", marginBottom: 8 }}>Dividir PDF</div>
          <div style={{ fontSize: 14, color: "#8494A8" }}>Arrastra un PDF aquí o haz clic para seleccionar</div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minHeight: 0 }}>
      <Topbar supertitle="Herramientas PDF" title="Dividir PDF" />

      {/* Scrollable two-column area */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

          {/* ── Left 70%: thumbnail grid ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* File info bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: "#556070" }}>
                <span style={{ fontWeight: 700, color: "#0A0F1E" }}>{pdfFile.name}</span>
                {numPages > 0 && <> · <span style={{ fontWeight: 700, color: "#0A0F1E" }}>{numPages}</span> páginas</>}
                {" · "}{fmtBytes(pdfFile.size)}
              </div>
              <div style={{ flex: 1 }} />
              {mode === "select" && selected.size > 0 && (
                <div style={{ fontSize: 12, fontWeight: 700, color: "#00C2CB" }}>{selected.size} seleccionadas</div>
              )}
              <button onClick={() => { setPdfFile(null); setThumbnails([]); setNumPages(0); }}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(10,15,30,0.12)", background: "#F6F8FB", color: "#556070", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ✕ Cambiar
              </button>
            </div>

            {/* Thumbnails grid */}
            {thumbLoading && thumbnails.length === 0 ? (
              <div style={{ textAlign: "center", color: "#8494A8", padding: "60px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
                <div style={{ fontSize: 14 }}>Generando miniaturas...</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                {thumbnails.map((thumb, i) => {
                  const pgNum = i + 1;
                  const isSel = selected.has(pgNum);
                  return (
                    <div key={pgNum} onClick={() => togglePage(pgNum)}
                      style={{ cursor: mode === "select" ? "pointer" : "default", borderRadius: 10, overflow: "hidden", border: isSel ? "2.5px solid #00C2CB" : "2px solid rgba(10,15,30,0.09)", boxShadow: isSel ? "0 0 14px rgba(0,194,203,0.28)" : "0 2px 6px rgba(10,15,30,0.06)", background: "#fff", transition: "all .15s", position: "relative" }}>
                      <img src={thumb} alt={`Pág ${pgNum}`} style={{ width: "100%", display: "block" }} draggable={false} />
                      {isSel && (
                        <div style={{ position: "absolute", top: 5, right: 5, width: 20, height: 20, borderRadius: "50%", background: "#00C2CB", color: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, boxShadow: "0 2px 6px rgba(0,194,203,0.5)" }}>✓</div>
                      )}
                      <div style={{ padding: "4px 8px", background: isSel ? "rgba(0,194,203,0.08)" : "#fff" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: isSel ? "#00C2CB" : "#8494A8" }}>Pág. {pgNum}</span>
                      </div>
                    </div>
                  );
                })}
                {/* Loading skeleton placeholders */}
                {thumbLoading && thumbnails.length < numPages &&
                  Array.from({ length: Math.min(8, numPages - thumbnails.length) }).map((_, k) => (
                    <div key={`sk${k}`} style={{ borderRadius: 10, background: "linear-gradient(135deg,#e8edf2,#f4f7fa)", aspectRatio: "0.707", animation: "shimmer 1.4s infinite" }} />
                  ))
                }
              </div>
            )}
          </div>

          {/* ── Right: sticky panel ── */}
          <div style={{ flexShrink: 0, width: 268, position: "sticky", top: 0 }}>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(10,15,30,0.08)", boxShadow: "0 4px 24px rgba(10,15,30,0.07)", overflow: "hidden" }}>

              {/* Mode selector */}
              <div style={{ padding: "16px 16px 4px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Modo de división</div>
                {[
                  { id: "all",    icon: "⊞", label: "Extraer todas" },
                  { id: "select", icon: "☑", label: "Seleccionar páginas" },
                  { id: "parts",  icon: "⊟", label: "Partes iguales" },
                ].map(m => (
                  <div key={m.id} onClick={() => setMode(m.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 5, cursor: "pointer", border: mode === m.id ? "1.5px solid rgba(0,194,203,0.45)" : "1.5px solid rgba(10,15,30,0.07)", background: mode === m.id ? "rgba(0,194,203,0.07)" : "transparent", transition: "all .15s" }}>
                    <span style={{ fontSize: 15 }}>{m.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: mode === m.id ? "#0A0F1E" : "#556070", flex: 1 }}>{m.label}</span>
                    {mode === m.id && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00C2CB", flexShrink: 0 }} />}
                  </div>
                ))}
              </div>

              {/* Mode-specific controls */}
              <div style={{ padding: "8px 16px 4px" }}>
                {mode === "all" && (
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "#F6F8FB", border: "1px solid rgba(10,15,30,0.07)", fontSize: 12, color: "#556070", lineHeight: 1.6 }}>
                    Genera <strong>{numPages} archivos PDF</strong>, uno por página, empaquetados en un ZIP.
                  </div>
                )}

                {mode === "select" && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Rango de páginas</div>
                    <input value={rangeInput} onChange={e => handleRangeChange(e.target.value)}
                      placeholder="Ej: 1, 3, 5-8, 12"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(10,15,30,0.14)", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: "#F6F8FB", marginBottom: 8 }} />
                    <div style={{ fontSize: 11, color: "#8494A8", marginBottom: 10 }}>O haz clic en las miniaturas de la izquierda</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <button onClick={() => { setSelected(new Set(Array.from({length:numPages},(_,i)=>i+1))); setRangeInput(`1-${numPages}`); }}
                        style={{ flex: 1, padding: "7px", borderRadius: 8, border: "1px solid rgba(0,194,203,0.3)", background: "transparent", color: "#00C2CB", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Todas</button>
                      <button onClick={() => { setSelected(new Set()); setRangeInput(""); }}
                        style={{ flex: 1, padding: "7px", borderRadius: 8, border: "1px solid rgba(10,15,30,0.12)", background: "transparent", color: "#556070", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Limpiar</button>
                    </div>
                    {selected.size > 0 && (
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(0,194,203,0.08)", fontSize: 12, color: "#0A0F1E", fontWeight: 600 }}>
                        {selected.size} página{selected.size !== 1 ? "s" : ""} seleccionada{selected.size !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}

                {mode === "parts" && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Páginas por parte</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 12 }}>
                      <button onClick={() => setPartsSize(p => Math.max(1, p - 1))}
                        style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid rgba(10,15,30,0.14)", background: "#F6F8FB", fontSize: 20, cursor: partsSize <= 1 ? "default" : "pointer", fontWeight: 700, color: partsSize <= 1 ? "#C8D1E0" : "#0A0F1E", fontFamily: "inherit" }}>−</button>
                      <span style={{ fontSize: 32, fontWeight: 900, color: "#0A0F1E", minWidth: 44, textAlign: "center" }}>{partsSize}</span>
                      <button onClick={() => setPartsSize(p => Math.min(numPages, p + 1))}
                        style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid rgba(10,15,30,0.14)", background: "#F6F8FB", fontSize: 20, cursor: partsSize >= numPages ? "default" : "pointer", fontWeight: 700, color: partsSize >= numPages ? "#C8D1E0" : "#0A0F1E", fontFamily: "inherit" }}>+</button>
                    </div>
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "#F6F8FB", border: "1px solid rgba(10,15,30,0.07)", fontSize: 12, color: "#556070", textAlign: "center", lineHeight: 1.5 }}>
                      Resultado: <strong>{partCount} parte{partCount !== 1 ? "s" : ""}</strong> de ~{partsSize} página{partsSize !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(10,15,30,0.06)", margin: "12px 0 0" }} />

              {/* Summary + action */}
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, color: "#556070", marginBottom: 14, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 700, color: "#0A0F1E" }}>Resultado: </span>{summary()}
                </div>
                <button onClick={handleSplit} disabled={!canSplit}
                  style={{ width: "100%", padding: 13, borderRadius: 11, border: "none", background: canSplit ? "linear-gradient(135deg,#00C2CB,#0099FF)" : "#C8D1E0", color: canSplit ? "#0A0F1E" : "#8494A8", fontSize: 14, fontWeight: 800, cursor: canSplit ? "pointer" : "not-allowed", fontFamily: "inherit", boxShadow: canSplit ? "0 4px 16px rgba(0,194,203,0.3)" : "none", transition: "all .2s" }}>
                  {loading ? "Dividiendo..." : "✂️ Dividir PDF"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
