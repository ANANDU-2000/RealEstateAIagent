# PropAgent — Agent Guide

How Cursor agents work on PropAgent V3.

## Before You Code
1. `docs/tracking/PROGRESS-CURRENT.md` — what's done
2. `docs/tracking/PENDING.md` — what's blocked
3. `docs/tracking/TASKS.md` — pick next atomic task
4. `docs/tracking/BUILD-PLAYBOOK.md` — quality rules
5. Relevant spec in `files/` (especially `all-pages-v3.md`)

## One Task at a Time
Finish and verify one task before starting the next. Each task = one focused change set.

## Spec Reference Order
1. `files/all-pages-v3.md` — design, layout, icons, copy
2. `files/build-order-prompts.md` — build order + Cursor prompts
3. `backend/src/db/schema.sql` — data shapes (never guess columns)

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

## Build Order
1. Auth (Stage 2) — current
2. Onboarding + Properties (Stage 3)
3. Settings (Stage 4)
4. WhatsApp + AI (Stage 5)
5. Dashboard pages (Stage 6)
6. Marketing + Super Admin (Stage 7)

## Cursor Rules
- `.cursor/rules/00-propagent-core.mdc`
- `.cursor/rules/10-design-system.mdc`
- `.cursor/rules/20-ai-agent.mdc`

## Verification Checklist
- [ ] TypeScript compiles
- [ ] Loading / empty / error states
- [ ] Tenant isolation on new queries
- [ ] No secrets in git
- [ ] Update tracking docs
