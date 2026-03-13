# Deploy Guide (Netlify Frontend + Hosted API/AI)

This app uses:
- `frontend/` (Vite React) -> deploy on Netlify
- `backend/` (Node Express) -> deploy on Render/Railway/other Node host
- `ai-engine/` (FastAPI Python) -> deploy on Render/Railway/other Python host

Netlify cannot run your Express + FastAPI services as long-running servers, so those two must be hosted separately.

## 1) Deploy Backend (Node)

Host `backend/` on Render (recommended):
- Build command: `npm install`
- Start command: `npm start`
- Root directory: `backend`

Set backend environment variables:
- `NODE_ENV=production`
- `PORT=5000` (or host-provided)
- `CLIENT_URL=https://<your-netlify-site>.netlify.app`
- Firebase vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CREDENTIALS_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`)
- Redis, Cloudinary, Stripe, JWT secrets
- `AI_ENGINE_BASE_URL=https://<your-ai-service-domain>`

## 2) Deploy AI Engine (Python)

Host `ai-engine/` on Render as a Python web service:
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Root directory: `ai-engine`

Set AI env vars (Firestore-only):
- `GRAPH_STORE_BACKEND=firestore`
- `AI_ALLOW_SQLITE_FALLBACK=false`
- `FIREBASE_PROJECT_ID=ecommerce-120l`
- `FIREBASE_CREDENTIALS_PATH=/path/to/service-account.json` or `FIREBASE_SERVICE_ACCOUNT_JSON=...`
- Optional: `AI_TRUST_REQUIRE_ML=true`

## 3) Deploy Frontend on Netlify

This repo already includes `netlify.toml` for frontend builds.

In Netlify:
- Import the repo
- Build command: auto from `netlify.toml` (`npm run build`)
- Publish directory: auto from `netlify.toml` (`frontend/dist` via base `frontend`)

Add Netlify env var:
- `VITE_API_BASE_URL=https://<your-backend-domain>/api`

Redeploy after setting env var.

## 4) Post-deploy checks

1. Open app and login/signup.
2. Verify auth cookies are set and requests go to backend domain.
3. Open Be a Seller page and submit verification.
4. Confirm backend can reach AI engine and trust score updates.
5. Check AI logs show Firestore startup success.

## Notes

- Do not run `./run-ai.ps1` from `frontend/`; run from repo root.
- If Firestore says `Invalid JWT Signature`, regenerate Firebase service-account key and update host env.
- Rotate exposed secrets before production rollout.
