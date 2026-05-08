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

    def limpiar_json(texto):
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

    pdf_names = [
        n for n in zf.namelist()
        if n.lower().endswith(".pdf") and not os.path.basename(n).startswith(".")
        and not n.startswith("__MACOSX")
    ]

    if not pdf_names:
        raise HTTPException(status_code=400, detail="El ZIP no contiene archivos PDF")

    def llamar_claude(texto_pdf: str, nombre_original: str) -> str:
        prompt = (
            f"El usuario quiere: {instruccion}. "
            f"Dado este texto de un PDF, determina el nuevo nombre que debería tener el archivo. "
            f"Responde SOLO con el nombre del archivo sin extensión, sin explicaciones, "
            f"sin puntos ni comas en números de cédula.\n\n"
            f"Nombre original del archivo: {nombre_original}\n"
            f"Texto del PDF:\n{texto_pdf[:4000]}"
        )
        msg = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text.strip()

    if modo == "preview":
        sample = pdf_names[:5]
        preview = []
        for name in sample:
            base = os.path.basename(name)
            try:
                pdf_bytes = zf.read(name)
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                text = "".join(page.get_text() for page in doc)
                doc.close()
                nuevo = llamar_claude(text, base) + ".pdf"
                preview.append({"original": base, "propuesto": nuevo})
            except Exception as e:
                print(f"ERROR preview {base}: {e}")
                preview.append({"original": base, "propuesto": f"ERROR: {str(e)[:80]}"})
        return {"modo": "preview", "total_pdfs": len(pdf_names), "preview": preview}

    elif modo == "ejecutar":
        output_buf = io.BytesIO()
        ok = 0
        errores = 0
        with zipfile.ZipFile(output_buf, "w", zipfile.ZIP_DEFLATED) as out_zip:
            for name in pdf_names:
                base = os.path.basename(name)
                nuevo_nombre = base
                try:
                    pdf_bytes = zf.read(name)
                    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                    text = "".join(page.get_text() for page in doc)
                    doc.close()
                    nuevo_nombre = llamar_claude(text, base) + ".pdf"
                    ok += 1
                except Exception as e:
                    print(f"ERROR ejecutar {base}: {e}")
                    pdf_bytes = zf.read(name)
                    errores += 1
                out_zip.writestr(nuevo_nombre, pdf_bytes)
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
