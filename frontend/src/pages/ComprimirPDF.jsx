import { useState } from "react";
import Topbar from "../components/Topbar";

const API_URL = import.meta.env.VITE_API_URL || "https://nexa-app-backend.onrender.com";

const LEVELS = [
  {
    id: "low",
    icon: "🟢",
    label: "Baja compresión",
    desc: "Máxima calidad, reducción ~20%",
    reduction: 0.20,
    color: "#16A34A",
    dot: "#22C55E",
  },
  {
    id: "medium",
    icon: "🟡",
    label: "Compresión media",
    desc: "Equilibrio calidad / tamaño, reducción ~50%",
    reduction: 0.50,
    color: "#D97706",
    dot: "#F59E0B",
  },
  {
    id: "high",
    icon: "🔴",
    label: "Alta compresión",
    desc: "Máxima reducción, calidad mínima, reducción ~70%",
    reduction: 0.70,
    color: "#DC2626",
    dot: "#EF4444",
  },
];

function fmtBytes(b) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export default function ComprimirPDF() {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (!f?.name.toLowerCase().endsWith(".pdf")) return;
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("level", level);
      const res = await fetch(`${API_URL}/api/compress-pdf`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Error al comprimir");
      const originalSize = parseInt(res.headers.get("X-Original-Size") || "0");
      const compressedSize = parseInt(res.headers.get("X-Compressed-Size") || "0");
      const blob = await res.blob();
      setResult({ originalSize, compressedSize });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "_comprimido.pdf");
      a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sel = LEVELS.find(l => l.id === level);
  const estSize = file ? Math.round(file.size * (1 - sel.reduction)) : 0;
  const saving = result
    ? Math.round((1 - result.compressedSize / result.originalSize) * 100)
    : Math.round(sel.reduction * 100);

  return (
    <>
      <Topbar supertitle="Herramientas PDF" title="Comprimir PDF" />
      <div style={{ padding: "40px 40px 80px" }}>

        {/* Upload zone */}
        <div
          onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)}
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}
          onClick={() => !file && document.getElementById("compress-input").click()}
          style={{
            border: `2px dashed ${dragging ? "#00C2CB" : file ? "rgba(0,194,203,0.4)" : "rgba(10,15,30,0.15)"}`,
            borderRadius: 18, padding: file ? "20px 24px" : "40px 24px",
            textAlign: "center", cursor: file ? "default" : "pointer",
            background: file ? "rgba(0,194,203,0.03)" : dragging ? "rgba(0,194,203,0.04)" : "#fff",
            transition: "all .2s", marginBottom: 32,
          }}>
          <input id="compress-input" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          {!file ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗜️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0A0F1E", marginBottom: 6 }}>Arrastra tu PDF aquí</div>
              <div style={{ fontSize: 13, color: "#8494A8" }}>o haz clic para seleccionar</div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 30 }}>📄</div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0A0F1E" }}>{file.name}</div>
                <div style={{ fontSize: 12, color: "#8494A8", marginTop: 2 }}>{fmtBytes(file.size)}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(10,15,30,0.12)", background: "#F6F8FB", color: "#556070", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ✕ Cambiar
              </button>
            </div>
          )}
        </div>

        {file && (
          <>
            {/* Compression level cards */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#556070", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>Nivel de compresión</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {LEVELS.map(lv => {
                  const active = level === lv.id;
                  return (
                    <div key={lv.id} onClick={() => { setLevel(lv.id); setResult(null); }}
                      style={{ border: active ? `2px solid ${lv.dot}` : "2px solid rgba(10,15,30,0.08)", borderRadius: 16, padding: "22px 20px", cursor: "pointer", background: active ? `${lv.dot}12` : "#fff", transition: "all .2s", boxShadow: active ? `0 4px 20px ${lv.dot}28` : "0 2px 8px rgba(10,15,30,0.05)" }}>
                      <div style={{ fontSize: 28, marginBottom: 12 }}>{lv.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: active ? lv.color : "#0A0F1E", marginBottom: 8 }}>{lv.label}</div>
                      <div style={{ fontSize: 12, color: "#556070", lineHeight: 1.6 }}>{lv.desc}</div>
                      {active && (
                        <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: `${lv.dot}22` }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: lv.dot }} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: lv.color, textTransform: "uppercase", letterSpacing: 0.6 }}>Seleccionado</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Size preview */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(10,15,30,0.08)", padding: "24px", marginBottom: 24, boxShadow: "0 2px 8px rgba(10,15,30,0.05)", display: "flex", gap: 0 }}>
              {[
                {
                  label: "Tamaño original",
                  value: fmtBytes(file.size),
                  sub: file.name,
                  color: "#0A0F1E",
                },
                {
                  label: result ? "Tamaño real" : "Tamaño estimado",
                  value: result ? fmtBytes(result.compressedSize) : fmtBytes(estSize),
                  sub: result ? "resultado real" : `reducción ~${Math.round(sel.reduction * 100)}%`,
                  color: sel.color,
                },
                {
                  label: "Ahorro",
                  value: `${saving}%`,
                  sub: result
                    ? fmtBytes(result.originalSize - result.compressedSize) + " liberados"
                    : "estimado",
                  color: sel.color,
                },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "0 20px", borderRight: i < 2 ? "1px solid rgba(10,15,30,0.08)" : "none" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>{item.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: item.color, letterSpacing: -1, marginBottom: 4 }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: "#8494A8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sub}</div>
                </div>
              ))}
            </div>

            {result && (
              <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", fontSize: 13, fontWeight: 600 }}>
                ✓ PDF comprimido descargado — {fmtBytes(result.originalSize)} → {fmtBytes(result.compressedSize)} ({saving}% reducción)
              </div>
            )}

            <button onClick={handleCompress} disabled={loading}
              style={{ padding: "14px 40px", borderRadius: 12, border: "none", background: loading ? "#C8D1E0" : "linear-gradient(135deg,#00C2CB,#0099FF)", color: loading ? "#8494A8" : "#0A0F1E", fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 4px 18px rgba(0,194,203,0.35)", transition: "all .2s" }}>
              {loading ? "Comprimiendo..." : "🗜️ Comprimir y descargar PDF"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
