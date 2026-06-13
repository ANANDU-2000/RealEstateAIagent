# PropAgent — Pending / Blocked Items

Items waiting on external input or manual dashboard steps.

## Render Backend — RESOLVED (2026-06-13)

**Service:** `srv-d8idu0vlk1mc7382kgog`  
**URL:** https://realestateaiagent-0ubp.onrender.com  
**Health:** `GET /health` → `{ ok: true, db: "connected" }`

Fixed via Render API:
- Runtime: **Node** (was Ruby)
- Build: `npm install --include=dev && npm run build`
- Start: `npm start`
- Health check: `/health`
- Env vars set (JWT secrets, DATABASE_URL, FRONTEND_URL, etc.)
- `RUN_MIGRATIONS=false` after first successful migration deploy

**Super Admin seeded:**
- Email: `admin@propagent.in`
- Password: set during deploy — rotate in Render/production if exposed
- Login: `/superadmin/login`

## Vercel Project Connection
**Status:** Action required — production still returns **404** (`DEPLOYMENT_NOT_FOUND`)  
**Domain:** `https://real-estate-a-i-agent.vercel.app`

Vercel CLI is installed but **not authenticated** (`vercel login` required).

**Required Vercel Dashboard settings:**
1. Connect GitHub repo `ANANDU-2000/RealEstateAIagent`
2. Root Directory: `frontend`
3. Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://realestateaiagent-0ubp.onrender.com`
   - `NEXT_PUBLIC_APP_NAME=PropAgent`
4. Redeploy from latest `main`

**Or via CLI after login:**
```bash
cd frontend
vercel link
vercel env add NEXT_PUBLIC_API_URL production   # https://realestateaiagent-0ubp.onrender.com
vercel env add NEXT_PUBLIC_APP_NAME production  # PropAgent
vercel --prod
```

## Cloudflare R2 — S3 Access Keys
**Status:** Blocked  
**Have:** Account ID `eb57a9a996efab97d734a66bb5cf373c`, API token  
**Need:** R2 S3-compatible Access Key ID + Secret Access Key  
**Steps:**
1. Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create token with Object Read & Write
3. Create bucket `propagent-files`
4. Enable public access or custom domain for `R2_PUBLIC_URL`
5. Add to Render env vars: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL`

## API Keys Not Yet Provided
| Key | Required For | Stage |
|-----|-------------|-------|
| `ANTHROPIC_API_KEY` | AI conversations | Stage 5 |
| `META_*` (WhatsApp) | Webhook | Stage 5 |
| `RESEND_API_KEY` | Email notifications | Stage 2+ |
| `RAZORPAY_*` | India billing | Later |
| `STRIPE_*` | UAE/Canada billing | Later |

## Security Reminder
Rotate credentials after setup if exposed in chat or logs:
- Render API key (MCP)
- Render DB password
- Super Admin password
- JWT secrets (already set in Render env)

## Render Postgres 90-Day Free Tier
DB `Real-Estate-DB` expires **2026-07-07**. Set calendar reminder at day 80 to backup per `render-postgres-only.md` STEP 9.

## Optional Ops
- **UptimeRobot:** monitor `https://realestateaiagent-0ubp.onrender.com/health` every 5 min

## Schema Migrations (before UI tasks)

M1–M3 applied on production via `RUN_MIGRATIONS=true` deploy. See [SCHEMA-GAPS.md](./SCHEMA-GAPS.md).

**R2 keys** block full **3.5** photo file upload (URL photos work).  
**META_* keys** needed to test live WhatsApp webhook.  
**ANTHROPIC_API_KEY** needed to test live AI replies.
