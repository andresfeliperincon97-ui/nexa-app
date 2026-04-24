/* global React */
const { useState: useStateMP } = React;

// ══════════════════════════════════════════════════════
//  ExcelPreview — tabla de filas detectadas
// ══════════════════════════════════════════════════════
function ExcelPreview({ selectedRow, onSelectRow }) {
  const cols = ["N°", "Nombre_Salida", "Cedula", "Expediente", "PDFs", "Páginas", "Fecha"];
  const rows = [
    ["1",  "EXP-2026-041", "79.582.114", "Lote Torre 3 - Apto 401", "8",  "124", "2026-04-18"],
    ["2",  "EXP-2026-042", "43.221.088", "Lote Torre 3 - Apto 402", "7",  "98",  "2026-04-18"],
    ["3",  "EXP-2026-043", "1.020.876.334", "Lote Torre 3 - Apto 403", "9", "142", "2026-04-19"],
    ["4",  "EXP-2026-044", "52.108.337", "Lote Torre 3 - Apto 404", "6",  "82",  "2026-04-19"],
    ["5",  "EXP-2026-045", "80.447.192", "Lote Torre 3 - Apto 405", "8",  "118", "2026-04-19"],
    ["6",  "EXP-2026-046", "1.010.223.447", "Lote Torre 3 - Apto 501", "7", "102", "2026-04-19"],
    ["7",  "EXP-2026-047", "79.881.204", "Lote Torre 3 - Apto 502", "9",  "148", "2026-04-20"],
    ["8",  "EXP-2026-048", "42.998.116", "Lote Torre 3 - Apto 503", "7",  "94",  "2026-04-20"],
    ["…",  "…", "…", "…", "…", "…", "…"],
    ["42", "EXP-2026-082", "1.022.445.901", "Lote Torre 3 - Apto 802", "8", "126", "2026-04-21"],
  ];
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
    }}>
      <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(10,15,30,0.06)", background: "#F6F8FB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0A0F1E" }}>plantilla_042.xlsx</div>
            <div style={{ fontSize: 11, color: "#8494A8" }}>42 filas detectadas · 7 columnas · 98 KB</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ fontSize: 10, padding: "3px 9px", background: "rgba(16,185,129,0.12)", color: "#10B981", borderRadius: 999, fontWeight: 700, letterSpacing: 0.6 }}>✓ VÁLIDO</span>
        </div>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead style={{ position: "sticky", top: 0, background: "#fff" }}>
            <tr>
              {cols.map(c => (
                <th key={c} style={{
                  fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8,
                  color: "#8494A8", fontWeight: 700, textAlign: "left",
                  padding: "9px 14px", borderBottom: "1px solid rgba(10,15,30,0.08)",
                  background: "#fff",
                }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isSel = selectedRow === i;
              const isEllipsis = r[0] === "…";
              return (
                <tr key={i}
                    onClick={() => !isEllipsis && onSelectRow(i)}
                    style={{
                      background: isSel ? "rgba(0,194,203,0.08)" : i % 2 ? "rgba(246,248,251,0.5)" : "#fff",
                      cursor: isEllipsis ? "default" : "pointer",
                      borderLeft: isSel ? "3px solid #00C2CB" : "3px solid transparent",
                    }}>
                  {r.map((cell, j) => (
                    <td key={j} style={{
                      padding: "9px 14px",
                      fontFamily: j === 0 || j === 2 || j === 4 || j === 5 ? "'JetBrains Mono', monospace" : "inherit",
                      fontSize: j === 0 || j === 2 || j === 4 || j === 5 ? 11 : 12,
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

// ══════════════════════════════════════════════════════
//  MappingPanel — columnas Excel → campos de la plantilla
// ══════════════════════════════════════════════════════
function MappingPanel({ mappings, onUpdate }) {
  const excelCols = ["Nombre_Salida", "Cedula", "Expediente", "PDFs", "Páginas", "Fecha", "(ninguna)"];
  const fields = [
    { key: "filename", label: "Nombre del archivo",    required: true,  hint: "Se usa como nombre del PDF de salida" },
    { key: "ced",      label: "Identificación",         required: true,  hint: "Reemplaza {{CEDULA}} en portada" },
    { key: "exp",      label: "Descripción expediente", required: true,  hint: "Reemplaza {{EXPEDIENTE}}" },
    { key: "date",     label: "Fecha de emisión",       required: false, hint: "Reemplaza {{FECHA}} · formato ISO" },
    { key: "pages",    label: "Conteo de páginas",      required: false, hint: "Validación contra ZIP" },
  ];
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 3 }}>
          🔗 Mapeo de columnas
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0A0F1E" }}>Excel → plantilla PDF</div>
        <div style={{ fontSize: 11, color: "#8494A8", marginTop: 3 }}>Asocia cada columna del Excel con el campo de la plantilla que reemplazará.</div>
      </div>
      {fields.map(f => (
        <div key={f.key} style={{
          display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center",
          padding: "10px 0", borderBottom: "1px solid rgba(10,15,30,0.04)",
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0A0F1E", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#8494A8", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{`{{${f.key.toUpperCase()}}}`}</span>
              {f.required && <span style={{ fontSize: 9, color: "#EF4444", fontWeight: 700 }}>● requerido</span>}
            </div>
            <div style={{ fontSize: 10.5, color: "#8494A8", marginTop: 2 }}>{f.label}</div>
          </div>
          <div style={{ color: "#00C2CB", fontSize: 16, fontWeight: 700 }}>→</div>
          <select value={mappings[f.key]} onChange={e => onUpdate(f.key, e.target.value)}
            style={{
              padding: "7px 10px", fontSize: 12, fontFamily: "inherit",
              border: `1px solid ${mappings[f.key] === "(ninguna)" && f.required ? "#EF4444" : "rgba(0,194,203,0.3)"}`,
              background: mappings[f.key] === "(ninguna)" && f.required ? "rgba(239,68,68,0.05)" : "rgba(0,194,203,0.04)",
              color: "#0A0F1E", borderRadius: 8, fontWeight: 600,
              cursor: "pointer", outline: "none",
            }}>
            {excelCols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      ))}
      <div style={{
        marginTop: 14, padding: "10px 12px",
        background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
        borderRadius: 10, fontSize: 11.5, color: "#0A7D5E",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span>✓</span>
        <span>5 de 5 campos mapeados correctamente. Listo para vista previa.</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  ZipPanel — PDFs encontrados en los ZIPs
// ══════════════════════════════════════════════════════
function ZipPanel() {
  const zips = [
    { name: "docs_torre3_apto401-410.zip", size: "28.4 MB", count: 82 },
    { name: "docs_torre3_apto501-510.zip", size: "24.1 MB", count: 76 },
    { name: "docs_torre3_apto601-610.zip", size: "26.8 MB", count: 84 },
    { name: "docs_torre3_apto701-710.zip", size: "30.2 MB", count: 88 },
  ];
  return (
    <div style={{
      background: "#fff", border: "1px solid rgba(10,15,30,0.08)",
      borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(10,15,30,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00C2CB", textTransform: "uppercase", letterSpacing: 1.4 }}>🗜️ Archivos ZIP</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0A0F1E", marginTop: 2 }}>4 ZIPs · 330 PDFs detectados</div>
        </div>
        <span style={{ fontSize: 10, padding: "3px 9px", background: "rgba(16,185,129,0.12)", color: "#10B981", borderRadius: 999, fontWeight: 700, letterSpacing: 0.6 }}>✓ TODO OK</span>
      </div>
      {zips.map((z, i) => (
        <div key={z.name} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 10px", borderRadius: 8,
          background: i % 2 ? "#F6F8FB" : "transparent",
        }}>
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

Object.assign(window, { ExcelPreview, MappingPanel, ZipPanel });
