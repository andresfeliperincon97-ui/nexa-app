const API_URL = import.meta.env.VITE_API_URL || "https://nexa-app-backend.onrender.com";

export async function checkHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${API_URL}/api/stats`);
  if (!res.ok) throw new Error("Stats fetch failed");
  return res.json();
}

export async function validatePDF(file, tipoTramite, criterios) {
  const form = new FormData();
  form.append("file", file);
  if (tipoTramite) form.append("tipo_tramite", tipoTramite);
  if (criterios) form.append("criterios", criterios);
  const res = await fetch(`${API_URL}/api/validate`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al validar el documento");
  }
  return res.json();
}

export async function nexificarIA(file, instruccion, modo) {
  const form = new FormData();
  form.append("file", file);
  form.append("instruccion", instruccion);
  form.append("modo", modo);
  const res = await fetch(`${API_URL}/api/nexificar-ia`, { method: "POST", body: form });
  if (modo === "ejecutar") {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Error al ejecutar nexificación");
    }
    const blob = await res.blob();
    const ok = parseInt(res.headers.get("X-Procesados-Ok") || "0");
    const errores = parseInt(res.headers.get("X-Procesados-Error") || "0");
    return { blob, ok, errores };
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error en vista previa");
  }
  return res.json();
}

export async function mergePDFs(files) {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const res = await fetch(`${API_URL}/api/merge`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Error al unir los PDFs");
  return res.blob();
}

export async function getPDFThumbnail(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/pdf-thumbnail`, { method: "POST", body: form });
  if (!res.ok) throw new Error("thumbnail failed");
  const data = await res.json();
  return data.thumbnail;
}

export async function mergePDFsOrdered(files, nombreSalida) {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  form.append("nombre_salida", nombreSalida || "documento_unificado.pdf");
  const res = await fetch(`${API_URL}/api/merge-pdfs`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al unificar los PDFs");
  }
  return res.blob();
}
