import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Topbar from "../components/Topbar";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const API_URL = import.meta.env.VITE_API_URL || "https://nexa-app-backend.onrender.com";
let _uid = 0;
const uid = () => `a${++_uid}`;

const TOOLS = [
  { id: "select",    icon: "↖",  label: "Seleccionar" },
  { id: "text",      icon: "T",  label: "Texto" },
  { id: "highlight", icon: "▬",  label: "Resaltar" },
  { id: "redact",    icon: "■",  label: "Redactar" },
  { id: "rect",      icon: "□",  label: "Rectángulo" },
  { id: "ellipse",   icon: "◯",  label: "Elipse" },
  { id: "arrow",     icon: "↗",  label: "Flecha" },
  { id: "line",      icon: "╱",  label: "Línea" },
  { id: "stamp",     icon: "✦",  label: "Sello" },
  { id: "signature", icon: "✍",  label: "Firma" },
  { id: "watermark", icon: "≋",  label: "Marca agua" },
];

const STAMPS = [
  { id: "approved",     text: "APROBADO ✓",   color: "#16A34A" },
  { id: "rejected",     text: "RECHAZADO ✗",  color: "#DC2626" },
  { id: "confidential", text: "CONFIDENCIAL", color: "#7C3AED" },
  { id: "draft",        text: "BORRADOR",      color: "#F59E0B" },
  { id: "reviewed",     text: "REVISADO",      color: "#0099FF" },
];

// ── Signature modal ───────────────────────────────────────
function SignatureModal({ onApply, onClose }) {
  const canvasRef = useRef();
  const drawing = useRef(false);
  const last = useRef(null);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  };

  const start = (e) => { drawing.current = true; last.current = pos(e); };
  const move = (e) => {
    if (!drawing.current) return;
    const p = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#0A0F1E"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.stroke();
    last.current = p;
  };
  const stop = () => { drawing.current = false; };
  const clear = () => {
    const c = canvasRef.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0A0F1E", marginBottom: 4 }}>Dibujar firma</div>
        <div style={{ fontSize: 12, color: "#8494A8", marginBottom: 14 }}>Dibuja tu firma con el mouse o el dedo</div>
        <canvas ref={canvasRef} width={432} height={160}
          style={{ border: "1px solid rgba(10,15,30,0.15)", borderRadius: 10, cursor: "crosshair", display: "block", background: "#fafafa", width: "100%", height: 160 }}
          onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
          onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <Btn onClick={clear} bg="#F6F8FB" fg="#556070">Limpiar</Btn>
          <div style={{ flex: 1 }} />
          <Btn onClick={onClose} bg="#F6F8FB" fg="#556070">Cancelar</Btn>
          <Btn onClick={() => onApply(canvasRef.current.toDataURL())} bg="linear-gradient(135deg,#00C2CB,#0099FF)" fg="#0A0F1E">Aplicar firma</Btn>
        </div>
      </div>
    </div>
  );
}

function Btn({ onClick, bg, fg, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: bg, color: fg, fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

// ── Watermark modal ───────────────────────────────────────
function WatermarkModal({ initial, onApply, onClose }) {
  const [text, setText] = useState(initial || "CONFIDENCIAL");
  const [color, setColor] = useState("#999999");
  const [opacity, setOpacity] = useState(25);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Marca de agua</div>
        {[
          ["Texto", <input value={text} onChange={e => setText(e.target.value)} style={inputSt} />],
          ["Color", <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ ...inputSt, height: 36, cursor: "pointer" }} />],
          ["Opacidad", <input type="range" min={5} max={80} value={opacity} onChange={e => setOpacity(+e.target.value)} style={{ width: "100%" }} />],
        ].map(([label, ctrl]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={labelSt}>{label}</div>
            {ctrl}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn onClick={onClose} bg="#F6F8FB" fg="#556070">Cancelar</Btn>
          <Btn onClick={() => onApply({ text, color, opacity: opacity / 100 })} bg="linear-gradient(135deg,#00C2CB,#0099FF)" fg="#0A0F1E">Aplicar</Btn>
        </div>
      </div>
    </div>
  );
}

const inputSt = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(10,15,30,0.12)", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", color: "#0A0F1E", background: "#F6F8FB", outline: "none" };
const labelSt = { fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 };

// ── Properties panel ──────────────────────────────────────
function PropertiesPanel({ ann, onChange, onDelete }) {
  if (!ann) {
    return (
      <div style={{ width: 250, flexShrink: 0, background: "#fff", borderLeft: "1px solid rgba(10,15,30,0.08)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center", color: "#C8D1E0" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>☝</div>
          <div style={{ fontSize: 11, lineHeight: 1.5 }}>Selecciona un elemento para ver sus propiedades</div>
        </div>
      </div>
    );
  }

  const row = (label, ctrl) => (
    <div key={label} style={{ marginBottom: 16 }}>
      <div style={labelSt}>{label}</div>
      {ctrl}
    </div>
  );

  const hasText = ["text", "stamp", "watermark"].includes(ann.type);
  const hasStroke = ["rect", "ellipse", "line", "arrow", "highlight"].includes(ann.type);

  return (
    <div style={{ width: 250, flexShrink: 0, background: "#fff", borderLeft: "1px solid rgba(10,15,30,0.08)", padding: "16px 14px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#0A0F1E", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.8 }}>Propiedades</div>

      {row("Color", <input type="color" value={ann.color || "#000000"} onChange={e => onChange({ color: e.target.value })} style={{ ...inputSt, height: 36, cursor: "pointer" }} />)}

      {hasText && row("Tamaño de fuente",
        <input type="number" min={6} max={96} value={ann.fontSize || 14} onChange={e => onChange({ fontSize: +e.target.value })} style={inputSt} />
      )}

      {ann.type === "text" && row("Texto",
        <textarea rows={3} value={ann.text || ""} onChange={e => onChange({ text: e.target.value })} style={{ ...inputSt, resize: "vertical" }} />
      )}

      {hasStroke && row("Grosor de línea",
        <>
          <input type="range" min={1} max={12} value={ann.strokeWidth || 2} onChange={e => onChange({ strokeWidth: +e.target.value })} style={{ width: "100%", marginBottom: 2 }} />
          <div style={{ fontSize: 11, color: "#8494A8" }}>{ann.strokeWidth || 2}px</div>
        </>
      )}

      {ann.type === "rect" && row("Relleno",
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#0A0F1E" }}>
          <input type="checkbox" checked={!!ann.fill} onChange={e => onChange({ fill: e.target.checked })} />
          Aplicar relleno
        </label>
      )}

      {row("Opacidad",
        <>
          <input type="range" min={10} max={100} value={Math.round((ann.opacity ?? 1) * 100)} onChange={e => onChange({ opacity: e.target.value / 100 })} style={{ width: "100%", marginBottom: 2 }} />
          <div style={{ fontSize: 11, color: "#8494A8" }}>{Math.round((ann.opacity ?? 1) * 100)}%</div>
        </>
      )}

      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        <button onClick={onDelete} style={{ width: "100%", padding: 10, borderRadius: 9, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#DC2626", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          🗑 Eliminar
        </button>
      </div>
    </div>
  );
}

// ── Annotation SVG element ────────────────────────────────
function AnnEl({ ann, cw, ch, onDown }) {
  const x = ann.x * cw, y = ann.y * ch;
  const w = (ann.w || 0.2) * cw, h = (ann.h || 0.06) * ch;
  const c = ann.color || "#000000";
  const op = ann.opacity ?? 1;
  const sw = ann.strokeWidth || 2;
  const dn = (e) => { e.stopPropagation(); onDown(e, ann.id); };

  switch (ann.type) {
    case "text":
      return (
        <text x={x} y={y} fontSize={ann.fontSize || 14} fill={c} opacity={op} style={{ cursor: "move", userSelect: "none" }} onPointerDown={dn}>
          {(ann.text || "").split("\n").map((l, i) => (
            <tspan key={i} x={x} dy={i === 0 ? ann.fontSize || 14 : (ann.fontSize || 14) * 1.3}>{l}</tspan>
          ))}
        </text>
      );
    case "highlight":
      return <rect x={x} y={y} width={w} height={h} fill={c || "#FFFF00"} opacity={op} style={{ cursor: "move", mixBlendMode: "multiply" }} onPointerDown={dn} />;
    case "redact":
      return <rect x={x} y={y} width={w} height={h} fill="#000" opacity={op} style={{ cursor: "move" }} onPointerDown={dn} />;
    case "rect":
      return <rect x={x} y={y} width={w} height={h} stroke={c} strokeWidth={sw} fill={ann.fill ? c : "none"} fillOpacity={ann.fill ? 0.15 : 0} opacity={op} style={{ cursor: "move" }} onPointerDown={dn} />;
    case "ellipse":
      return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} stroke={c} strokeWidth={sw} fill="none" opacity={op} style={{ cursor: "move" }} onPointerDown={dn} />;
    case "line": {
      const x2 = (ann.x2 ?? ann.x + 0.2) * cw, y2 = (ann.y2 ?? ann.y) * ch;
      return <line x1={x} y1={y} x2={x2} y2={y2} stroke={c} strokeWidth={sw} opacity={op} strokeLinecap="round" style={{ cursor: "move" }} onPointerDown={dn} />;
    }
    case "arrow": {
      const x2 = (ann.x2 ?? ann.x + 0.2) * cw, y2 = (ann.y2 ?? ann.y) * ch;
      const mid = `arr_${ann.id}`;
      return (
        <g onPointerDown={dn} style={{ cursor: "move" }} opacity={op}>
          <defs><marker id={mid} markerWidth={10} markerHeight={7} refX={9} refY={3.5} orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill={c} /></marker></defs>
          <line x1={x} y1={y} x2={x2} y2={y2} stroke={c} strokeWidth={sw} markerEnd={`url(#${mid})`} strokeLinecap="round" />
        </g>
      );
    }
    case "stamp": {
      const fs = ann.fontSize || 16;
      const tw = (ann.text || "SELLO").length * fs * 0.62 + 20;
      const th = fs + 16;
      return (
        <g onPointerDown={dn} style={{ cursor: "move" }} opacity={op}>
          <rect x={x} y={y} width={tw} height={th} stroke={c} strokeWidth={2} fill={c} fillOpacity={0.1} rx={4} />
          <text x={x + 10} y={y + th - 7} fontSize={fs} fill={c} fontWeight="bold" style={{ userSelect: "none" }}>{ann.text}</text>
        </g>
      );
    }
    case "signature":
      return ann.signatureData ? (
        <image href={ann.signatureData} x={x} y={y} width={w} height={h} opacity={op} style={{ cursor: "move" }} onPointerDown={dn} preserveAspectRatio="xMidYMid meet" />
      ) : null;
    case "watermark":
      return (
        <text x={cw * 0.1} y={ch * 0.6} fontSize={Math.min(cw, ch) * 0.11} fill={c || "#999"} opacity={op ?? 0.25}
          transform={`rotate(-40, ${cw * 0.1}, ${ch * 0.6})`} fontWeight="bold" style={{ userSelect: "none", pointerEvents: "none" }}>
          {ann.text || "CONFIDENCIAL"}
        </text>
      );
    default: return null;
  }
}

// ── Resize handles ────────────────────────────────────────
function ResizeHandles({ ann, cw, ch, onStart }) {
  if (!["rect", "ellipse", "highlight", "redact", "signature"].includes(ann.type)) return null;
  const x = ann.x * cw, y = ann.y * ch, w = (ann.w || 0.2) * cw, h = (ann.h || 0.06) * ch;
  const pts = [
    ["tl", x, y], ["tr", x + w, y], ["bl", x, y + h], ["br", x + w, y + h],
    ["tc", x + w / 2, y], ["bc", x + w / 2, y + h], ["ml", x, y + h / 2], ["mr", x + w, y + h / 2],
  ];
  const curs = { tl: "nwse-resize", tr: "nesw-resize", bl: "nesw-resize", br: "nwse-resize", tc: "ns-resize", bc: "ns-resize", ml: "ew-resize", mr: "ew-resize" };
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#00C2CB" strokeWidth={1} strokeDasharray="4 2" />
      {pts.map(([p, cx, cy]) => (
        <rect key={p} x={cx - 4} y={cy - 4} width={8} height={8} fill="#fff" stroke="#00C2CB" strokeWidth={1.5} rx={1}
          style={{ cursor: curs[p] }} onPointerDown={e => { e.stopPropagation(); onStart(e, ann.id, p); }} />
      ))}
    </g>
  );
}

// ── Inline text input ─────────────────────────────────────
function InlineTextInput({ screenX, screenY, onCommit, onCancel }) {
  const [val, setVal] = useState("");
  const ref = useRef();
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <textarea ref={ref} value={val} onChange={e => setVal(e.target.value)} rows={2}
      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommit(val); } if (e.key === "Escape") onCancel(); }}
      onBlur={() => onCommit(val)}
      style={{ position: "absolute", left: screenX, top: screenY, minWidth: 140, padding: "4px 8px", fontSize: 14, fontFamily: "inherit", border: "1.5px dashed #00C2CB", borderRadius: 5, background: "rgba(255,255,255,0.95)", outline: "none", resize: "none", zIndex: 20 }}
    />
  );
}

// ── Draw preview ──────────────────────────────────────────
function DrawPreview({ dp, tool, cw, ch }) {
  if (!dp) return null;
  const x = Math.min(dp.sx, dp.ex) * cw, y = Math.min(dp.sy, dp.ey) * ch;
  const w = Math.abs(dp.ex - dp.sx) * cw, h = Math.abs(dp.ey - dp.sy) * ch;
  const dash = { stroke: "#00C2CB", strokeWidth: 1.5, strokeDasharray: "5 3", fill: "none" };
  if (tool === "line" || tool === "arrow")
    return <line x1={dp.sx * cw} y1={dp.sy * ch} x2={dp.ex * cw} y2={dp.ey * ch} {...dash} />;
  if (tool === "ellipse")
    return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...dash} />;
  if (tool === "highlight")
    return <rect x={x} y={y} width={w} height={h} fill="#FFFF00" opacity={0.45} />;
  if (tool === "redact")
    return <rect x={x} y={y} width={w} height={h} fill="#000" opacity={0.5} />;
  return <rect x={x} y={y} width={w} height={h} {...dash} />;
}

// ── Main component ────────────────────────────────────────
export default function EditarPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [thumbnails, setThumbnails] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [tool, setTool] = useState("select");
  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dp, setDp] = useState(null); // draw preview
  const [dragState, setDragState] = useState(null);
  const [resizeState, setResizeState] = useState(null);
  const [inlineText, setInlineText] = useState(null);
  const [stampMenu, setStampMenu] = useState(false);
  const [showSig, setShowSig] = useState(false);
  const [showWm, setShowWm] = useState(false);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef();
  const svgRef = useRef();

  // ── Load PDF ──────────────────────────────────────────
  const loadPDF = useCallback(async (file) => {
    setPdfFile(file); setAnnotations([]); setSelectedId(null);
    setHistory([[]]); setHistoryIdx(0); setThumbnails([]);

    const buf = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buf }).promise;
    setPdfDoc(doc);
    setNumPages(doc.numPages);
    setCurrentPage(1);

    const thumbs = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const pg = await doc.getPage(i);
      const vp = pg.getViewport({ scale: 0.22 });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      thumbs.push(c.toDataURL());
    }
    setThumbnails(thumbs);
  }, []);

  // ── Render page ───────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let active = true;
    (async () => {
      const pg = await pdfDoc.getPage(currentPage);
      const vp = pg.getViewport({ scale: 1.5 });
      if (!active) return;
      const canvas = canvasRef.current;
      canvas.width = vp.width; canvas.height = vp.height;
      setCanvasSize({ w: vp.width, h: vp.height });
      await pg.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    })();
    return () => { active = false; };
  }, [pdfDoc, currentPage]);

  // ── History ───────────────────────────────────────────
  const push = useCallback((next) => {
    setHistory(h => [...h.slice(0, historyIdx + 1), next]);
    setHistoryIdx(i => i + 1);
    setAnnotations(next);
  }, [historyIdx]);

  const undo = () => {
    if (historyIdx === 0) return;
    const i = historyIdx - 1;
    setHistoryIdx(i); setAnnotations(history[i]); setSelectedId(null);
  };
  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const i = historyIdx + 1;
    setHistoryIdx(i); setAnnotations(history[i]); setSelectedId(null);
  };

  // ── SVG coords (fractional) ────────────────────────────
  const frac = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / canvasSize.w, y: (e.clientY - r.top) / canvasSize.h };
  };
  const screenPos = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const defaults = () => ({
    id: uid(), page: currentPage, color: "#000000", opacity: 1, strokeWidth: 2, fontSize: 14, fill: false,
  });

  // ── Pointer events on SVG ─────────────────────────────
  const onSvgDown = (e) => {
    if (e.target === svgRef.current) setSelectedId(null);
    if (tool === "select") return;

    const { x, y } = frac(e);
    const sp = screenPos(e);

    if (tool === "text") {
      setInlineText({ svgX: x, svgY: y, screenX: sp.x, screenY: sp.y });
      return;
    }
    if (tool === "stamp") { setStampMenu(v => !v); return; }
    if (tool === "signature") { setShowSig(true); return; }
    if (tool === "watermark") { setShowWm(true); return; }

    svgRef.current.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setDp({ sx: x, sy: y, ex: x, ey: y });
  };

  const onSvgMove = (e) => {
    if (dragState) {
      const { x, y } = frac(e);
      const dx = x - dragState.ox, dy = y - dragState.oy;
      setAnnotations(prev => prev.map(a => a.id === dragState.id
        ? { ...a, x: dragState.ax + dx, y: dragState.ay + dy, x2: a.x2 != null ? dragState.ax2 + dx : undefined, y2: a.y2 != null ? dragState.ay2 + dy : undefined }
        : a));
      return;
    }
    if (resizeState) {
      const { x, y } = frac(e);
      const { id, pos, orig } = resizeState;
      setAnnotations(prev => prev.map(a => {
        if (a.id !== id) return a;
        let { x: ax, y: ay, w: aw, h: ah } = orig;
        if (pos.includes("r")) aw = Math.max(0.01, x - ax);
        if (pos.includes("l")) { aw = Math.max(0.01, ax + aw - x); ax = x; }
        if (pos.includes("b")) ah = Math.max(0.01, y - ay);
        if (pos.includes("t")) { ah = Math.max(0.01, ay + ah - y); ay = y; }
        return { ...a, x: ax, y: ay, w: aw, h: ah };
      }));
      return;
    }
    if (isDrawing && dp) {
      const { x, y } = frac(e);
      setDp(p => ({ ...p, ex: x, ey: y }));
    }
  };

  const onSvgUp = (e) => {
    if (dragState) { push([...annotations]); setDragState(null); return; }
    if (resizeState) { push([...annotations]); setResizeState(null); return; }
    if (!isDrawing || !dp) { setIsDrawing(false); return; }

    setIsDrawing(false);
    const { sx, sy, ex, ey } = dp;
    setDp(null);
    if (Math.abs(ex - sx) < 0.005 && Math.abs(ey - sy) < 0.005) return;

    const bx = Math.min(sx, ex), by = Math.min(sy, ey);
    const bw = Math.abs(ex - sx), bh = Math.abs(ey - sy);

    let ann;
    if (tool === "line" || tool === "arrow")
      ann = { ...defaults(), type: tool, x: sx, y: sy, x2: ex, y2: ey };
    else if (tool === "highlight")
      ann = { ...defaults(), type: "highlight", x: bx, y: by, w: bw, h: bh, color: "#FFFF00", opacity: 0.5 };
    else if (tool === "redact")
      ann = { ...defaults(), type: "redact", x: bx, y: by, w: bw, h: bh };
    else
      ann = { ...defaults(), type: tool, x: bx, y: by, w: bw, h: bh };

    push([...annotations, ann]);
    setSelectedId(ann.id);
  };

  // ── Annotation drag ───────────────────────────────────
  const onAnnDown = (e, id) => {
    if (tool !== "select") return;
    e.stopPropagation();
    setSelectedId(id);
    const { x, y } = frac(e);
    const a = annotations.find(a => a.id === id);
    setDragState({ id, ox: x, oy: y, ax: a.x, ay: a.y, ax2: a.x2, ay2: a.y2 });
    svgRef.current.setPointerCapture(e.pointerId);
  };

  const onResizeStart = (e, id, pos) => {
    const a = annotations.find(a => a.id === id);
    setResizeState({ id, pos, orig: { x: a.x, y: a.y, w: a.w, h: a.h } });
    svgRef.current.setPointerCapture(e.pointerId);
  };

  // ── Text commit ───────────────────────────────────────
  const commitText = (text) => {
    if (!inlineText) return;
    setInlineText(null);
    if (!text.trim()) return;
    const ann = { ...defaults(), type: "text", x: inlineText.svgX, y: inlineText.svgY, text, w: 0.25, h: 0.06 };
    push([...annotations, ann]);
    setSelectedId(ann.id);
  };

  // ── Stamp ─────────────────────────────────────────────
  const applyStamp = (stamp) => {
    const ann = { ...defaults(), type: "stamp", x: 0.3, y: 0.35, text: stamp.text, color: stamp.color, fontSize: 16, w: 0.3, h: 0.08 };
    push([...annotations, ann]);
    setSelectedId(ann.id);
    setStampMenu(false);
    setTool("select");
  };

  // ── Signature ─────────────────────────────────────────
  const applySignature = (dataUrl) => {
    const ann = { ...defaults(), type: "signature", x: 0.25, y: 0.6, w: 0.35, h: 0.1, signatureData: dataUrl };
    push([...annotations, ann]);
    setSelectedId(ann.id);
    setShowSig(false);
    setTool("select");
  };

  // ── Watermark ─────────────────────────────────────────
  const applyWatermark = ({ text, color, opacity }) => {
    const existing = annotations.filter(a => a.type === "watermark" && a.page === currentPage);
    if (existing.length) {
      push(annotations.map(a => a.type === "watermark" && a.page === currentPage ? { ...a, text, color, opacity } : a));
    } else {
      push([...annotations, { ...defaults(), type: "watermark", x: 0, y: 0, text, color, opacity }]);
    }
    setShowWm(false);
    setTool("select");
  };

  // ── Update / delete selected ──────────────────────────
  const updateSel = (ch) => push(annotations.map(a => a.id === selectedId ? { ...a, ...ch } : a));
  const deleteSel = () => { push(annotations.filter(a => a.id !== selectedId)); setSelectedId(null); };

  // ── Save PDF ──────────────────────────────────────────
  const savePDF = async () => {
    if (!pdfFile) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("file", pdfFile);
      form.append("annotations", JSON.stringify(annotations));
      const res = await fetch(`${API_URL}/api/edit-pdf`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || "Error al guardar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = pdfFile.name.replace(/\.pdf$/i, "_editado.pdf");
      a.click(); URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al guardar PDF: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const selAnn = annotations.find(a => a.id === selectedId) || null;
  const pageAnns = annotations.filter(a => a.page === currentPage);
  const cursorMap = { select: "default", text: "text", highlight: "crosshair", redact: "crosshair", rect: "crosshair", ellipse: "crosshair", arrow: "crosshair", line: "crosshair", stamp: "cell", signature: "cell", watermark: "cell" };

  // ── Upload screen ─────────────────────────────────────
  if (!pdfFile) return (
    <>
      <Topbar supertitle="Herramientas PDF" title="Editar PDF" />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F6F8FB", padding: 40 }}>
        <div onClick={() => document.getElementById("edit-pdf-input").click()}
          style={{ border: "2px dashed rgba(10,15,30,0.15)", borderRadius: 20, padding: "64px 48px", textAlign: "center", cursor: "pointer", background: "#fff", maxWidth: 440, width: "100%" }}>
          <input id="edit-pdf-input" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => e.target.files[0] && loadPDF(e.target.files[0])} />
          <div style={{ fontSize: 52, marginBottom: 16 }}>✏️</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0A0F1E", marginBottom: 8 }}>Editar PDF</div>
          <div style={{ fontSize: 14, color: "#8494A8" }}>Sube un PDF para comenzar a editarlo</div>
        </div>
      </div>
    </>
  );

  const tbBtn = (label, action, active, disabled) => (
    <button key={label} onClick={action} disabled={disabled} title={label}
      style={{ padding: "6px 11px", borderRadius: 7, border: "none", background: active ? "linear-gradient(135deg,#00C2CB,#0099FF)" : "transparent", color: active ? "#0A0F1E" : "#556070", fontSize: label.length <= 2 ? 16 : 13, fontWeight: label === "T" ? 900 : 600, cursor: disabled ? "default" : "pointer", fontFamily: "inherit", boxShadow: active ? "0 2px 8px rgba(0,194,203,0.3)" : "none", opacity: disabled ? 0.35 : 1, whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "6px 12px", background: "#fff", borderBottom: "1px solid rgba(10,15,30,0.08)", flexShrink: 0, flexWrap: "wrap", minHeight: 46 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#556070", marginRight: 6, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pdfFile.name}</div>
        <Sep />
        {tbBtn("↩", undo, false, historyIdx === 0)}
        {tbBtn("↪", redo, false, historyIdx >= history.length - 1)}
        <Sep />
        {TOOLS.map(t => {
          if (t.id === "stamp") return (
            <div key="stamp" style={{ position: "relative" }}>
              {tbBtn(`${t.icon} ▾`, () => { setTool("stamp"); setStampMenu(v => !v); }, tool === "stamp")}
              {stampMenu && (
                <div style={{ position: "absolute", top: "110%", left: 0, zIndex: 200, background: "#fff", borderRadius: 10, boxShadow: "0 8px 32px rgba(10,15,30,0.15)", border: "1px solid rgba(10,15,30,0.08)", minWidth: 190, padding: 6 }}>
                  {STAMPS.map(s => (
                    <div key={s.id} onClick={() => applyStamp(s)}
                      style={{ padding: "9px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: s.color }}>
                      {s.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
          return tbBtn(t.icon, () => { setTool(t.id); setStampMenu(false); }, tool === t.id);
        })}
        <Sep />
        {tbBtn("↺", () => {}, false, true)}
        {tbBtn("↻", () => {}, false, true)}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#556070" }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(10,15,30,0.12)", background: "#F6F8FB", cursor: "pointer", fontSize: 12, opacity: currentPage === 1 ? 0.4 : 1 }}>‹</button>
          <span style={{ fontWeight: 700 }}>{currentPage}</span>
          <span style={{ color: "#C8D1E0" }}>/ {numPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages}
            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(10,15,30,0.12)", background: "#F6F8FB", cursor: "pointer", fontSize: 12, opacity: currentPage === numPages ? 0.4 : 1 }}>›</button>
        </div>
        <button onClick={() => { setPdfFile(null); setPdfDoc(null); }}
          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(10,15,30,0.12)", background: "#F6F8FB", color: "#556070", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginLeft: 4 }}>
          ✕ Cerrar
        </button>
        <button onClick={savePDF} disabled={saving}
          style={{ padding: "7px 18px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(0,194,203,0.3)", opacity: saving ? 0.7 : 1, marginLeft: 4 }}>
          {saving ? "Guardando..." : "⤓ Guardar PDF"}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Left: thumbnails */}
        <div style={{ width: 90, flexShrink: 0, background: "#1a2035", overflowY: "auto", padding: "10px 7px", display: "flex", flexDirection: "column", gap: 8 }}>
          {thumbnails.map((t, i) => (
            <div key={i} onClick={() => setCurrentPage(i + 1)}
              style={{ cursor: "pointer", borderRadius: 5, overflow: "hidden", border: currentPage === i + 1 ? "2px solid #00C2CB" : "2px solid transparent", boxShadow: currentPage === i + 1 ? "0 0 10px rgba(0,194,203,0.4)" : "none", transition: "all .15s" }}>
              <img src={t} alt={`${i + 1}`} style={{ width: "100%", display: "block" }} />
              <div style={{ textAlign: "center", fontSize: 9, color: currentPage === i + 1 ? "#00C2CB" : "rgba(255,255,255,0.35)", padding: "2px 0" }}>{i + 1}</div>
            </div>
          ))}
        </div>

        {/* Center: canvas + SVG overlay */}
        <div style={{ flex: 1, overflow: "auto", background: "#374151", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24 }}
          onClick={() => stampMenu && setStampMenu(false)}>
          <div style={{ position: "relative", boxShadow: "0 8px 48px rgba(0,0,0,0.45)", flexShrink: 0 }}>
            <canvas ref={canvasRef} style={{ display: "block" }} />
            {canvasSize.w > 0 && (
              <svg ref={svgRef} width={canvasSize.w} height={canvasSize.h}
                style={{ position: "absolute", top: 0, left: 0, cursor: cursorMap[tool] || "crosshair", touchAction: "none" }}
                onPointerDown={onSvgDown} onPointerMove={onSvgMove} onPointerUp={onSvgUp}>
                {pageAnns.map(a => <AnnEl key={a.id} ann={a} cw={canvasSize.w} ch={canvasSize.h} onDown={onAnnDown} />)}
                {selAnn && <ResizeHandles ann={selAnn} cw={canvasSize.w} ch={canvasSize.h} onStart={onResizeStart} />}
                <DrawPreview dp={dp} tool={tool} cw={canvasSize.w} ch={canvasSize.h} />
              </svg>
            )}
            {inlineText && <InlineTextInput screenX={inlineText.screenX} screenY={inlineText.screenY} onCommit={commitText} onCancel={() => setInlineText(null)} />}
          </div>
        </div>

        {/* Right: properties */}
        <PropertiesPanel ann={selAnn} onChange={updateSel} onDelete={deleteSel} />
      </div>

      {/* Modals */}
      {showSig && <SignatureModal onApply={applySignature} onClose={() => setShowSig(false)} />}
      {showWm && <WatermarkModal onApply={applyWatermark} onClose={() => setShowWm(false)} />}
    </div>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 22, background: "rgba(10,15,30,0.1)", margin: "0 4px" }} />;
}
