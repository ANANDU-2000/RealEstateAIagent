# PropAgent — Tasks by Stage

## Stage 1 — Foundation + Infrastructure ✅ (Current)
- [x] Root `.gitignore` (secrets protected)
- [x] Monorepo scaffold (`backend/`, `frontend/`)
- [x] PostgreSQL schema (`backend/src/db/schema.sql`)
- [x] Schema applied to Render Postgres
- [x] Backend: Express + health + Socket.IO bootstrap + pg pool
- [x] Frontend: Next.js + Tailwind design tokens + api/realtime stubs
- [x] Environment files (`.env.example`, local `.env`)
- [x] Render env vars via MCP
- [x] `render.yaml` Blueprint
- [x] Cursor rules (core, design, AI)
- [x] Tracking docs + AGENTS.md
- [x] GitHub push

## Stage 2 — Auth (Next)
- [ ] `auth.service.ts` — bcrypt hash, JWT sign/verify, refresh tokens
- [ ] `middleware/auth.ts` — requireAuth, tenantId injection
- [ ] `routes/auth.ts` — POST /auth/login, /auth/register, /auth/refresh, /auth/setup-workspace
- [ ] Frontend `/login` page
- [ ] Frontend `/signup` 3-step wizard
- [ ] Auth middleware in Next.js (`middleware.ts`)
- [ ] End-to-end login test

## Stage 3 — Onboarding + Properties
- [ ] `/onboarding` checklist page
- [ ] `/properties` list + edit panel
- [ ] `/properties/new` add form
- [ ] `routes/properties.ts` CRUD API
- [ ] R2 upload service (when keys available)

## Stage 4 — Settings + Availability
- [ ] `/settings/office`
- [ ] `/settings/ai`
- [ ] `/settings/availability`
- [ ] `routes/settings.ts`, `routes/availability.ts`

## Stage 5 — WhatsApp + AI Core
- [ ] `routes/webhook.ts`
- [ ] `services/ai.service.ts`
- [ ] `utils/prompt.builder.ts`
- [ ] `services/conversation.service.ts`
- [ ] Cron jobs (followup, reminder, callback)

## Stage 6 — Dashboard Pages
- [ ] `/chats` (Socket.IO realtime)
- [ ] `/calendar`
- [ ] `/leads`
- [ ] `/callbacks`
- [ ] `/analytics`

## Stage 7 — Super Admin + Marketing
- [ ] `/superadmin/*`
- [ ] Marketing landing `/`
- [ ] `/pricing`, `/features`
