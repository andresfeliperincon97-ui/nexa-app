import { useState, useRef } from "react";
import { validatePDF } from "../services/api";

// ── Severity helpers ──────────────────────────────────
const SEV_MAP = { error: "high", advertencia: "medium", ok: "ok" };
const SEV_TONES = {
  high:   { bg: "rgba(239,68,68,0.06)",  bd: "rgba(239,68,68,0.22)",  fg: "#EF4444", icon: "✕", label: "Crítico" },
  medium: { bg: "rgba(245,158,11,0.06)", bd: "rgba(245,158,11,0.22)", fg: "#F59E0B", icon: "!",  label: "Advertencia" },
  low:    { bg: "rgba(0,194,203,0.05)",  bd: "rgba(0,194,203,0.2)",   fg: "#00C2CB", icon: "i",  label: "Bajo" },
  ok:     { bg: "rgba(16,185,129,0.05)", bd: "rgba(16,185,129,0.2)",  fg: "#10B981", icon: "✓", label: "OK" },
};

const RESULTADO_STYLES = {
  APROBADO:                    { bg: "rgba(16,185,129,0.12)",  fg: "#10B981", icon: "✓" },
  APROBADO_CON_OBSERVACIONES:  { bg: "rgba(245,158,11,0.12)",  fg: "#F59E0B", icon: "⚠" },
  RECHAZADO:                   { bg: "rgba(239,68,68,0.12)",   fg: "#EF4444", icon: "✕" },
};

function mapHallazgo(h, i) {
  return { id: i + 1, severity: SEV_MAP[h.tipo] || "low", title: h.campo || "Hallazgo", description: h.descripcion, rule: h.tipo };
}

// ── Score ring ────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 22, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score > 90 ? "#10B981" : score > 75 ? "#00C2CB" : "#F59E0B";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 52, height: 52 }}>
        <svg width={52} height={52}>
          <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(10,15,30,0.08)" strokeWidth={4} />
          <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 26 26)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.3 }}>{score}%</div>
      </div>
    </div>
  );
}

// ── Upload phase ──────────────────────────────────────
function UploadForm({ file, setFile, tipoTramite, setTipoTramite, criterios, setCriterios, onRun, error, loading }) {
  const fileRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const pickFile = (f) => {
    if (f && f.name.toLowerCase().endsWith(".pdf")) setFile(f);
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "#F6F8FB" }}>
      <div style={{ width: "100%", maxWidth: 580, background: "#fff", borderRadius: 20, border: "1px solid rgba(10,15,30,0.08)", boxShadow: "0 4px 24px rgba(10,15,30,0.06)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#0A0F1E,#1A2234)", padding: "28px 32px", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#00C2CB,#0099FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#0A0F1E", boxShadow: "0 0 24px rgba(0,194,203,0.5)", animation: "nx-pulse 3s infinite" }}>⚡</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.6, marginBottom: 3 }}>Validador IA · Claude Sonnet 4.6</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>Nueva validación de expediente</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Drop zone */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#556070", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>Documento PDF</label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
              style={{
                border: `2px dashed ${drag ? "#00C2CB" : file ? "#10B981" : "rgba(10,15,30,0.15)"}`,
                borderRadius: 14, padding: "28px 20px", textAlign: "center", cursor: "pointer",
                background: drag ? "rgba(0,194,203,0.04)" : file ? "rgba(16,185,129,0.04)" : "#F6F8FB",
                transition: "all .2s",
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => pickFile(e.target.files[0])} />
              {file ? (
                <>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: "#8494A8", marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Haz clic para cambiar</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>☁️</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2D3A52" }}>Arrastra tu PDF aquí o haz clic</div>
                  <div style={{ fontSize: 11, color: "#8494A8", marginTop: 4 }}>Solo archivos PDF · máx. 20 MB</div>
                </>
              )}
            </div>
          </div>

          {/* Tipo trámite */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#556070", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>Tipo de trámite</label>
            <select
              value={tipoTramite}
              onChange={e => setTipoTramite(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(10,15,30,0.12)", fontSize: 13, fontFamily: "inherit", color: "#0A0F1E", background: "#fff", outline: "none", cursor: "pointer" }}
            >
              <option>Desembolso Subsidio Colsubsidio</option>
              <option>Desembolso Caja Compensación</option>
              <option>Personalizado</option>
            </select>
          </div>

          {/* Criterios */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#556070", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>Criterios adicionales <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
            <textarea
              value={criterios}
              onChange={e => setCriterios(e.target.value)}
              rows={3}
              placeholder="Ej: Verificar que el pagaré esté firmado por ambas partes. Confirmar vigencia de la carta laboral…"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(10,15,30,0.12)", fontSize: 13, fontFamily: "inherit", color: "#0A0F1E", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#EF4444", fontWeight: 600 }}>
              ✕ {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onRun}
            disabled={!file || loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: file ? "pointer" : "not-allowed",
              background: file ? "linear-gradient(135deg,#00C2CB,#0099FF)" : "rgba(10,15,30,0.08)",
              color: file ? "#0A0F1E" : "#8494A8", fontSize: 15, fontWeight: 800, fontFamily: "inherit",
              boxShadow: file ? "0 4px 18px rgba(0,194,203,0.35)" : "none",
              transition: "all .2s",
            }}
          >
            {loading ? "Analizando…" : "⚡ Ejecutar Validación IA"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Loading phase ─────────────────────────────────────
function LoadingView({ filename }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, background: "#F6F8FB" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#00C2CB,#0099FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#0A0F1E", boxShadow: "0 0 32px rgba(0,194,203,0.5)", animation: "nx-pulse 1.5s infinite" }}>⚡</div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#0A0F1E", marginBottom: 6 }}>Analizando con IA…</div>
        <div style={{ fontSize: 13, color: "#556070" }}>Claude Sonnet 4.6 está revisando <strong>{filename}</strong></div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {["Extrayendo texto", "Analizando criterios", "Generando reporte"].map((s, i) => (
          <div key={s} style={{ padding: "6px 14px", borderRadius: 999, background: "#fff", border: "1px solid rgba(10,15,30,0.08)", fontSize: 11, color: "#8494A8", fontWeight: 600, animation: `nx-typing 1.5s ${i * 0.4}s infinite` }}>{s}</div>
        ))}
      </div>
    </div>
  );
}

// ── Result finding row ────────────────────────────────
function FindingRow({ f }) {
  const [hover, setHover] = useState(false);
  const t = SEV_TONES[f.severity] || SEV_TONES.low;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? t.bg : "#fff", border: `1px solid ${hover ? t.bd : "rgba(10,15,30,0.08)"}`, borderRadius: 11, padding: "10px 12px", transition: "all .15s", marginBottom: 6 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: t.fg, color: f.severity === "high" ? "#fff" : "#0A0F1E", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{t.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0A0F1E" }}>{f.title}</div>
            <span style={{ fontSize: 9, color: t.fg, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6, padding: "1px 6px", background: t.bg, borderRadius: 4 }}>{t.label}</span>
          </div>
          <div style={{ fontSize: 11, color: "#556070", lineHeight: 1.45 }}>{f.description}</div>
        </div>
      </div>
    </div>
  );
}

// ── Result view ───────────────────────────────────────
function ResultView({ result, onReset, onDownload }) {
  const [tab, setTab] = useState("hallazgos");
  const findings = (result.hallazgos || []).map(mapHallazgo);
  const resultStyle = RESULTADO_STYLES[result.resultado_general] || RESULTADO_STYLES.APROBADO_CON_OBSERVACIONES;
  const errorCount = findings.filter(f => f.severity === "high").length;

  const TABS = [
    { key: "hallazgos",       label: "Hallazgos",    badge: findings.filter(f => f.severity !== "ok").length || null },
    { key: "documentos",      label: "Documentos",   badge: result.documentos_faltantes?.length || null },
    { key: "recomendaciones", label: "Acciones",     badge: null },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Topbar */}
      <div style={{ height: 64, background: "#fff", borderBottom: "1px solid rgba(10,15,30,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", fontSize: 18, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(0,194,203,0.45)", animation: "nx-pulse 3s infinite" }}>⚡</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4 }}>Validador IA · resultado</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.3 }}>
              {result.filename}{" "}
              <span style={{ fontSize: 11, color: "#8494A8", fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>{result.pages} págs.</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ScoreRing score={result.score} />
          <span style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, fontWeight: 800, background: resultStyle.bg, color: resultStyle.fg }}>
            {resultStyle.icon} {result.resultado_general?.replace(/_/g, " ")}
          </span>
          <button onClick={onDownload} style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.12)", color: "#556070", padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⤓ Descargar TXT</button>
          <button onClick={onReset} style={{ background: "rgba(10,15,30,0.04)", border: "1px solid rgba(10,15,30,0.1)", color: "#556070", padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>＋ Nueva validación</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 420px", overflow: "hidden" }}>
        {/* Summary card (left) */}
        <div style={{ background: "#F6F8FB", padding: 32, overflowY: "auto" }}>
          {/* Score + resultado */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(10,15,30,0.08)", padding: 24, marginBottom: 20, boxShadow: "0 1px 3px rgba(10,15,30,0.06)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 16 }}>📊 Resumen de validación</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { label: "Score IA",          value: `${result.score}%`,      color: result.score > 90 ? "#10B981" : result.score > 75 ? "#00C2CB" : "#F59E0B" },
                { label: "Hallazgos críticos", value: errorCount,             color: errorCount > 0 ? "#EF4444" : "#10B981" },
                { label: "Páginas analizadas", value: result.pages,           color: "#0A0F1E" },
              ].map(kpi => (
                <div key={kpi.label} style={{ textAlign: "center", padding: "16px 0", background: "#F6F8FB", borderRadius: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, letterSpacing: -1 }}>{kpi.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: resultStyle.bg, border: `1px solid ${resultStyle.fg}33`, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{resultStyle.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: resultStyle.fg }}>{result.resultado_general?.replace(/_/g, " ")}</div>
                <div style={{ fontSize: 11, color: "#556070", marginTop: 2 }}>Determinación automática basada en criterios Colsubsidio</div>
              </div>
            </div>
          </div>

          {/* Documentos faltantes */}
          {result.documentos_faltantes?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(245,158,11,0.2)", padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 12 }}>📋 Documentos faltantes ({result.documentos_faltantes.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.documentos_faltantes.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", background: "rgba(245,158,11,0.05)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.12)" }}>
                    <span style={{ color: "#F59E0B", fontWeight: 800, flexShrink: 0 }}>⚠</span>
                    <span style={{ fontSize: 13, color: "#2D3A52" }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          {result.recomendaciones?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,194,203,0.18)", padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 12 }}>💡 Recomendaciones ({result.recomendaciones.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.recomendaciones.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", background: "rgba(0,194,203,0.04)", borderRadius: 8, border: "1px solid rgba(0,194,203,0.1)" }}>
                    <span style={{ color: "#00C2CB", fontWeight: 800, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 13, color: "#2D3A52", lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: hallazgos */}
        <div style={{ background: "#fff", borderLeft: "1px solid rgba(10,15,30,0.06)", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", gap: 4, padding: 12, borderBottom: "1px solid rgba(10,15,30,0.06)", flexShrink: 0 }}>
            {TABS.map(t => {
              const isActive = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "8px 10px", background: isActive ? "linear-gradient(135deg,#00C2CB,#0099FF)" : "transparent", color: isActive ? "#0A0F1E" : "#556070", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", boxShadow: isActive ? "0 4px 14px rgba(0,194,203,0.25)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {t.label}
                  {t.badge ? <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: isActive ? "#0A0F1E" : "rgba(239,68,68,0.12)", color: isActive ? "#00C2CB" : "#EF4444", fontWeight: 800 }}>{t.badge}</span> : null}
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 14, minHeight: 0 }}>
            {tab === "hallazgos" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                  <span>🎯 Hallazgos ({findings.length})</span>
                  <span style={{ color: "#8494A8", fontWeight: 600, fontSize: 10, textTransform: "none" }}>ordenados por severidad</span>
                </div>
                {findings.length === 0 && <div style={{ textAlign: "center", color: "#8494A8", fontSize: 13, marginTop: 40 }}>No se encontraron hallazgos.</div>}
                {findings.map(f => <FindingRow key={f.id} f={f} />)}
              </>
            )}
            {tab === "documentos" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 12 }}>📋 Documentos faltantes</div>
                {(result.documentos_faltantes || []).length === 0
                  ? <div style={{ textAlign: "center", color: "#10B981", fontSize: 13, marginTop: 40, fontWeight: 700 }}>✓ No faltan documentos.</div>
                  : result.documentos_faltantes.map((d, i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.05)", marginBottom: 8, fontSize: 13, color: "#2D3A52" }}>
                      <span style={{ color: "#F59E0B", fontWeight: 800, marginRight: 8 }}>⚠</span>{d}
                    </div>
                  ))
                }
              </>
            )}
            {tab === "recomendaciones" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 12 }}>💡 Acciones recomendadas</div>
                {(result.recomendaciones || []).length === 0
                  ? <div style={{ textAlign: "center", color: "#8494A8", fontSize: 13, marginTop: 40 }}>Sin recomendaciones adicionales.</div>
                  : result.recomendaciones.map((r, i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,194,203,0.15)", background: "rgba(0,194,203,0.04)", marginBottom: 8, fontSize: 13, color: "#2D3A52", lineHeight: 1.5 }}>
                      <span style={{ color: "#00C2CB", fontWeight: 800, marginRight: 8 }}>→</span>{r}
                    </div>
                  ))
                }
                <button onClick={onDownload} style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 10, border: "1px solid rgba(10,15,30,0.12)", background: "#fff", color: "#556070", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  ⤓ Descargar reporte completo TXT
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────
export default function ValidadorIA() {
  const [phase, setPhase]           = useState("upload");
  const [file, setFile]             = useState(null);
  const [tipoTramite, setTipoTramite] = useState("Desembolso Subsidio Colsubsidio");
  const [criterios, setCriterios]   = useState("");
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);

  const run = async () => {
    if (!file) return;
    setPhase("loading");
    setError(null);
    try {
      const data = await validatePDF(file, tipoTramite, criterios);
      setResult(data);
      setPhase("result");
    } catch (e) {
      setError(e.message || "Error al validar el documento");
      setPhase("upload");
    }
  };

  const reset = () => {
    setPhase("upload");
    setFile(null);
    setCriterios("");
    setResult(null);
    setError(null);
  };

  const downloadTxt = () => {
    if (!result) return;
    const sep = "─".repeat(44);
    const lines = [
      "REPORTE DE VALIDACIÓN IA — NEXA",
      "═".repeat(44),
      `Archivo:   ${result.filename}`,
      `Páginas:   ${result.pages}`,
      `Score:     ${result.score}%`,
      `Resultado: ${result.resultado_general}`,
      "",
      "HALLAZGOS",
      sep,
      ...(result.hallazgos || []).map(h => `[${h.tipo.toUpperCase()}] ${h.campo}\n  ${h.descripcion}`),
      "",
      "DOCUMENTOS FALTANTES",
      sep,
      ...(result.documentos_faltantes?.length ? result.documentos_faltantes.map(d => `• ${d}`) : ["Ninguno"]),
      "",
      "RECOMENDACIONES",
      sep,
      ...(result.recomendaciones || []).map(r => `• ${r}`),
      "",
      `Generado por NEXA · Claude Sonnet 4.6 · ${new Date().toLocaleString("es-CO")}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `reporte_nexa_${result.filename?.replace(".pdf", "")}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, minWidth: 240, background: "#0A0F1E", display: "flex", flexDirection: "column", height: "100vh", borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ padding: "20px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#00C2CB,#0099FF)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0F1E", fontSize: 12, fontWeight: 900, boxShadow: "0 0 18px rgba(0,194,203,0.5)" }}>NX</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>NEXA</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 1 }}>Validador IA</div>
            </div>
          </div>
        </div>
        <div style={{ padding: 14, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <button onClick={reset} style={{ width: "100%", background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", padding: "10px 16px", borderRadius: 10, border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>＋ Nueva validación</button>
        </div>
        <div style={{ padding: "14px 14px 8px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2, padding: "0 4px 12px" }}>Estado actual</div>
          <div style={{ padding: "12px 10px", borderRadius: 9, background: "rgba(0,194,203,0.08)", border: "1px solid rgba(0,194,203,0.2)" }}>
            <div style={{ fontSize: 10, color: "#00C2CB", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              {phase === "upload" ? "● Listo" : phase === "loading" ? "⟳ Procesando" : "✓ Completado"}
            </div>
            {file && <div style={{ fontSize: 11, color: "#C8D1E0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {file.name}</div>}
            {result && (
              <div style={{ marginTop: 6 }}>
                <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${result.score}%`, height: "100%", background: result.score > 90 ? "#10B981" : result.score > 75 ? "#00C2CB" : "#F59E0B" }} />
                </div>
                <div style={{ fontSize: 10, color: "#00C2CB", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, marginTop: 4 }}>{result.score}%</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: "12px 14px 18px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", padding: "8px 10px", lineHeight: 1.4 }}>Claude Sonnet 4.6 · Colsubsidio criterios v1.0</div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {phase === "upload" && (
          <UploadForm
            file={file} setFile={setFile}
            tipoTramite={tipoTramite} setTipoTramite={setTipoTramite}
            criterios={criterios} setCriterios={setCriterios}
            onRun={run} error={error}
          />
        )}
        {phase === "loading" && <LoadingView filename={file?.name} />}
        {phase === "result" && result && (
          <ResultView result={result} onReset={reset} onDownload={downloadTxt} />
        )}
      </div>
    </div>
  );
}
