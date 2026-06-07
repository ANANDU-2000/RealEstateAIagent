# PropAgent — Agent Guide

This document tells Cursor agents how to work on PropAgent V3.

## Before You Code
1. Read `docs/tracking/PROGRESS-CURRENT.md` — know what's done
2. Read `docs/tracking/PENDING.md` — know what's blocked
3. Read `docs/tracking/TASKS.md` — pick the next task in order
4. Read relevant spec in `files/` before implementing

## Architecture
```
WhatsApp → Render Backend (Express) → Render PostgreSQL
Browser  → Vercel Frontend (Next.js) → Render Backend (REST + Socket.IO)
Uploads  → Cloudflare R2
AI       → Anthropic Claude (primary), OpenAI fallback
```

## Stack Rules
- **NO Supabase** — use Render Postgres + custom JWT + Socket.IO
- Every tenant query: `WHERE tenant_id = $1`
- Never invent data — read schema at `backend/src/db/schema.sql`
- Never commit secrets — only `.env.example` in git

## Build Order (Strict)
See `files/build-order-prompts.md`:
1. Auth (login/signup) — Stage 2
2. Onboarding
3. Properties CRUD
4. Settings (office, AI, availability)
5. WhatsApp webhook + AI service
6. Chats (realtime)
7. Calendar, Leads, Callbacks, Analytics
8. Super Admin, Marketing

## Cursor Rules
- `.cursor/rules/00-propagent-core.mdc` — always on
- `.cursor/rules/10-design-system.mdc` — frontend
- `.cursor/rules/20-ai-agent.mdc` — AI/backend services

## MCP Tools Available
- **Render MCP** — env vars, service status, read-only Postgres queries
- **Cloudflare MCP** — R2 bindings (needs OAuth)

## Verification Checklist
Before marking a task done:
- [ ] TypeScript compiles (`npm run build`)
- [ ] Loading / empty / error states on UI
- [ ] Tenant isolation on all new queries
- [ ] No secrets in committed files
- [ ] Update `docs/tracking/PROGRESS-CURRENT.md`
