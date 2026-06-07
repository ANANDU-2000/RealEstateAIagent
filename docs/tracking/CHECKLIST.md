# PropAgent — Master Checklist

Track overall project completion. Update as stages finish.

## Stage 1 — Foundation ✅
- [x] `.gitignore` protects secrets
- [x] Backend Express skeleton
- [x] Frontend Next.js skeleton
- [x] PostgreSQL schema file
- [x] Schema applied to Render DB (18 tables)
- [x] Environment files (local + example)
- [x] Render env vars set via MCP
- [x] `render.yaml` created
- [x] Cursor rules (3 files)
- [x] Tracking docs (8 files)
- [x] GitHub repo pushed
- [ ] Render service switched to Node.js runtime

## Stage 2 — Auth
- [ ] auth.service.ts
- [ ] auth middleware
- [ ] auth routes (register/login/refresh)
- [ ] Login page
- [ ] Signup wizard
- [ ] Next.js auth middleware

## Stage 3 — Properties
- [ ] Properties API CRUD
- [ ] Properties list page
- [ ] Add property page
- [ ] R2 photo upload

## Stage 4 — Settings
- [ ] Office settings page
- [ ] AI settings page
- [ ] Availability page

## Stage 5 — WhatsApp + AI
- [ ] WhatsApp webhook
- [ ] AI service (Claude + fallback)
- [ ] Prompt builder
- [ ] Conversation service
- [ ] Cron jobs

## Stage 6 — Dashboard
- [ ] Chats (Socket.IO)
- [ ] Calendar
- [ ] Leads/CRM
- [ ] Callbacks
- [ ] Analytics

## Stage 7 — Admin + Marketing
- [ ] Super Admin panel
- [ ] Landing page
- [ ] Pricing page

## Infrastructure
- [x] Render Postgres provisioned
- [x] Render backend service exists
- [ ] Render backend on Node.js
- [ ] Vercel frontend deployed
- [ ] Cloudflare R2 bucket + keys
- [ ] UptimeRobot keep-alive
- [ ] Custom domain (optional)

## Compliance (Pre-Launch)
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] DPDP consent flow (India)
- [ ] CASL consent (Canada signup)
- [ ] GST invoice generation (India)

## Pre-Launch QA
- [ ] Multi-tenant isolation tested
- [ ] AI hallucination control tested
- [ ] WhatsApp webhook live test
- [ ] Mobile responsive (375px)
- [ ] Payment flow test (sandbox)
