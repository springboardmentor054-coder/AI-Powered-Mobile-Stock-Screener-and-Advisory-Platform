# Deployment Guide

This project has two deployable parts:
- `backend` (Node.js API)
- `stock_screener_app` (Flutter Android app)

## 1. Deploy Backend (Render)

The repo now includes `render.yaml` for one-click setup.

### Steps
1. Push this repository to GitHub.
2. In Render, create a **Blueprint** from your GitHub repo.
3. Render will create:
   - Postgres database: `stock-screener-db`
   - Web service: `stock-screener-backend`
4. In Render dashboard, set secret environment variables for backend:
   - `GROQ_API_KEY`
   - `FINNHUB_API_KEY`
5. Deploy.

### Initialize DB schema once
Open Render Shell for the backend service and run:

```bash
cd backend
npm run db:init
```

`db:init` is safe by default and will skip if schema already exists.

To force a full destructive reset (drops tables), run only when intended:

```bash
FORCE_SCHEMA_RESET=true npm run db:init
```

### Verify backend
- Health: `https://<your-render-service>.onrender.com/health`
- Detailed health: `https://<your-render-service>.onrender.com/health/detailed`

If Finnhub key is invalid, backend will fall back to mock quote data.

## 2. Build Android App for Release

Use your deployed backend URL in build-time define.

### Quick command
```bash
cd stock_screener_app
flutter build appbundle --release --dart-define=API_BASE_URL=https://<your-render-service>.onrender.com
```

Generated file:
- `stock_screener_app/build/app/outputs/bundle/release/app-release.aab`

For direct APK testing:
```bash
flutter build apk --release --dart-define=API_BASE_URL=https://<your-render-service>.onrender.com
```

Generated file:
- `stock_screener_app/build/app/outputs/flutter-apk/app-release.apk`

## 3. Publish

### Google Play
1. Create app in Play Console.
2. Upload `app-release.aab`.
3. Complete store listing and rollout.

### Internal testing only
- Share `app-release.apk` directly.

## 4. Important Production Notes

- Backend already supports:
  - `DATABASE_URL` for cloud Postgres
  - SSL DB connections (`DB_SSL=true`)
  - `ENABLE_ADB_REVERSE=false` in production
- Mobile app endpoint is controlled by:
  - `--dart-define=API_BASE_URL=...`
