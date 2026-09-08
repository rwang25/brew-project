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

## Run with Docker

The fastest way to get a persistent server running — `docker compose` handles the build, and `restart: unless-stopped` means it survives reboots and doesn't need a terminal session kept open:

```bash
docker compose up -d --build
```

Visit `http://<server-ip>:8000`. `brews.db` is bind-mounted from the repo root into the container, so your data lives outside the container and isn't lost on rebuild. To stop it: `docker compose down`. To see logs: `docker compose logs -f`.

## Backup

`brews.db` is **not tracked in git** — it's live application data that changes on every use, and a git operation (checkout, reset, stash) run against a tracked copy of it will silently revert real data to whatever was last committed. It's protected instead by:

- The Docker volume mount (`docker-compose.yml`), so the file survives container rebuilds.
- `scripts/backup-db.sh` — copies `brews.db` into `backups/` (also gitignored) with a timestamp, and prunes backups older than 30 days:

  ```bash
  ./scripts/backup-db.sh
  ```

  Run it before anything risky (upgrades, migrations, manual DB edits).

  On this machine it also runs automatically once a day at 3:00 AM via a macOS `launchd` agent (`scripts/com.brewtracker.backup.plist.example` is a copy of the installed job, for reference/reinstall). Check it with:

  ```bash
  launchctl print gui/501/com.brewtracker.backup
  ```

  Note: `launchd`-run scripts don't inherit Terminal's access to protected folders like Downloads — if the job's `.err.log` shows "Operation not permitted", grant Full Disk Access to `/bin/bash` in System Settings → Privacy & Security.

For an off-machine copy, periodically copy a file out of `backups/` somewhere else — another disk, cloud storage, wherever you'd keep something you don't want to lose.
