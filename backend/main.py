import os
import io
import json
import re
import base64
import zipfile

import fitz  # PyMuPDF
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
from anthropic import Anthropic
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

app = FastAPI(title="NEXA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nexa-app-frontend.onrender.com",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def limpiar_json(texto: str) -> str:
    texto = texto.strip()
    if "```json" in texto:
        texto = texto.split("```json")[1].split("```")[0].strip()
    elif "```" in texto:
        texto = texto.split("```")[1].split("```")[0].strip()
    inicio = texto.find("{")
    fin = texto.rfind("}")
    if inicio != -1 and fin != -1:
        texto = texto[inicio:fin+1]
    if not texto.startswith(("{", "[")):
        raise ValueError("Respuesta no contiene JSON válido: " + texto[:200])
    return texto


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "NEXA", "version": "1.0"}


@app.post("/api/validate")
async def validate_pdf(
    file: UploadFile = File(...),
    tipo_tramite: str = Form("Desembolso Colsubsidio"),
    criterios: str = Form(""),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    content = await file.read()

    doc = fitz.open(stream=content, filetype="pdf")
    num_pages = len(doc)
    text = "".join(page.get_text() for page in doc)
    doc.close()

    text_preview = text[:8000]
    criterios_extra = f"\n\nCriterios adicionales del analista:\n{criterios}" if criterios.strip() else ""

    prompt = f"""Eres un experto en validación de documentos de desembolsos para Colsubsidio.

Tipo de trámite: {tipo_tramite}

Analiza el siguiente texto extraído de un documento PDF y valida si cumple con los criterios
de desembolsos de Colsubsidio (cédula, carta laboral, desprendible de nómina, pagaré, etc.).{criterios_extra}

Texto del documento:
{text_preview}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta, sin texto adicional:
{{
  "score": <número entre 0 y 100>,
  "resultado_general": "<APROBADO|APROBADO_CON_OBSERVACIONES|RECHAZADO>",
  "hallazgos": [
    {{
      "tipo": "<error|advertencia|ok>",
      "descripcion": "<descripción del hallazgo>",
      "campo": "<campo o sección afectada>"
    }}
  ],
  "documentos_faltantes": ["<documento faltante>"],
  "recomendaciones": ["<recomendación>"]
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text.strip()

    try:
        texto_limpio = limpiar_json(response_text)
        result = json.loads(texto_limpio)
    except (json.JSONDecodeError, ValueError) as e:
        print(f"ERROR PARSER: {e} | Texto limpio: {response_text[:300]}")
        raise HTTPException(status_code=500, detail="Error al parsear respuesta de IA")

    result["filename"] = file.filename
    result["pages"] = num_pages
    return result


@app.post("/api/pdf-thumbnail")
async def pdf_thumbnail(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    content = await file.read()
    doc = fitz.open(stream=content, filetype="pdf")
    page = doc.load_page(0)

    rect = page.rect
    zoom = min(200 / rect.width, 280 / rect.height)
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    doc.close()

    png_bytes = pix.tobytes("png")
    b64 = base64.b64encode(png_bytes).decode()
    return {"thumbnail": f"data:image/png;base64,{b64}"}


@app.post("/api/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Se necesitan al menos 2 archivos PDF")

    merger = PdfMerger()
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename} no es un PDF")
        merger.append(io.BytesIO(await file.read()))

    output = io.BytesIO()
    merger.write(output)
    merger.close()
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=merged.pdf"},
    )


@app.post("/api/merge-pdfs")
async def merge_pdfs_ordered(
    files: list[UploadFile] = File(...),
    nombre_salida: str = Form("documento_unificado.pdf"),
):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Se necesitan al menos 2 archivos PDF")

    merged = fitz.open()
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename} no es un PDF")
        data = await file.read()
        doc = fitz.open(stream=data, filetype="pdf")
        merged.insert_pdf(doc)
        doc.close()

    if merged.page_count == 0:
        raise HTTPException(status_code=400, detail="Los PDFs no contienen páginas")

    output = io.BytesIO(merged.tobytes())
    merged.close()
    output.seek(0)

    safe_name = nombre_salida if nombre_salida.lower().endswith(".pdf") else nombre_salida + ".pdf"
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={safe_name}"},
    )


@app.post("/api/nexificar-ia")
async def nexificar_ia(
    file: UploadFile = File(...),
    instruccion: str = Form(...),
    modo: str = Form("preview"),
):
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos ZIP")

    content = await file.read()

    try:
        zf = zipfile.ZipFile(io.BytesIO(content))
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="El archivo ZIP está corrupto")

    pdf_paths = [
        n for n in zf.namelist()
        if n.lower().endswith(".pdf")
        and not os.path.basename(n).startswith(".")
        and not n.startswith("__MACOSX")
    ]
    if not pdf_paths:
        raise HTTPException(status_code=400, detail="El ZIP no contiene archivos PDF")

    # basename → full path inside ZIP (last one wins on collision)
    name_to_path = {os.path.basename(p): p for p in pdf_paths}
    basenames = list(name_to_path.keys())

    # ── Ask Claude to plan the grouping ──────────────────
    lista = "\n".join(f"- {b}" for b in basenames)
    prompt = f"""Tienes estos archivos en el ZIP:
{lista}

Instrucción del usuario: {instruccion}

Responde SOLO con JSON válido con esta estructura exacta, sin texto adicional:
{{
  "grupos": [
    {{
      "archivos": ["ESC_63493576.pdf", "PYS_63493576.pdf"],
      "nombre_salida": "63493576.pdf",
      "orden": ["ESC_63493576.pdf", "PYS_63493576.pdf"]
    }}
  ]
}}

Cada archivo del ZIP debe aparecer en exactamente un grupo.
Si un archivo va solo (sin fusionar), ponlo en un grupo de un elemento.
En "orden" indica el orden exacto en que deben fusionarse los PDFs del grupo."""

    msg = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        plan = json.loads(limpiar_json(msg.content[0].text))
        grupos = plan.get("grupos", [])
    except (json.JSONDecodeError, ValueError) as e:
        print(f"ERROR nexificar-ia parser: {e} | {msg.content[0].text[:300]}")
        raise HTTPException(status_code=500, detail="Error al planificar la nexificación")

    if not grupos:
        raise HTTPException(status_code=500, detail="Claude no devolvió grupos válidos")

    # ── Preview mode ──────────────────────────────────────
    if modo == "preview":
        preview = []
        for grupo in grupos[:5]:
            archivos = grupo.get("archivos", [])
            nombre_salida = grupo.get("nombre_salida", "sin_nombre.pdf")
            if len(archivos) > 1:
                original = " + ".join(archivos)
            else:
                original = archivos[0] if archivos else "?"
            preview.append({"original": original, "propuesto": nombre_salida})
        return {
            "modo": "preview",
            "total_pdfs": len(basenames),
            "total_grupos": len(grupos),
            "preview": preview,
        }

    # ── Ejecutar mode ─────────────────────────────────────
    elif modo == "ejecutar":
        output_buf = io.BytesIO()
        ok = 0
        errores = 0

        with zipfile.ZipFile(output_buf, "w", zipfile.ZIP_DEFLATED) as out_zip:
            for grupo in grupos:
                orden = grupo.get("orden") or grupo.get("archivos", [])
                nombre_salida = grupo.get("nombre_salida", "sin_nombre.pdf")
                try:
                    merged = fitz.open()
                    for arch in orden:
                        path = name_to_path.get(arch)
                        if path is None:
                            print(f"WARN: archivo no encontrado en ZIP: {arch}")
                            continue
                        doc = fitz.open(stream=zf.read(path), filetype="pdf")
                        merged.insert_pdf(doc)
                        doc.close()
                    if merged.page_count == 0:
                        raise ValueError("El grupo no produjo páginas")
                    out_zip.writestr(nombre_salida, merged.tobytes())
                    merged.close()
                    ok += 1
                except Exception as e:
                    print(f"ERROR ejecutar grupo '{nombre_salida}': {e}")
                    errores += 1

        output_buf.seek(0)
        return StreamingResponse(
            output_buf,
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=nexificado.zip",
                "X-Procesados-Ok": str(ok),
                "X-Procesados-Error": str(errores),
                "Access-Control-Expose-Headers": "X-Procesados-Ok, X-Procesados-Error",
            },
        )

    else:
        raise HTTPException(status_code=400, detail="modo debe ser 'preview' o 'ejecutar'")


def _hex_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))


@app.post("/api/edit-pdf")
async def edit_pdf(
    file: UploadFile = File(...),
    annotations: str = Form("[]"),
):
    content = await file.read()
    doc = fitz.open(stream=content, filetype="pdf")
    anns = json.loads(annotations)

    for ann in anns:
        page_idx = int(ann.get("page", 1)) - 1
        if page_idx < 0 or page_idx >= len(doc):
            continue
        page = doc.load_page(page_idx)
        pw, ph = page.rect.width, page.rect.height

        x  = ann.get("x", 0)  * pw
        y  = ann.get("y", 0)  * ph
        w  = ann.get("w", 0.2) * pw
        h  = ann.get("h", 0.06) * ph
        x2 = ann.get("x2", ann.get("x", 0) + 0.2) * pw
        y2 = ann.get("y2", ann.get("y", 0)) * ph

        color  = _hex_rgb(ann.get("color", "#000000"))
        op     = float(ann.get("opacity", 1))
        fs     = float(ann.get("fontSize", 14))
        sw     = float(ann.get("strokeWidth", 2))
        atype  = ann.get("type", "")

        try:
            if atype == "text":
                page.insert_text(
                    fitz.Point(x, y + fs),
                    ann.get("text", ""),
                    fontsize=fs / 1.5,
                    color=color,
                )

            elif atype == "highlight":
                rect = fitz.Rect(x, y, x + w, y + h)
                page.add_highlight_annot(rect)

            elif atype == "redact":
                rect = fitz.Rect(x, y, x + w, y + h)
                page.draw_rect(rect, color=(0, 0, 0), fill=(0, 0, 0), fill_opacity=op)

            elif atype == "rect":
                rect = fitz.Rect(x, y, x + w, y + h)
                fill = _hex_rgb(ann.get("color", "#0000ff")) if ann.get("fill") else None
                page.draw_rect(rect, color=color, fill=fill, fill_opacity=0.15 if fill else 0, width=sw)

            elif atype == "ellipse":
                rect = fitz.Rect(x, y, x + w, y + h)
                page.draw_oval(rect, color=color, width=sw)

            elif atype in ("line", "arrow"):
                page.draw_line(fitz.Point(x, y), fitz.Point(x2, y2), color=color, width=sw)

            elif atype == "stamp":
                rect = fitz.Rect(x, y, x + w, y + h)
                page.draw_rect(rect, color=color, fill=color, fill_opacity=0.1, width=2)
                page.insert_text(fitz.Point(x + 6, y + h - 6), ann.get("text", "SELLO"), fontsize=fs / 1.5, color=color)

            elif atype == "watermark":
                text = ann.get("text", "CONFIDENCIAL")
                wm_color = _hex_rgb(ann.get("color", "#999999"))
                page.insert_text(
                    fitz.Point(pw * 0.08, ph * 0.62),
                    text,
                    fontsize=min(pw, ph) * 0.08,
                    color=wm_color,
                    rotate=40,
                )

            elif atype == "signature":
                img_data = ann.get("signatureData", "")
                if "," in img_data:
                    img_bytes = base64.b64decode(img_data.split(",")[1])
                    rect = fitz.Rect(x, y, x + w, y + h)
                    page.insert_image(rect, stream=img_bytes)

        except Exception as e:
            print(f"WARN edit-pdf ann {atype}: {e}")

    output = io.BytesIO(doc.tobytes())
    doc.close()
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=editado.pdf"},
    )


@app.post("/api/split-pdf")
async def split_pdf(
    file: UploadFile = File(...),
    mode: str = Form("all"),
    pages: str = Form(""),
    parts_size: int = Form(1),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    content = await file.read()
    reader = PdfReader(io.BytesIO(content))
    total = len(reader.pages)

    output_buf = io.BytesIO()
    with zipfile.ZipFile(output_buf, "w", zipfile.ZIP_DEFLATED) as zf:

        if mode == "all":
            for i in range(total):
                writer = PdfWriter()
                writer.add_page(reader.pages[i])
                buf = io.BytesIO()
                writer.write(buf)
                zf.writestr(f"pagina_{i + 1:03d}.pdf", buf.getvalue())

        elif mode == "select":
            idxs = []
            for part in pages.split(","):
                part = part.strip()
                if not part:
                    continue
                if "-" in part:
                    a, b = part.split("-", 1)
                    try:
                        for n in range(int(a), int(b) + 1):
                            if 1 <= n <= total:
                                idxs.append(n - 1)
                    except ValueError:
                        pass
                else:
                    try:
                        n = int(part)
                        if 1 <= n <= total:
                            idxs.append(n - 1)
                    except ValueError:
                        pass

            if not idxs:
                raise HTTPException(status_code=400, detail="No se seleccionaron páginas válidas")

            writer = PdfWriter()
            for idx in sorted(set(idxs)):
                writer.add_page(reader.pages[idx])
            buf = io.BytesIO()
            writer.write(buf)
            zf.writestr("seleccion.pdf", buf.getvalue())

        elif mode == "parts":
            size = max(1, parts_size)
            part_num = 1
            for start in range(0, total, size):
                end = min(start + size, total)
                writer = PdfWriter()
                for i in range(start, end):
                    writer.add_page(reader.pages[i])
                buf = io.BytesIO()
                writer.write(buf)
                zf.writestr(f"parte_{part_num:02d}_pags_{start + 1}-{end}.pdf", buf.getvalue())
                part_num += 1

        else:
            raise HTTPException(status_code=400, detail="Modo inválido")

    output_buf.seek(0)
    return StreamingResponse(
        output_buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=dividido.zip"},
    )


@app.post("/api/compress-pdf")
async def compress_pdf(
    file: UploadFile = File(...),
    level: str = Form("medium"),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    content = await file.read()
    original_size = len(content)

    doc = fitz.open(stream=content, filetype="pdf")

    opts_map = {
        "low":    dict(deflate=True, garbage=1),
        "medium": dict(deflate=True, garbage=3, clean=True),
        "high":   dict(deflate=True, garbage=4, clean=True, linear=True),
    }
    compressed = doc.tobytes(**opts_map.get(level, opts_map["medium"]))
    doc.close()
    compressed_size = len(compressed)

    return StreamingResponse(
        io.BytesIO(compressed),
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=comprimido.pdf",
            "X-Original-Size": str(original_size),
            "X-Compressed-Size": str(compressed_size),
            "Access-Control-Expose-Headers": "X-Original-Size, X-Compressed-Size",
        },
    )


@app.get("/api/stats")
def get_stats():
    return {
        "documentos_mes": 1284,
        "paginas_procesadas": 18432,
        "expedientes_nexificados": 347,
        "score_validacion": 91.7,
        "tiempo_promedio": 4.2,
        "analistas_activos": 12,
    }
