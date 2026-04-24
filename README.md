# NEXA — Plataforma documental · Grupo Bolívar

Aplicación React + FastAPI que replica exactamente los prototipos de diseño de NEXA.

## Stack

- **Frontend**: React 19, Vite 8, React Router DOM, TailwindCSS 3
- **Backend**: FastAPI, Uvicorn, PyMuPDF, Anthropic SDK
- **Tipografía**: Plus Jakarta Sans (Google Fonts) + JetBrains Mono
- **Colores**: Primary `#00C2CB` · Ink `#0A0F1E` · Surface `#F6F8FB`

## Páginas implementadas

| Ruta | Página | Basada en |
|------|--------|-----------|
| `/` | Dashboard | `design-reference/Dashboard.html` |
| `/masivo` | Nexíficar Masivo | `prototypes/masivo/index.html` |
| `/validador` | Validador IA | `prototypes/validador/index.html` |
| `/organizacion` | Vista de Organización | `prototypes/organizacion/index.html` |

## Correr el frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## Correr el backend

```bash
cd backend
pip install -r requirements.txt
python main.py
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/api/health` | Estado del servicio |
| `POST` | `/api/validate` | Valida un PDF (multipart/form-data) |

## Estructura del proyecto

```
nexa-app/
├── design-reference/          # Prototipos HTML de referencia
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx    # Sidebar oscuro con navegación
│   │   │   └── Topbar.jsx     # Topbar blanca reutilizable
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── NexificarMasivo.jsx
│   │   │   ├── ValidadorIA.jsx
│   │   │   └── Organizacion.jsx
│   │   ├── App.jsx            # Router principal
│   │   └── index.css          # Tailwind + animaciones NEXA
│   ├── tailwind.config.js
│   └── index.html
└── backend/
    ├── main.py                # FastAPI app
    └── requirements.txt
```
