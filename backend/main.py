from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import io

app = FastAPI(title="NEXA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "NEXA API", "version": "1.0.0"}


class ValidateResponse(BaseModel):
    filename: str
    pages: int
    score: float
    findings: list
    checks: list
    summary: str


@app.post("/api/validate", response_model=ValidateResponse)
async def validate_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    content = await file.read()
    size_mb = round(len(content) / (1024 * 1024), 2)

    # Mock validation — replace with real PyMuPDF + Anthropic analysis
    findings = [
        {
            "id": 1,
            "severity": "medium",
            "title": "Calidad OCR baja en 1 página",
            "description": "Se detectó una página con baja resolución de escaneo (< 72 dpi).",
            "page": 3,
            "rule": "calidad_ocr",
        },
        {
            "id": 2,
            "severity": "ok",
            "title": "Firmas digitales válidas",
            "description": "Todas las firmas tienen certificado vigente.",
            "page": 1,
            "rule": "firmas_digitales",
        },
    ]

    checks = [
        {"category": "Integridad", "status": "ok",   "label": "Archivo no corrupto",       "detail": f"{size_mb} MB"},
        {"category": "Integridad", "status": "ok",   "label": "Páginas en orden secuencial"},
        {"category": "Datos",      "status": "ok",   "label": "Fechas formato ISO"},
        {"category": "Firmas",     "status": "ok",   "label": "Sin firmas digitales rotas"},
        {"category": "Privacidad", "status": "warn", "label": "Metadatos de autor presentes"},
    ]

    return ValidateResponse(
        filename=file.filename,
        pages=12,
        score=94.5,
        findings=findings,
        checks=checks,
        summary=f"Archivo {file.filename} analizado correctamente. Se encontraron {len([f for f in findings if f['severity'] != 'ok'])} observaciones.",
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
