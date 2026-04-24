import { useState } from "react";

// ── Data ──────────────────────────────────────────────
const FINDINGS = [
  { id: 1, severity: "high",   title: "Cédula duplicada en varias páginas", description: "El número 1.082.934.221 aparece como comprador en pág. 14 y también como testigo en pág. 23.", page: 14, rule: "coherencia_identidad" },
  { id: 2, severity: "medium", title: "Página 7 escaneada borrosa",        description: "Calidad OCR baja (62%) — algunas cláusulas podrían no ser extraídas correctamente.", page: 7, rule: "calidad_ocr" },
  { id: 3, severity: "medium", title: "Fecha de firma fuera de rango",     description: "La fecha del contrato (12/ene/2026) es anterior al avalúo (03/feb/2026).", page: 14, rule: "coherencia_fechas" },
  { id: 4, severity: "low",    title: "Metadato de autor sin limpiar",     description: "El archivo contiene el autor original del PDF. Recomendamos limpiarlo antes de archivar.", page: 1, rule: "privacidad_metadata" },
  { id: 5, severity: "ok",     title: "Firmas digitales válidas",          description: "Ambas firmas tienen certificado vigente y cadena de confianza verificada.", page: 14, rule: "firmas_digitales" },
];

const CHECKS = [
  { category: "Integridad", status: "ok",   label: "Archivo no corrupto",           detail: "48 págs" },
  { category: "Integridad", status: "ok",   label: "Páginas en orden secuencial" },
  { category: "Integridad", status: "warn", label: "1 página con OCR baja calidad", detail: "pág. 7" },
  { category: "Datos",      status: "warn", label: "Cédula duplicada",               detail: "págs. 14, 23" },
  { category: "Datos",      status: "ok",   label: "Fechas formato ISO" },
  { category: "Datos",      status: "ok",   label: "Montos coherentes" },
  { category: "Firmas",     status: "ok",   label: "2 firmas digitales válidas" },
  { category: "Firmas",     status: "ok",   label: "Certificados vigentes" },
  { category: "Privacidad", status: "warn", label: "Metadato autor sin limpiar" },
  { category: "Privacidad", status: "ok",   label: "Sin datos GPS embebidos" },
];

const ANNOTATIONS = {
  7:  [{ type: "warn",   top: 25, left: 10, width: 80, height: 18, label: "⚠ OCR 62%", note: "Calidad baja — algunas cláusulas podrían haberse extraído incorrectamente." }],
  14: [
    { type: "danger", top: 72, left: 10, width: 38, height: 10, label: "✕ Cédula duplicada", note: "Aparece también como testigo en pág. 23." },
    { type: "warn",   top: 6,  left: 54, width: 30, height: 5,  label: "⚠ Fecha inconsistente", note: "Anterior al avalúo (03/feb/2026)." },
  ],
};

const RECENT_DOCS = [
  { name: "expediente_042.pdf",        score: 97, active: true },
  { name: "contrato_vivienda_8821.pdf", score: 94, active: false },
  { name: "poliza_seguros_2031.pdf",   score: 82, active: false },
  { name: "avaluo_inmueble_77.pdf",    score: 99, active: false },
  { name: "acta_entrega_551.pdf",      score: 91, active: false },
];

const INITIAL_CHAT = [
  { role: "system", text: "Validación completada · 48 páginas · 3 hallazgos requieren atención" },
  { role: "ai", text: "Hola Ana María. He analizado el expediente_042.pdf y encontré 3 observaciones relevantes: una cédula duplicada entre páginas 14 y 23, un posible problema de OCR en la página 7, y una inconsistencia de fechas entre el contrato y el avalúo. ¿Por dónde quieres empezar?", refs: ["pág. 14", "pág. 7", "pág. 23"] },
  { role: "user", text: "Muéstrame la firma de la página 14, ¿es válida?" },
  { role: "ai", text: "Sí, ambas firmas de la página 14 son válidas: tienen certificado digital vigente y la cadena de confianza se verifica contra la Cámara de Comercio. La firma del comprador coincide con la cédula 1.082.934.221 — pero precisamente esa cédula aparece también como testigo en la página 23, lo cual es inusual.", refs: ["pág. 14 · firmas", "pág. 23"] },
];

// ── Annotation overlay ────────────────────────────────
function Annotation({ type, top, left, width, height, label }) {
  const tones = {
    warn:   { stroke: "#F59E0B", fill: "rgba(245,158,11,0.18)", labelBg: "#F59E0B", labelFg: "#0A0F1E" },
    danger: { stroke: "#EF4444", fill: "rgba(239,68,68,0.18)",  labelBg: "#EF4444", labelFg: "#fff" },
    info:   { stroke: "#00C2CB", fill: "rgba(0,194,203,0.18)",  labelBg: "#00C2CB", labelFg: "#0A0F1E" },
  };
  const t = tones[type] || tones.info;
  return (
    <div style={{
      position: "absolute", top: `${top}%`, left: `${left}%`,
      width: `${width}%`, height: `${height}%`,
      border: `2px solid ${t.stroke}`, background: t.fill,
      borderRadius: 4, animation: "nx-annot-flash 2.5s infinite",
    }}>
      <div style={{ position: "absolute", top: -24, left: -2, background: t.labelBg, color: t.labelFg, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: "4px 4px 4px 0", whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
}

// ── PDF Viewer ────────────────────────────────────────
function PdfViewer({ currentPage, setCurrentPage }) {
  const totalPages = 48;
  const annotations = ANNOTATIONS[currentPage] || [];

  const ToolBtn = ({ icon, label, tone, onClick }) => {
    const [hover, setHover] = useState(false);
    const bg = tone === "accent" ? (hover ? "linear-gradient(135deg,#00C2CB,#0099FF)" : "rgba(0,194,203,0.15)") : (hover ? "rgba(255,255,255,0.1)" : "transparent");
    const color = tone === "accent" ? (hover ? "#0A0F1E" : "#00C2CB") : "rgba(255,255,255,0.75)";
    return (
      <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} title={label} style={{ width: 30, height: 30, borderRadius: 7, border: "none", background: bg, color, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>{icon}</button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#2D3A52" }}>
      {/* Toolbar */}
      <div style={{ height: 48, background: "#1A2234", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", color: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ToolBtn icon="◀" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} />
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 7, padding: "4px 12px", fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#fff", minWidth: 78, textAlign: "center" }}>
            <span style={{ color: "#00C2CB" }}>{String(currentPage).padStart(2, "0")}</span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}> / {totalPages}</span>
          </div>
          <ToolBtn icon="▶" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} />
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
          <ToolBtn icon="−" label="Zoom out" />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace", minWidth: 42, textAlign: "center" }}>100%</div>
          <ToolBtn icon="+" label="Zoom in" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>expediente_042.pdf</div>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
          <ToolBtn icon="⤓" label="Descargar" />
          <ToolBtn icon="⚡" label="Re-validar" tone="accent" />
        </div>
      </div>

      {/* Page area */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "28px 0", backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
        <div style={{ width: 520, background: "#fff", borderRadius: 6, boxShadow: "0 12px 48px rgba(0,0,0,0.4)", position: "relative", overflow: "hidden", aspectRatio: "0.77" }}>
          <div style={{ padding: "36px 48px 0" }}>
            <div style={{ fontSize: 9, color: "#8494A8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 }}>Constructora Bolívar S.A.</div>
            <div style={{ height: 16, width: "75%", background: "#0A0F1E", borderRadius: 2, marginBottom: 5 }} />
            <div style={{ height: 9, width: "55%", background: "rgba(10,15,30,0.5)", borderRadius: 1 }} />
            <div style={{ fontSize: 8, color: "#8494A8", marginTop: 10, fontFamily: "'JetBrains Mono', monospace" }}>EXP-2026-042 · Página {currentPage} de 48</div>
          </div>
          <div style={{ padding: "20px 48px" }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 1, marginBottom: 6, background: "rgba(10,15,30,0.12)", width: `${95 - (i % 5) * 8}%` }} />
            ))}
          </div>
          {currentPage === 14 && (
            <div style={{ position: "absolute", bottom: 70, left: 48, right: 48 }}>
              <div style={{ fontSize: 8, color: "#8494A8", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Firmas</div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1, borderTop: "1px solid #0A0F1E", paddingTop: 5 }}>
                  <div style={{ fontSize: 7, color: "#8494A8" }}>Comprador</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#0A0F1E", marginTop: 2 }}>C.C. 1.082.934.221</div>
                </div>
                <div style={{ flex: 1, borderTop: "1px solid #0A0F1E", paddingTop: 5 }}>
                  <div style={{ fontSize: 7, color: "#8494A8" }}>Representante legal</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#0A0F1E", marginTop: 2 }}>Apoderado CB</div>
                </div>
              </div>
            </div>
          )}
          {annotations.map((a, i) => <Annotation key={i} {...a} />)}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div style={{ height: 88, background: "#1A2234", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, padding: "10px 16px", overflowX: "auto", flexShrink: 0 }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const page = i + 1;
          const isActive = page === currentPage;
          const hasIssue = ANNOTATIONS[page]?.length > 0;
          return (
            <div key={page} onClick={() => setCurrentPage(page)} style={{ flexShrink: 0, width: 50, aspectRatio: "0.77", background: "#fff", borderRadius: 5, cursor: "pointer", border: isActive ? "2px solid #00C2CB" : "1px solid rgba(255,255,255,0.12)", boxShadow: isActive ? "0 0 14px rgba(0,194,203,0.5)" : "none", position: "relative", padding: 4, transition: "all .15s" }}>
              <div style={{ height: "100%", width: "100%", backgroundImage: "repeating-linear-gradient(180deg,transparent 0 4px,rgba(10,15,30,0.12) 4px 5px)", backgroundPosition: "0 6px" }} />
              <div style={{ position: "absolute", bottom: -16, left: 0, right: 0, textAlign: "center", fontSize: 9, fontWeight: 700, color: isActive ? "#00C2CB" : "rgba(255,255,255,0.5)" }}>{page}</div>
              {hasIssue && <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: "#F59E0B", color: "#0A0F1E", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px #1A2234" }}>!</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Findings panel ────────────────────────────────────
function FindingRow({ f, selected, onClick }) {
  const [hover, setHover] = useState(false);
  const tones = {
    high:   { bg: "rgba(239,68,68,0.06)",  bd: "rgba(239,68,68,0.22)",  fg: "#EF4444", icon: "✕" },
    medium: { bg: "rgba(245,158,11,0.06)", bd: "rgba(245,158,11,0.22)", fg: "#F59E0B", icon: "!" },
    low:    { bg: "rgba(0,194,203,0.05)",  bd: "rgba(0,194,203,0.2)",   fg: "#00C2CB", icon: "i" },
    ok:     { bg: "rgba(16,185,129,0.05)", bd: "rgba(16,185,129,0.2)",  fg: "#10B981", icon: "✓" },
  };
  const t = tones[f.severity];
  const isActive = selected || hover;
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: isActive ? t.bg : "#fff", border: `1px solid ${isActive ? t.bd : "rgba(10,15,30,0.08)"}`, borderRadius: 11, padding: "10px 12px", cursor: "pointer", transition: "all .15s", boxShadow: selected ? `0 2px 12px ${t.bd}` : "none", marginBottom: 6 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: t.fg, color: f.severity === "high" ? "#fff" : "#0A0F1E", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{t.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0A0F1E" }}>{f.title}</div>
            <span style={{ fontSize: 9, color: t.fg, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6, padding: "1px 6px", background: t.bg, borderRadius: 4 }}>
              {f.severity === "high" ? "Crítico" : f.severity === "medium" ? "Medio" : f.severity === "low" ? "Bajo" : "OK"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#556070", lineHeight: 1.45, marginBottom: 5 }}>{f.description}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#8494A8" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: t.fg, fontWeight: 700 }}>Pág. {f.page}</span>
            <span>·</span>
            <span>{f.rule}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecksList() {
  const grouped = CHECKS.reduce((acc, c) => { (acc[c.category] ||= []).push(c); return acc; }, {});
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10 }}>🔍 Chequeos automáticos</div>
      <div style={{ background: "#F6F8FB", borderRadius: 12, padding: 12 }}>
        {Object.entries(grouped).map(([cat, items], gi, arr) => (
          <div key={cat} style={{ marginBottom: gi < arr.length - 1 ? 12 : 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{cat}</div>
            {items.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, flexShrink: 0, background: c.status === "ok" ? "rgba(16,185,129,0.16)" : c.status === "warn" ? "rgba(245,158,11,0.16)" : "rgba(239,68,68,0.16)", color: c.status === "ok" ? "#10B981" : c.status === "warn" ? "#F59E0B" : "#EF4444" }}>
                  {c.status === "ok" ? "✓" : c.status === "warn" ? "!" : "✕"}
                </span>
                <span style={{ color: "#2D3A52", flex: 1 }}>{c.label}</span>
                {c.detail && <span style={{ fontSize: 10, color: "#8494A8", fontFamily: "'JetBrains Mono', monospace" }}>{c.detail}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState(INITIAL_CHAT);
  const [input, setInput] = useState("");
  const suggestions = ["¿Qué páginas necesitan revisión?", "Extrae los datos del comprador", "Resume las cláusulas de la página 14", "Compara firmas con el expediente anterior"];

  const send = (text) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages(ms => [...ms, { role: "user", text: t }, { role: "ai", typing: true }]);
    setInput("");
    setTimeout(() => {
      setMessages(ms => ms.slice(0, -1).concat({ role: "ai", text: "He revisado los fragmentos relevantes. Puedo generarte un resumen de las cláusulas económicas o abrir el fragmento en el visor — dime qué prefieres." }));
    }, 1200);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span>💬 Conversar con la IA</span>
        <span style={{ fontSize: 9, padding: "1px 7px", background: "rgba(16,185,129,0.15)", color: "#10B981", borderRadius: 999, fontWeight: 700 }}>● EN LÍNEA</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, minHeight: 200 }}>
        {messages.map((m, i) => {
          if (m.role === "system") return (
            <div key={i} style={{ background: "rgba(0,194,203,0.05)", border: "1px solid rgba(0,194,203,0.15)", borderRadius: 10, padding: "8px 12px", fontSize: 11, color: "#556070", marginBottom: 10, textAlign: "center" }}>{m.text}</div>
          );
          return (
            <div key={i} style={{ marginBottom: 10, display: "flex", gap: 8, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
              {m.role === "ai" && <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>⚡</div>}
              {m.role === "user" && <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#0A0F1E", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>AM</div>}
              <div style={{ background: m.role === "user" ? "#0A0F1E" : "#fff", color: m.role === "user" ? "#fff" : "#2D3A52", border: m.role === "user" ? "none" : "1px solid rgba(10,15,30,0.08)", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "9px 12px", fontSize: 12.5, lineHeight: 1.5, maxWidth: "84%" }}>
                {m.typing ? (
                  <div style={{ display: "flex", gap: 4, padding: "2px 4px" }}>
                    {[0, 1, 2].map(j => <span key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C2CB", animation: `nx-typing 1.2s ${j * 0.15}s infinite`, display: "inline-block" }} />)}
                  </div>
                ) : (
                  <>
                    {m.text}
                    {m.refs && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {m.refs.map((r, j) => <span key={j} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(0,194,203,0.1)", color: "#00C2CB", borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>📎 {r}</span>)}
                    </div>}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, marginBottom: 8 }}>
        {suggestions.map(s => <button key={s} onClick={() => send(s)} style={{ background: "rgba(0,194,203,0.06)", color: "#00C2CB", border: "1px solid rgba(0,194,203,0.22)", borderRadius: 999, padding: "4px 10px", fontSize: 10.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>{s}</button>)}
      </div>
      <div style={{ background: "#F6F8FB", border: "1px solid rgba(10,15,30,0.08)", borderRadius: 12, padding: 8, display: "flex", alignItems: "flex-end", gap: 8 }}>
        <textarea value={input} rows={2} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Pregunta algo sobre el documento…" style={{ flex: 1, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 12, color: "#0A0F1E", resize: "none", outline: "none", padding: "4px 8px", lineHeight: 1.45 }} />
        <button onClick={() => send()} style={{ background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", padding: "8px 14px", borderRadius: 8, border: "none", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>→ Enviar</button>
      </div>
      <div style={{ fontSize: 10, color: "#8494A8", marginTop: 6, textAlign: "center" }}>Claude Sonnet 4.6 · las respuestas pueden contener imprecisiones</div>
    </div>
  );
}

// ── Score ring ────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 22, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score > 95 ? "#10B981" : score > 85 ? "#00C2CB" : "#F59E0B";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 52, height: 52 }}>
        <svg width={52} height={52}>
          <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(10,15,30,0.08)" strokeWidth={4} />
          <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 26 26)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.3 }}>{score}%</div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.9, color: "#8494A8" }}>Score de validación</div>
        <div style={{ fontSize: 12, color: "#0A0F1E", fontWeight: 700 }}>3 observaciones · <span style={{ color: "#10B981" }}>listo para aprobar</span></div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────
export default function ValidadorIA() {
  const [currentPage, setCurrentPage] = useState(14);
  const [selectedFinding, setSelectedFinding] = useState(1);
  const [tab, setTab] = useState("findings");

  const tabs = [
    { key: "findings", label: "Hallazgos", badge: 3 },
    { key: "checks",   label: "Chequeos", badge: null },
    { key: "chat",     label: "Conversar", badge: null },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Validador Sidebar */}
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
          <button style={{ width: "100%", background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", padding: "10px 16px", borderRadius: 10, border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>＋ Nueva validación</button>
        </div>
        <div style={{ padding: "14px 14px 8px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2, padding: "0 4px 10px" }}>Validaciones recientes</div>
          {RECENT_DOCS.map((r, i) => (
            <div key={i} style={{ padding: "9px 10px", borderRadius: 9, marginBottom: 3, cursor: "pointer", background: r.active ? "rgba(0,194,203,0.12)" : "transparent", border: r.active ? "1px solid rgba(0,194,203,0.3)" : "1px solid transparent" }}>
              <div style={{ fontSize: 11, color: r.active ? "#fff" : "#C8D1E0", fontWeight: 600, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {r.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${r.score}%`, height: "100%", background: r.score > 95 ? "#10B981" : r.score > 85 ? "#00C2CB" : "#F59E0B" }} />
                </div>
                <div style={{ fontSize: 10, color: r.active ? "#00C2CB" : "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{r.score}%</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px 18px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>← Volver al Dashboard</div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ height: 64, background: "#fff", borderBottom: "1px solid rgba(10,15,30,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", fontSize: 18, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(0,194,203,0.45)", animation: "nx-pulse 3s infinite" }}>⚡</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4 }}>Validador IA · Constructora Bolívar</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0A0F1E", letterSpacing: -0.3 }}>expediente_042.pdf <span style={{ fontSize: 11, color: "#8494A8", fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>EXP-2026-042 · 48 págs · 2.4 MB</span></div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <ScoreRing score={97} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ background: "#fff", border: "1px solid rgba(10,15,30,0.12)", color: "#556070", padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⤓ Exportar informe</button>
              <button style={{ background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 800, cursor: "pointer", border: "none", fontFamily: "inherit" }}>✓ Aprobar expediente</button>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <PdfViewer currentPage={currentPage} setCurrentPage={setCurrentPage} />

          {/* Right panel */}
          <div style={{ background: "#fff", borderLeft: "1px solid rgba(10,15,30,0.06)", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", gap: 4, padding: 12, borderBottom: "1px solid rgba(10,15,30,0.06)", flexShrink: 0 }}>
              {tabs.map(t => {
                const isActive = tab === t.key;
                return (
                  <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "8px 10px", background: isActive ? "linear-gradient(135deg,#00C2CB,#0099FF)" : "transparent", color: isActive ? "#0A0F1E" : "#556070", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", boxShadow: isActive ? "0 4px 14px rgba(0,194,203,0.25)" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {t.label}
                    {t.badge && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 999, background: isActive ? "#0A0F1E" : "rgba(239,68,68,0.12)", color: isActive ? "#00C2CB" : "#EF4444", fontWeight: 800 }}>{t.badge}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0 }}>
              {tab === "findings" && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>🎯 Hallazgos ({FINDINGS.length})</span>
                    <span style={{ color: "#8494A8", fontWeight: 600, fontSize: 10, textTransform: "none", letterSpacing: 0 }}>ordenados por severidad</span>
                  </div>
                  {FINDINGS.map(f => (
                    <FindingRow key={f.id} f={f} selected={selectedFinding === f.id} onClick={() => { setSelectedFinding(f.id); setCurrentPage(f.page); }} />
                  ))}
                </div>
              )}
              {tab === "checks" && <ChecksList />}
              {tab === "chat" && <ChatPanel />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
