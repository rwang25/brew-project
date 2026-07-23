# Brew Tracker

A self-hosted app for tracking mead (and other) brews: conditions, times, and ingredients.

## Stack

- **Backend**: FastAPI + SQLModel, backed by SQLite (`brews.db`).
- **Frontend**: React + TypeScript + Vite, Tailwind + shadcn/ui.

The legacy Streamlit app (`app.py`) is kept for reference during the migration but is no longer the primary UI.

## Features

- Brew start, rack, bottle, and expected-ready dates
- Brew type, style, batch size, yeast, vessel, and fermentation temperature
- Ingredient lists with amounts, units, categories, and notes
- Gravity-reading history and chart
- Estimated ABV calculation using:
  `(original gravity - final gravity) * 131.25`
- Status tracking from planning through completion
- Process and tasting notes
- Persistent SQLite storage in `brews.db`

## Run locally (development)

Backend:

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (separate terminal):

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (defaults to `http://localhost:5173`). API requests are proxied to the backend on port 8000.

## Run in production (e.g. a home server / Raspberry Pi)

Build the frontend once, then run only the backend — it serves the built React app and the API from a single process/port:

```bash
cd frontend && npm install && npm run build
cd ../backend && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Visit `http://<server-ip>:8000` from any device on your network.

The database is created automatically at the repo root (`brews.db`) the first time the backend starts.

## Backup

Copy `brews.db` somewhere safe. It contains all saved brew, ingredient, and gravity data.
