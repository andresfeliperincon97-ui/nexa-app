import { useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Topbar from "../components/Topbar";
import { getPDFThumbnail, mergePDFsOrdered } from "../services/api";

const SHIMMER_STYLE = `
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  .thumb-skeleton {
    background: linear-gradient(90deg, #e8edf2 25%, #f4f7fa 50%, #e8edf2 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite linear;
  }
`;

function getPDFPageCount(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let text = "";
  for (let i = 0; i < Math.min(bytes.length, 60000); i++) {
    text += String.fromCharCode(bytes[i]);
  }
  const matches = text.match(/\/Count\s+(\d+)/g) || [];
  if (!matches.length) return null;
  const counts = matches.map((m) => parseInt(m.replace(/\/Count\s+/, ""), 10));
  return Math.max(...counts);
}

function ThumbnailArea({ thumbnail, thumbnailLoading }) {
  if (thumbnailLoading) {
    return (
      <div
        className="thumb-skeleton"
        style={{ height: 140, width: "100%" }}
      />
    );
  }
  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt="página 1"
        style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
        draggable={false}
      />
    );
  }
  return (
    <div style={{
      height: 140,
      background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 40,
      color: "#C8D1E0",
    }}>
      📄
    </div>
  );
}

function SortableCard({ id, file, index, pages, thumbnail, thumbnailLoading, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(10,15,30,0.1)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: isDragging
            ? "0 12px 40px rgba(0,194,203,0.2)"
            : "0 2px 8px rgba(10,15,30,0.06)",
          display: "flex",
          flexDirection: "column",
          cursor: "grab",
          userSelect: "none",
        }}
        {...attributes}
        {...listeners}
      >
        {/* Thumbnail area */}
        <div style={{ position: "relative" }}>
          <ThumbnailArea thumbnail={thumbnail} thumbnailLoading={thumbnailLoading} />

          {/* Order badge */}
          <div style={{
            position: "absolute", top: 8, left: 8,
            width: 26, height: 26, borderRadius: 8,
            background: "linear-gradient(135deg,#00C2CB,#0099FF)",
            color: "#fff", fontSize: 11, fontWeight: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,194,203,0.4)",
          }}>
            {index + 1}
          </div>

          {/* Remove button */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(id); }}
            style={{
              position: "absolute", top: 8, right: 8,
              width: 26, height: 26, borderRadius: 7,
              border: "none", background: "rgba(239,68,68,0.9)",
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Info */}
        <div style={{ padding: "10px 12px" }}>
          <div
            style={{
              fontSize: 11, fontWeight: 700, color: "#0A0F1E",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
            title={file.name}
          >
            {file.name}
          </div>
          <div style={{ fontSize: 10, color: "#8494A8", marginTop: 3 }}>
            {(file.size / 1024).toFixed(0)} KB
            {pages != null && ` · ${pages} pág.`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NexificarPDFs() {
  const [items, setItems] = useState([]);
  const [nombreSalida, setNombreSalida] = useState("documento_unificado.pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const addFiles = useCallback((fileList) => {
    const pdfs = Array.from(fileList).filter((f) =>
      f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfs.length) return;

    const newItems = pdfs.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      pages: null,
      thumbnail: null,
      thumbnailLoading: true,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setDone(false);
    setError(null);

    // Fire async work per item without blocking the render
    newItems.forEach((item) => {
      // Page count — local, fast
      item.file.arrayBuffer().then((buf) => {
        const pages = getPDFPageCount(buf);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, pages } : i))
        );
      });

      // Thumbnail — remote call
      getPDFThumbnail(item.file)
        .then((thumbnail) => {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, thumbnail, thumbnailLoading: false } : i
            )
          );
        })
        .catch(() => {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, thumbnailLoading: false } : i
            )
          );
        });
    });
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIdx = prev.findIndex((i) => i.id === active.id);
        const newIdx = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const handleRemove = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDone(false);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setError("Necesitas al menos 2 PDFs para unificar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const files = items.map((i) => i.file);
      const blob = await mergePDFsOrdered(files, nombreSalida);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreSalida.endsWith(".pdf") ? nombreSalida : nombreSalida + ".pdf";
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = items.reduce((s, i) => s + (i.pages || 0), 0);

  return (
    <>
      <style>{SHIMMER_STYLE}</style>
      <Topbar supertitle="Herramientas PDF" title="Nexificar PDFs" />
      <div style={{ padding: "40px 40px 80px", maxWidth: 1100 }}>

        {/* Drop zone */}
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById("pdf-input").click()}
          style={{
            border: `2px dashed ${dragging ? "#00C2CB" : "rgba(10,15,30,0.15)"}`,
            borderRadius: 18,
            padding: "36px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(0,194,203,0.04)" : "#fff",
            transition: "all .2s",
            marginBottom: 32,
          }}
        >
          <input
            id="pdf-input"
            type="file"
            accept=".pdf"
            multiple
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
          <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0A0F1E", marginBottom: 6 }}>
            Arrastra PDFs aquí o haz clic para seleccionar
          </div>
          <div style={{ fontSize: 13, color: "#8494A8" }}>
            Puedes subir múltiples archivos — luego arrástralos para reordenarlos
          </div>
        </div>

        {items.length > 0 && (
          <>
            {/* Stats bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: "#556070" }}>
                <span style={{ fontWeight: 700, color: "#0A0F1E" }}>{items.length}</span> archivos
                {totalPages > 0 && (
                  <> · <span style={{ fontWeight: 700, color: "#0A0F1E" }}>{totalPages}</span> páginas totales</>
                )}
              </div>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => document.getElementById("pdf-input").click()}
                style={{
                  padding: "8px 16px", borderRadius: 9, border: "1px solid rgba(0,194,203,0.4)",
                  background: "transparent", color: "#00C2CB", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                + Agregar más
              </button>
            </div>

            {/* Sortable grid */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 16,
                  marginBottom: 32,
                }}>
                  {items.map((item, idx) => (
                    <SortableCard
                      key={item.id}
                      id={item.id}
                      file={item.file}
                      index={idx}
                      pages={item.pages}
                      thumbnail={item.thumbnail}
                      thumbnailLoading={item.thumbnailLoading}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Output name + merge button */}
            <div style={{
              background: "#fff", border: "1px solid rgba(10,15,30,0.08)",
              borderRadius: 16, padding: "24px 28px",
              display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
              boxShadow: "0 2px 8px rgba(10,15,30,0.05)",
            }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#556070", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Nombre del archivo final
                </div>
                <input
                  value={nombreSalida}
                  onChange={(e) => setNombreSalida(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 9,
                    border: "1px solid rgba(10,15,30,0.15)", fontSize: 14,
                    fontFamily: "inherit", color: "#0A0F1E", background: "#F6F8FB",
                    outline: "none", boxSizing: "border-box",
                  }}
                  placeholder="documento_unificado.pdf"
                />
              </div>

              <button
                onClick={handleMerge}
                disabled={loading || items.length < 2}
                style={{
                  padding: "12px 28px", borderRadius: 11, border: "none",
                  background: items.length < 2 ? "#C8D1E0" : "linear-gradient(135deg,#00C2CB,#0099FF)",
                  color: items.length < 2 ? "#8494A8" : "#0A0F1E",
                  fontSize: 15, fontWeight: 800, cursor: items.length < 2 ? "not-allowed" : "pointer",
                  fontFamily: "inherit", boxShadow: items.length >= 2 ? "0 4px 16px rgba(0,194,203,0.35)" : "none",
                  transition: "all .2s", whiteSpace: "nowrap",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Unificando..." : `Unificar ${items.length} PDFs →`}
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13 }}>
                {error}
              </div>
            )}

            {done && (
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", fontSize: 13, fontWeight: 600 }}>
                ¡PDF descargado correctamente!
              </div>
            )}
          </>
        )}

        {items.length === 0 && (
          <div style={{ textAlign: "center", color: "#C8D1E0", padding: "20px 0" }}>
            <div style={{ fontSize: 13 }}>Sube al menos 2 PDFs para empezar</div>
          </div>
        )}
      </div>
    </>
  );
}
