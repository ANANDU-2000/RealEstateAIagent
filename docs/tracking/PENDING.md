# PropAgent — Pending / Blocked Items

Items waiting on external input or manual dashboard steps.

## Render Environment Variables (MCP)
**Status:** MCP `update_environment_variables` returned 500 — set manually in Render Dashboard  
**Service:** `srv-d8idu0vlk1mc7382kgog` → Environment tab  
**Required vars:** See `.env.example` at repo root. Minimum for Stage 2:
- `NODE_ENV=production`
- `PORT=3001`
- `DATABASE_URL` (internal URL from Render Postgres dashboard)
- `FRONTEND_URL` (Vercel URL once connected)
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `SA_JWT_SECRET` (64+ char random strings)
- `R2_ACCOUNT_ID`, `R2_BUCKET_NAME=propagent-files`

## Critical — Render Service Misconfiguration
**Status:** Action required  
**Issue:** Render service `srv-d8idu0vlk1mc7382kgog` is configured as **Ruby** with wrong build/start commands.  
**Fix:** Update via Render Dashboard or MCP `update_web_service`:
- Runtime: `node`
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check Path: `/health`

Until fixed, pushes to GitHub will not deploy a working Node.js API.

## Cloudflare R2 — S3 Access Keys
**Status:** Blocked  
**Have:** Account ID `eb57a9a996efab97d734a66bb5cf373c`, API token  
**Need:** R2 S3-compatible Access Key ID + Secret Access Key  
**Steps:**
1. Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create token with Object Read & Write
3. Create bucket `propagent-files`
4. Enable public access or custom domain for `R2_PUBLIC_URL`
5. Add to `backend/.env` and Render env vars:
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_PUBLIC_URL`

## Vercel Project Connection
**Status:** Fix in progress — production returned `DEPLOYMENT_NOT_FOUND` (404 on all routes)  
**Domain:** `https://real-estate-a-i-agent.vercel.app`

**Repo config (updated):**
- Root `vercel.json` — `npm install --include=dev`, `npm run build:frontend`, output `frontend/.next`
- `frontend/vercel.json` — use when Root Directory is set to `frontend` in dashboard

**Required Vercel Dashboard settings:**
1. Project → Settings → General → **Root Directory:** `frontend` (recommended)  
   OR leave blank and use root `vercel.json`
2. Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://realestateaiagent-0ubp.onrender.com`
   - `NEXT_PUBLIC_APP_NAME=PropAgent`
3. Redeploy from latest `main` after push

**Live routes after successful deploy:**
- `/` — home with Sign in / Start trial
- `/login`, `/signup`, `/onboarding`, `/chats`
- Super Admin (`/superadmin/*`) — **not built yet** (Stage 7)

## API Keys Not Yet Provided
| Key | Required For | Stage |
|-----|-------------|-------|
| `ANTHROPIC_API_KEY` | AI conversations | Stage 5 |
| `META_*` (WhatsApp) | Webhook | Stage 5 |
| `RESEND_API_KEY` | Email notifications | Stage 2+ |
| `RAZORPAY_*` | India billing | Later |
| `STRIPE_*` | UAE/Canada billing | Later |

## Security Reminder
All secrets pasted in chat should be **rotated** after setup:
- Cloudflare API token
- Render MCP API key
- Render DB password
- JWT secrets (already generated fresh locally)

## Render Postgres 90-Day Free Tier
Set calendar reminder at day 80 to backup and rotate DB per `render-postgres-only.md` STEP 9.

## Schema Migrations (before UI tasks)

See [SCHEMA-GAPS.md](./SCHEMA-GAPS.md). Do not build UI for fields without a DB column.

| Migration | Blocks task | Notes |
|-----------|-------------|-------|
| M1 | 3.4 Property Details | `land_type`, `status` on properties |
| M2 | 3.6 Videos/Documents tabs | New tables |
| M3 | 4.1, 4.4, 4.6 Settings | timezone, logo, JSONB prefs |
| M4 | 4.7, 7.12 Billing | invoices, subscriptions, payments |
| M5 | 7.14–7.19 Super Admin | sa_api_keys, feature_flags, etc. |
| M6 | 6.3 Leads timeline | Optional activity_log |
| M7 | 2.6 Forgot password | password_reset_tokens |

**R2 keys** block task **3.5** (Property Photos).  
**META_* keys** block task **5.1** (WhatsApp webhook).  
**ANTHROPIC_API_KEY** blocks task **5.2** (AI service).
