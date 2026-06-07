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
**Status:** Blocked  
**Have:** Team ID `team_U8qgfcFQABNoNtJrAy5QyaZf`, AI Gateway key (`vck_...`)  
**Need:** Vercel deploy token OR manual dashboard connection  
**Note:** `vck_` key is for Vercel AI Gateway, not deployment API.

**Steps:**
1. Vercel Dashboard → Add New Project
2. Import `ANANDU-2000/RealEstateAIagent`
3. Root Directory: `frontend`
4. Framework: Next.js (auto-detected)
5. Add env vars from `frontend/.env.example`
6. Set `NEXT_PUBLIC_API_URL=https://realestateaiagent-0ubp.onrender.com`
7. Update `FRONTEND_URL` on Render backend to match Vercel URL

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
