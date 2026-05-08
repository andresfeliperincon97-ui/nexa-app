import os
import io
import json
import re

import fitz  # PyMuPDF
from PyPDF2 import PdfMerger
from anthropic import Anthropic
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

app = FastAPI(title="NEXA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "NEXA", "version": "1.0"}


@app.post("/api/validate")
async def validate_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    content = await file.read()

    doc = fitz.open(stream=content, filetype="pdf")
    num_pages = len(doc)
    text = "".join(page.get_text() for page in doc)
    doc.close()

    text_preview = text[:8000]

    prompt = f"""Eres un experto en validación de documentos de desembolsos para Colsubsidio.

Analiza el siguiente texto extraído de un documento PDF y valida si cumple con los criterios
de desembolsos de Colsubsidio (cedula, carta laboral, desprendible de nómina, pagaré, etc.).

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
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text.strip()

    try:
        result = json.loads(response_text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail="Error al parsear respuesta de IA")
        result = json.loads(match.group())

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
