import { useState } from "react";
import Topbar from "../components/Topbar";

const API_URL = import.meta.env.VITE_API_URL || "https://nexa-app-backend.onrender.com";

const DPI_STEPS = [
  { dpi: 72,  label: "Pantalla" },
  { dpi: 96,  label: "Web" },
  { dpi: 144, label: "Estándar" },
  { dpi: 200, label: "Alta" },
  { dpi: 300, label: "Máxima" },
];

const PRESETS = [
  { label: "Pantalla",  icon: "🖥",  dpiIdx: 1, quality: 65,  desc: "96 DPI · 65%" },
  { label: "Estándar",  icon: "📄",  dpiIdx: 2, quality: 75,  desc: "144 DPI · 75%" },
  { label: "Impresión", icon: "🖨",  dpiIdx: 3, quality: 90,  desc: "200 DPI · 90%" },
];

function fmtBytes(b) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

const SLIDER_CSS = `
  .nx-range { -webkit-appearance: none; appearance: none; height: 5px; border-radius: 4px; outline: none; cursor: pointer; }
  .nx-range::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg,#00C2CB,#0099FF); border: 2px solid #fff; box-shadow: 0 1px 6px rgba(0,194,203,0.4); cursor: pointer; }
  .nx-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg,#00C2CB,#0099FF); border: 2px solid #fff; cursor: pointer; }
`;

export default function ComprimirPDF() {
  const [file, setFile] = useState(null);
  const [dpiIdx, setDpiIdx] = useState(2);   // default: Estándar (144)
  const [quality, setQuality] = useState(75);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);

  const dpi = DPI_STEPS[dpiIdx].dpi;

  const applyPreset = (preset) => {
    setDpiIdx(preset.dpiIdx);
    setQuality(preset.quality);
    setResult(null);
  };

  const handleFile = (f) => {
    if (!f?.name.toLowerCase().endsWith(".pdf")) return;
    setFile(f); setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true); setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("dpi", dpi);
      form.append("quality", quality);
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

  const savingPct = result
    ? Math.round((1 - result.compressedSize / result.originalSize) * 100)
    : null;

  // Track fill % for quality slider
  const qualityFill = ((quality - 10) / 90) * 100;
  const dpiFill = (dpiIdx / 4) * 100;

  return (
    <>
      <style>{SLIDER_CSS}</style>
      <Topbar supertitle="Herramientas PDF" title="Comprimir PDF" />
      <div style={{ padding: "40px 40px 80px", maxWidth: 720 }}>

        {/* ── Upload zone ── */}
        <div
          onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)}
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}
          onClick={() => !file && document.getElementById("compress-input").click()}
          style={{ border: `2px dashed ${dragging ? "#00C2CB" : file ? "rgba(0,194,203,0.4)" : "rgba(10,15,30,0.15)"}`, borderRadius: 18, padding: file ? "18px 24px" : "40px 24px", textAlign: "center", cursor: file ? "default" : "pointer", background: file ? "rgba(0,194,203,0.03)" : dragging ? "rgba(0,194,203,0.04)" : "#fff", transition: "all .2s", marginBottom: 32 }}>
          <input id="compress-input" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          {!file ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗜️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0A0F1E", marginBottom: 6 }}>Arrastra tu PDF aquí</div>
              <div style={{ fontSize: 13, color: "#8494A8" }}>o haz clic para seleccionar</div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28 }}>📄</div>
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
            {/* ── Presets ── */}
            <div style={{ marginBottom: 28 }}>
              <Label>Presets rápidos</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {PRESETS.map(p => {
                  const active = dpiIdx === p.dpiIdx && quality === p.quality;
                  return (
                    <button key={p.label} onClick={() => applyPreset(p)}
                      style={{ padding: "14px 12px", borderRadius: 12, border: active ? "2px solid #00C2CB" : "2px solid rgba(10,15,30,0.08)", background: active ? "rgba(0,194,203,0.07)" : "#fff", cursor: "pointer", fontFamily: "inherit", transition: "all .15s", boxShadow: active ? "0 2px 12px rgba(0,194,203,0.2)" : "0 1px 4px rgba(10,15,30,0.05)", textAlign: "left" }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: active ? "#0A0F1E" : "#0A0F1E", marginBottom: 3 }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: active ? "#00C2CB" : "#8494A8", fontWeight: active ? 700 : 400 }}>{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Settings card ── */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(10,15,30,0.08)", padding: "24px 28px", marginBottom: 24, boxShadow: "0 2px 8px rgba(10,15,30,0.05)" }}>

              {/* DPI slider */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <Label>Resolución DPI</Label>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: "#0A0F1E" }}>{dpi}</span>
                    <span style={{ fontSize: 12, color: "#8494A8" }}>DPI — {DPI_STEPS[dpiIdx].label}</span>
                  </div>
                </div>
                <input
                  type="range" min={0} max={4} step={1} value={dpiIdx}
                  onChange={e => { setDpiIdx(+e.target.value); setResult(null); }}
                  className="nx-range"
                  style={{ width: "100%", background: `linear-gradient(to right, #00C2CB ${dpiFill}%, #E2E8F0 ${dpiFill}%)` }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  {DPI_STEPS.map((s, i) => (
                    <div key={i} onClick={() => { setDpiIdx(i); setResult(null); }}
                      style={{ textAlign: "center", cursor: "pointer", minWidth: 44 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: i === dpiIdx ? "#00C2CB" : "#8494A8" }}>{s.dpi}</div>
                      <div style={{ fontSize: 10, color: i === dpiIdx ? "#00C2CB" : "#C8D1E0", marginTop: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <Label>Calidad de imagen</Label>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: quality < 40 ? "#DC2626" : quality < 70 ? "#D97706" : "#16A34A" }}>{quality}%</span>
                    <span style={{ fontSize: 12, color: "#8494A8" }}>{quality < 40 ? "Baja" : quality < 70 ? "Media" : quality < 90 ? "Alta" : "Máxima"}</span>
                  </div>
                </div>
                <input
                  type="range" min={10} max={100} step={1} value={quality}
                  onChange={e => { setQuality(+e.target.value); setResult(null); }}
                  className="nx-range"
                  style={{ width: "100%", background: `linear-gradient(to right, #00C2CB ${qualityFill}%, #E2E8F0 ${qualityFill}%)` }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  {["10%", "25%", "50%", "75%", "100%"].map(l => (
                    <div key={l} style={{ fontSize: 10, color: "#C8D1E0" }}>{l}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Size preview ── */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(10,15,30,0.08)", padding: "20px 28px", marginBottom: 24, boxShadow: "0 2px 8px rgba(10,15,30,0.05)", display: "flex", gap: 0 }}>
              <SizeCol label="Tamaño original" value={fmtBytes(file.size)} sub={file.name} color="#0A0F1E" />
              <div style={{ width: 1, background: "rgba(10,15,30,0.07)", alignSelf: "stretch" }} />
              <SizeCol
                label={result ? "Tamaño comprimido" : "Tamaño estimado"}
                value={result ? fmtBytes(result.compressedSize) : "—"}
                sub={result ? `${savingPct}% reducción` : `${dpi} DPI · ${quality}% calidad`}
                color={result ? (savingPct > 40 ? "#16A34A" : "#D97706") : "#8494A8"}
              />
              <div style={{ width: 1, background: "rgba(10,15,30,0.07)", alignSelf: "stretch" }} />
              <SizeCol
                label="Ahorro"
                value={result ? `${savingPct}%` : "—"}
                sub={result ? fmtBytes(result.originalSize - result.compressedSize) + " liberados" : "comprime para ver"}
                color={result ? (savingPct > 40 ? "#16A34A" : "#D97706") : "#8494A8"}
              />
            </div>

            {result && (
              <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", fontSize: 13, fontWeight: 600 }}>
                ✓ Descargado — {fmtBytes(result.originalSize)} → {fmtBytes(result.compressedSize)} · {savingPct}% reducción · {dpi} DPI · {quality}% calidad
              </div>
            )}

            <button onClick={handleCompress} disabled={loading}
              style={{ padding: "14px 40px", borderRadius: 12, border: "none", background: loading ? "#C8D1E0" : "linear-gradient(135deg,#00C2CB,#0099FF)", color: loading ? "#8494A8" : "#0A0F1E", fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 4px 18px rgba(0,194,203,0.35)", transition: "all .2s" }}>
              {loading ? "Comprimiendo..." : `🗜️ Comprimir · ${dpi} DPI · ${quality}% calidad`}
            </button>
          </>
        )}
      </div>
    </>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "#556070", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>{children}</div>;
}

function SizeCol({ label, value, sub, color }) {
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "4px 20px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: -0.5, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#8494A8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  );
}
