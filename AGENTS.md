# PropAgent — Agent Guide

How Cursor agents work on PropAgent V3.

## Before You Code
1. `docs/tracking/PROGRESS-CURRENT.md` — what's done + **next task ID**
2. `docs/tracking/PENDING.md` — what's blocked
3. `docs/tracking/ALL-PAGES-MASTER.md` — full page/tab/DB mapping for current task
4. `docs/tracking/TASKS.md` — pick next unchecked atomic task
5. `docs/tracking/SCHEMA-GAPS.md` — run migration before UI if column missing
6. `docs/tracking/BUILD-PLAYBOOK.md` — quality rules
7. Relevant spec in `files/` (especially `all-pages-v3.md`)

## One Task at a Time
Finish and verify **one task ID** (e.g. 3.1) before starting the next. Each task = one focused change set.

## Spec Reference Order
1. `files/all-pages-v3.md` — design, layout, icons, copy
2. `files/build-order-prompts.md` — build order + Cursor prompts
3. `backend/src/db/schema.sql` — data shapes (never guess columns)
4. `docs/tracking/ALL-PAGES-MASTER.md` — UI field → DB column mapping

## Architecture
```
WhatsApp → Render Backend (Express) → Render PostgreSQL
Browser  → Vercel Frontend (Next.js) → Render Backend (REST + Socket.IO)
Uploads  → Cloudflare R2
AI       → Anthropic Claude (primary), OpenAI fallback
```

## Stack (DO NOT DEVIATE)
- **NO Supabase** — Render Postgres + custom JWT + Socket.IO
- Every tenant query: `WHERE tenant_id = $1`
- Never invent data — no fake seed tenants or demo properties
- Never commit secrets — only `.env.example` in git

## Page Build Playbook Summary
| Pillar | Rule |
|--------|------|
| Desktop-first | Full layout at 1440px, then 375px mobile |
| Icons | Lucide React only |
| States | Loading skeleton, empty, error with retry |
| Security | Zod + bcrypt + JWT; rate limit auth |
| Compliance | DPDP (IN), CASL (CA) at signup |
| Copy | Human words, broker intent |

Full details: `docs/tracking/BUILD-PLAYBOOK.md`

## Schema-First Rule
Before building a form or settings tab:
1. Open `ALL-PAGES-MASTER.md` → UI Fields → DB Mapping for that task
2. If column/table missing → implement migration from `SCHEMA-GAPS.md` first
3. Never invent columns — update `schema.sql` after migration

## Tab / Sub-Tab Build Order
For multi-tab pages (Properties, Settings, Leads drawer, Super Admin):
1. Build **parent layout + routing** first
2. Build **first tab** to full DoD before secondary tabs
3. Each tab = sub-task within the stage (see TASKS.md)

## Super Admin Rules
- Separate auth from tenant JWT — use `super_admins` + `SA_JWT_SECRET`
- MFA (TOTP) required on login — `super_admins.totp_secret`
- Horizontal tab nav, dark header `#0F172A` — not broker sidebar
- **Every write action** → insert `sa_audit_log` (admin_email, action, target_type, target_id, details)
- Global AI kill switch requires MFA re-confirm
- Client detail views are **read-only** except explicit control actions (suspend, block, plan change)

## Build Order (Full)

| Stage | Status | Task IDs | Pages |
|-------|--------|----------|-------|
| 1 Foundation | ✅ | — | Monorepo, DB, skeleton |
| 2 Auth | ✅ | 2.0–2.5 | Login, Signup, auth API |
| 3 Onboarding + Properties | **current** | 3.1–3.7 | PAGE 3, PAGE 6 |
| 4 Settings | pending | 4.0–4.7 | PAGE 11 (7 sidebar tabs) |
| 5 WhatsApp + AI | pending | 5.1–5.5 | Webhook, AI, cron, realtime |
| 6 Dashboard | pending | 6.1–6.6 | PAGE 4–10 (Chats, Calendar, Leads, Callbacks, Analytics, Team) |
| 7 Marketing + SA | pending | 7.1–7.19 | Home, Pricing, Legal, Super Admin (11 tabs) |

**Next task:** **3.2** — Properties API (`/properties` CRUD)

Deferred: 2.6 Forgot password, 2.7 Google OAuth

## Cursor Rules
- `.cursor/rules/00-propagent-core.mdc`
- `.cursor/rules/10-design-system.mdc`
- `.cursor/rules/20-ai-agent.mdc`

## Verification Checklist
- [ ] TypeScript compiles (`npm run build`)
- [ ] Loading / empty / error states
- [ ] Tenant isolation on new queries
- [ ] No secrets in git
- [ ] Update TASKS.md + PROGRESS-CURRENT.md
- [ ] Mobile 375px for UI tasks
