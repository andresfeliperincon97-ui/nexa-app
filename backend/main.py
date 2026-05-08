import os
import io
import json
import re
import zipfile

import fitz  # PyMuPDF
from PyPDF2 import PdfMerger
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
