# PropAgent — Current Progress

**Stage:** 6 — Dashboard (core broker UI complete)  
**Status:** In Progress  
**Next task:** 5.4 (Cron jobs) or 4.1 (Profile settings)  
**Date:** 2026-06-13

## Completed in Full Roadmap (Phases 0–9)

### Stage 3 — Properties ✅
- [x] **3.1** Onboarding
- [x] **3.2** Properties API (CRUD, photos URL-based, status, tenant-scoped)
- [x] **3.3–3.4** List + form (Details tab, M1 migration applied)
- [x] **3.5** Photos tab (URL add/delete — R2 upload deferred)
- [x] **3.6** AI Tags tab (`area_tags`)
- [x] **3.7** Delete confirm + edit flow

### Stage 4 — Settings (partial) ✅
- [x] **4.0** Settings layout + sidebar
- [x] **4.2–4.5** WhatsApp, Office, AI Agent, Availability
- [ ] **4.1, 4.6, 4.7** Profile, Notifications, Billing — deferred

### Stage 5 — WhatsApp + AI (partial) ✅
- [x] **5.1** WhatsApp webhook (`/webhook/whatsapp`)
- [x] **5.2** AI service + prompt builder
- [x] **5.5** Socket.IO realtime (JWT auth, tenant rooms)
- [ ] **5.3** Hallucination handler — deferred
- [ ] **5.4** Cron jobs — deferred

### Stage 6 — Dashboard ✅
- [x] **6.1** Live Chats (3-panel + mobile)
- [x] **6.2** Calendar (week grid + book visit)
- [x] **6.3** Leads CRM (kanban + list + drawer)
- [x] **6.4** Callbacks
- [x] **6.5** Analytics
- [ ] **6.6** Team — deferred

### Stage 7 — Super Admin (partial) ✅
- [x] **7.7** SA login with TOTP support (when `totp_secret` set)
- [x] **7.8–7.9** SA layout + dashboard stats
- [x] **7.10** SA Clients (create, suspend/block, plan change)
- [x] **7.13** SA Prompt editor (`/superadmin/prompt`)
- [ ] **7.1–7.6** Marketing pages — deferred
- [ ] **7.11–7.12, 7.14–7.19** Full SA tabs — deferred (M4/M5)

### Cross-cutting ✅
- [x] Full dashboard sidebar + mobile bottom nav + badge polling
- [x] Schema migrations M1–M3 + `last_broker_read`

## Known Blockers (manual / external)
- Render dashboard env vars — see [PENDING.md](./PENDING.md)
- R2 keys — full photo file upload (URL photos work today)
- META_* + ANTHROPIC keys — required to test live WhatsApp AI
- UptimeRobot — set manually on `/health`

## Reference
- Master backlog: `docs/tracking/ALL-PAGES-MASTER.md`
- Atomic tasks: `docs/tracking/TASKS.md`
