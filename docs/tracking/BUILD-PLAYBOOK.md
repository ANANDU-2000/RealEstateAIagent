# PropAgent — Page Build Playbook

Every page/task follows this checklist. Source design spec: `files/all-pages-v3.md`.

## Before You Code
1. Read the page section in `files/all-pages-v3.md`
2. Read matching prompt in `files/build-order-prompts.md` if exists
3. Check `backend/src/db/schema.sql` for data shapes
4. Check `docs/tracking/TASKS.md` for current task ID

## Design Rules
- **Desktop-first**, then 375px mobile
- **Lucide React only** — 12/14/16/18px sizes
- Colors: Primary `#2563EB`, Dark `#0F172A`, Surface `#FFFFFF`, Muted `#6B7280`
- 8px spacing grid; border-radius 8px buttons, 12px cards
- Minimalist — no neon, no random gradients (auth mobile gradient is the exception)

## Required UI States
Every data-fetching view must include:
1. **Loading** — skeleton, never blank screen
2. **Empty** — icon + message + CTA
3. **Error** — human message + retry button

## Error Copy
- Use plain language: "Wrong email or password" not "401 Unauthorized"
- Inline field errors below inputs
- Toast for global failures (4s auto-dismiss)

## Security
- Zod validation on client AND server
- Never store passwords in localStorage
- Access token in memory; refresh token httpOnly cookie via `/api/auth/*` proxy
- All tenant queries: `WHERE tenant_id = $1`
- Rate limit auth routes: 10 req/min per IP

## Compliance by Country
| Country | Signup requirement |
|---------|-------------------|
| IN | DPDP consent checkbox + Terms/Privacy links |
| AE | Terms/Privacy links |
| CA | Terms/Privacy + CASL WhatsApp consent |

## SEO
- Export `metadata` on every page (title, description)
- Marketing pages (Stage 7): Open Graph + city geo pages

## Copy Guidelines
- Write for brokers, not developers
- Lead with user intent: "Sign in to manage your leads"
- No lorem ipsum, no fake testimonials, no invented stats

## After Each Task
- [ ] `npm run build` passes (frontend + backend)
- [ ] Mobile 375px checked
- [ ] Update `PROGRESS-CURRENT.md` and `TASKS.md`
- [ ] No secrets committed
