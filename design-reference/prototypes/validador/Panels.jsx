/* global React, Pill, Button */
const { useState: useStateVF } = React;

// ══════════════════════════════════════════════════════
//  FindingsPanel — hallazgos de la IA con severidad
// ══════════════════════════════════════════════════════
function FindingsPanel({ findings, onSelect, selected }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "#00C2CB",
        textTransform: "uppercase", letterSpacing: 1.4,
        marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>🎯 Hallazgos ({findings.length})</span>
        <span style={{ color: "#8494A8", fontWeight: 600, fontSize: 10, textTransform: "none", letterSpacing: 0 }}>
          ordenados por severidad
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {findings.map(f => (
          <FindingRow key={f.id} f={f} selected={selected === f.id} onClick={() => onSelect(f)}/>
        ))}
      </div>
    </div>
  );
}

function FindingRow({ f, selected, onClick }) {
  const [hover, setHover] = useStateVF(false);
  const tones = {
    high:   { bg: "rgba(239,68,68,0.06)",  bd: "rgba(239,68,68,0.22)",  fg: "#EF4444", icon: "✕" },
    medium: { bg: "rgba(245,158,11,0.06)", bd: "rgba(245,158,11,0.22)", fg: "#F59E0B", icon: "!" },
    low:    { bg: "rgba(0,194,203,0.05)",  bd: "rgba(0,194,203,0.2)",   fg: "#00C2CB", icon: "i" },
    ok:     { bg: "rgba(16,185,129,0.05)", bd: "rgba(16,185,129,0.2)",  fg: "#10B981", icon: "✓" },
  };
  const t = tones[f.severity];
  const isActive = selected || hover;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: isActive ? t.bg : "#FFFFFF",
        border: `1px solid ${isActive ? t.bd : "rgba(10,15,30,0.08)"}`,
        borderRadius: 11, padding: "10px 12px", cursor: "pointer",
        transition: "all .15s",
        boxShadow: selected ? `0 2px 12px ${t.bd}` : "none",
      }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: t.fg, color: f.severity === "high" ? "#fff" : "#0A0F1E",
          fontSize: 11, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: 1,
        }}>{t.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0A0F1E" }}>{f.title}</div>
            <span style={{ fontSize: 9, color: t.fg, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6,
                           padding: "1px 6px", background: t.bg, borderRadius: 4 }}>
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

// ══════════════════════════════════════════════════════
//  ChecksList — chequeos automáticos
// ══════════════════════════════════════════════════════
function ChecksList({ checks }) {
  const grouped = checks.reduce((acc, c) => {
    (acc[c.category] ||= []).push(c);
    return acc;
  }, {});
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10 }}>
        🔍 Chequeos automáticos
      </div>
      <div style={{ background: "#F6F8FB", borderRadius: 12, padding: 12 }}>
        {Object.entries(grouped).map(([cat, items], gi) => (
          <div key={cat} style={{ marginBottom: gi < Object.keys(grouped).length - 1 ? 12 : 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8494A8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              {cat}
            </div>
            {items.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800,
                  flexShrink: 0,
                  background: c.status === "ok" ? "rgba(16,185,129,0.16)" :
                              c.status === "warn" ? "rgba(245,158,11,0.16)" :
                              "rgba(239,68,68,0.16)",
                  color: c.status === "ok" ? "#10B981" : c.status === "warn" ? "#F59E0B" : "#EF4444",
                }}>{c.status === "ok" ? "✓" : c.status === "warn" ? "!" : "✕"}</span>
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

// ══════════════════════════════════════════════════════
//  ChatPanel — conversación completa con la IA
// ══════════════════════════════════════════════════════
function ChatPanel({ initial }) {
  const [messages, setMessages] = useStateVF(initial);
  const [input, setInput] = useStateVF("");
  const suggestions = [
    "¿Qué páginas necesitan revisión?",
    "Extrae los datos del comprador",
    "Resume las cláusulas de la página 14",
    "Compara firmas con el expediente anterior",
  ];
  const send = (text) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setMessages(ms => [
      ...ms,
      { role: "user", text: t },
      { role: "ai", typing: true },
    ]);
    setInput("");
    setTimeout(() => {
      setMessages(ms => ms.slice(0, -1).concat({
        role: "ai",
        text: "He revisado los fragmentos relevantes. Puedo generarte un resumen de las cláusulas económicas o abrir el fragmento en el visor — dime qué prefieres.",
      }));
    }, 1200);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span>💬 Conversar con la IA</span>
        <span style={{ fontSize: 9, padding: "1px 7px", background: "rgba(16,185,129,0.15)", color: "#10B981", borderRadius: 999, fontWeight: 700, letterSpacing: 0.6 }}>● EN LÍNEA</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, minHeight: 200 }}>
        {messages.map((m, i) => <Message key={i} m={m}/>)}
      </div>

      {/* Suggestions */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, marginBottom: 8 }}>
        {suggestions.map(s => (
          <button key={s} onClick={() => send(s)} style={{
            background: "rgba(0,194,203,0.06)", color: "#00C2CB",
            border: "1px solid rgba(0,194,203,0.22)",
            borderRadius: 999, padding: "4px 10px",
            fontSize: 10.5, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer",
          }}>{s}</button>
        ))}
      </div>

      {/* Composer */}
      <div style={{
        background: "#F6F8FB", border: "1px solid rgba(10,15,30,0.08)",
        borderRadius: 12, padding: 8,
        display: "flex", alignItems: "flex-end", gap: 8,
      }}>
        <textarea
          value={input} rows={2}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
          placeholder="Pregunta algo sobre el documento…"
          style={{
            flex: 1, border: "none", background: "transparent",
            fontFamily: "inherit", fontSize: 12, color: "#0A0F1E",
            resize: "none", outline: "none", padding: "4px 8px",
            lineHeight: 1.45,
          }}/>
        <Button variant="primary" size="sm" onClick={() => send()}>→ Enviar</Button>
      </div>
      <div style={{ fontSize: 10, color: "#8494A8", marginTop: 6, textAlign: "center" }}>
        Claude Sonnet 4.5 · las respuestas pueden contener imprecisiones
      </div>
    </div>
  );
}

function Message({ m }) {
  if (m.role === "system") {
    return (
      <div style={{
        background: "rgba(0,194,203,0.05)", border: "1px solid rgba(0,194,203,0.15)",
        borderRadius: 10, padding: "8px 12px", fontSize: 11, color: "#556070",
        marginBottom: 10, textAlign: "center",
      }}>{m.text}</div>
    );
  }
  return (
    <div style={{ marginBottom: 10, display: "flex", gap: 8, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
      {m.role === "ai" && (
        <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#00C2CB,#0099FF)", color: "#0A0F1E", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>⚡</div>
      )}
      {m.role === "user" && (
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#0A0F1E", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>AM</div>
      )}
      <div style={{
        background: m.role === "user" ? "#0A0F1E" : "#fff",
        color: m.role === "user" ? "#fff" : "#2D3A52",
        border: m.role === "user" ? "none" : "1px solid rgba(10,15,30,0.08)",
        borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
        padding: "9px 12px", fontSize: 12.5, lineHeight: 1.5,
        maxWidth: "84%",
      }}>
        {m.typing ? <TypingDots/> : (
          <>
            {m.text}
            {m.refs && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {m.refs.map((r, i) => (
                  <span key={i} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(0,194,203,0.1)", color: "#00C2CB", borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                    📎 {r}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "2px 4px" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "#00C2CB",
          animation: `nx-typing 1.2s ${i * 0.15}s infinite`,
        }}/>
      ))}
    </div>
  );
}

Object.assign(window, { FindingsPanel, ChecksList, ChatPanel });
