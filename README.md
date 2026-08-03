# CornellPulse

CornellPulse is an independent, privacy-focused resource navigator. It is not a Cornell University service, diagnosis, or clinically validated assessment. Peer Connect, supporter signup, and the public admin route remain disabled by default.

## Local setup

Requirements: Node.js 22+, Python 3.12, Docker Desktop, and PowerShell.

1. Copy `.env.example` to `backend/.env`. Replace local development placeholders; never commit that file.
2. Create the backend environment and install dependencies:
   `cd backend; python -m venv venv; .\venv\Scripts\python.exe -m pip install -r requirements.txt`
3. Install frontend dependencies:
   `cd ..\frontend; npm.cmd ci`
4. From the repository root, start PostgreSQL, Redis, API, and frontend with one command:
   `powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1`

The app is at `http://localhost:5173`; readiness evidence is at `http://localhost:8000/api/v1/health/ready`. Use `-SkipContainers` only when compatible PostgreSQL and Redis instances are already running.

## Database changes

Development startup creates missing tables. Existing or production databases must apply the ordered SQL files in `backend/migrations` with a backup and a transaction-capable PostgreSQL client. The migrations preserve records and do not drop user data.

## Checks

- Frontend: `npm.cmd run lint`, `npx.cmd tsc -b --pretty false`, `npm.cmd test`, `npm.cmd run test:e2e`, `npm.cmd run build`, `npm.cmd audit --omit=dev`
- Backend: `.\venv\Scripts\python.exe -m pytest -q`, `.\venv\Scripts\python.exe -m pip check`
- Repository: `powershell -ExecutionPolicy Bypass -File .\scripts\secret-scan.ps1`, `git diff --check`

Capacitor Android and iOS projects live under `frontend/android` and `frontend/ios`. Android can be synchronized on Windows. The generated iOS project requires macOS/Xcode for build, signing, VoiceOver, and device verification.
