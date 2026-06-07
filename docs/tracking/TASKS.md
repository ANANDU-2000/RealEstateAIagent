# PropAgent — Tasks by Stage (Atomic)

Pick the **first unchecked** task. Full detail: [ALL-PAGES-MASTER.md](./ALL-PAGES-MASTER.md).

**Current next task:** 3.2

---

## Stage 1 — Foundation ✅

- [x] Monorepo, DB schema, backend skeleton, frontend, docs, git

---

## Stage 2 — Auth ✅

- [x] **2.0** UI base components + CSS tokens + constants
- [x] **2.1** Backend auth service (bcrypt, JWT, client_id, sessions)
- [x] **2.2** Backend auth routes (register, login, refresh, logout)
- [x] **2.3** Login page `/login` (split layout, shake, spinner)
- [x] **2.4** Signup wizard `/signup` (3 steps, DPDP/CASL)
- [x] **2.5** Auth wiring (useAuth, middleware, API cookie proxy, dashboard stub)
- [ ] **2.6** Forgot password `/forgot-password` — blocked: RESEND_API_KEY
- [ ] **2.7** Google OAuth — deferred

---

## Stage 3 — Onboarding + Properties

- [x] **3.1** Onboarding `/onboarding` — full PAGE 3 checklist + WhatsApp drawer  
  _Spec: all-pages-v3.md L259–278 | DB: tenants, broker_settings | API: GET /settings/onboarding-status, PATCH /settings/whatsapp_
- [ ] **3.2** Properties API `routes/properties.ts` — CRUD, tenant-scoped  
  _DB: properties, property_photos_
- [ ] **3.3** Properties list UI — filter tabs, sort, cards  
  _Files: app/(dashboard)/properties/page.tsx, PropertyList.tsx_
- [ ] **3.4** Property form — Details tab — **requires M1**  
  _Files: properties/new, properties/[id], PropertyForm.tsx_
- [ ] **3.5** Property form — Photos tab + R2 upload — **blocked: R2 keys**  
  _DB: property_photos | Files: PropertyPhotosTab.tsx, r2.service.ts_
- [ ] **3.6** Property form — Videos / Documents / AI Tags — **requires M2**  
  _DB: property_videos, property_documents, area_tags_
- [ ] **3.7** Property preview modal + delete confirm

---

## Stage 4 — Settings (PAGE 11)

- [ ] **4.0** Settings layout + sidebar (7 links)  
  _File: app/(dashboard)/settings/layout.tsx_
- [ ] **4.1** Profile `/settings/profile` — **requires M3** (timezone, language, logo)  
  _DB: tenants, broker_settings_
- [ ] **4.2** WhatsApp `/settings/whatsapp`  
  _DB: broker_settings meta fields_
- [ ] **4.3** Office & Visits `/settings/office`  
  _DB: broker_settings office + reminder fields_
- [ ] **4.4** AI Agent `/settings/ai` — **requires M3** ai_prefs JSONB  
  _DB: broker_settings_
- [ ] **4.5** Availability `/settings/availability`  
  _DB: availability_slots_
- [ ] **4.6** Notifications `/settings/notifications` — **requires M3** notification_prefs  
  _DB: broker_settings_
- [ ] **4.7** Billing `/settings/billing` — **requires M4**, Razorpay/Stripe  
  _DB: tenants, client_plans, invoices_

---

## Stage 5 — WhatsApp + AI

- [ ] **5.1** WhatsApp webhook — **blocked: META_* keys**  
  _Files: routes/webhook.ts, whatsapp.service.ts | DB: conversations, messages_
- [ ] **5.2** AI service + prompt builder — **blocked: ANTHROPIC_API_KEY**  
  _DB: prompt_versions, ai_usage_log_
- [ ] **5.3** Hallucination handler  
  _DB: hallucination_log, lead_escalations_
- [ ] **5.4** Cron jobs (follow-ups, 9pm, reminders, usage reset)  
  _DB: meetings, callbacks, conversations_
- [ ] **5.5** Socket.IO realtime for `/chats`  
  _Extend hooks/useRealtime.ts_

---

## Stage 6 — Dashboard

- [ ] **6.1** Live Chats `/chats` — 3-panel, list tabs, chat states, profile panel  
  _Spec: PAGE 4 | Depends: 5.1, 5.5 | DB: conversations, messages, lead_escalations_
- [ ] **6.2** Calendar `/calendar` — week/day/month, drawer, sidebar  
  _Spec: PAGE 5 | DB: meetings_
- [ ] **6.3** Leads CRM `/leads` — kanban + list, drawer tabs  
  _Spec: PAGE 7 | DB: conversations.lead_stage | Optional M6 for timeline_
- [ ] **6.4** Callbacks `/callbacks` — tabs, overdue banner  
  _Spec: PAGE 8 | DB: callbacks_
- [ ] **6.5** Analytics `/analytics` — stats cards, charts, property table  
  _Spec: PAGE 9 | API: GET /analytics/summary_
- [ ] **6.6** Team `/team` — table, invite, role permissions  
  _Spec: PAGE 10 | DB: team_members_

---

## Stage 7 — Marketing + Super Admin

### Marketing & Legal
- [ ] **7.1** Home `/` — full marketing spec  
  _Spec: MARKETING L899–910_
- [ ] **7.2** Features `/features`
- [ ] **7.3** Pricing `/pricing` — market toggle, plans, FAQ
- [ ] **7.4** Contact `/contact`
- [ ] **7.5** City SEO `/[city]` — mumbai, delhi, dubai, toronto + JSON-LD
- [ ] **7.6** Legal `/privacy`, `/terms`

### Super Admin
- [ ] **7.7** SA login `/superadmin/login` — TOTP MFA, separate JWT
- [ ] **7.8** SA layout + horizontal tab nav
- [ ] **7.9** SA Dashboard — global metrics
- [ ] **7.10** SA Clients — list, create form, detail sub-views, per-client controls
- [ ] **7.11** SA Workspaces — v1 tenant list
- [ ] **7.12** SA Billing — **requires M4**
- [ ] **7.13** SA AI Governance + Prompts sub-tab `/superadmin/ai/prompts`
- [ ] **7.14** SA Security + API Keys sub-tab `/superadmin/security/keys` — **requires M5**
- [ ] **7.15** SA Infrastructure — health dashboard
- [ ] **7.16** SA Compliance — **requires M5** data_requests
- [ ] **7.17** SA Cost Center `/superadmin/costs`
- [ ] **7.18** SA Announcements — **requires M5**
- [ ] **7.19** SA Feature Flags — **requires M5**, global AI kill switch

---

## Cross-cutting (apply per page)

- [ ] Mobile PWA bottom nav (5 tabs) — wire when dashboard shell matures
- [ ] `loading.tsx` + `error.tsx` per route group (see frontend/AGENTS.md)

---

## Schema migrations (before UI)

See [SCHEMA-GAPS.md](./SCHEMA-GAPS.md). Run migration **before** the task that needs it.

| Migration | Before task |
|-----------|-------------|
| M1 | 3.4 |
| M2 | 3.6 |
| M3 | 4.1, 4.4, 4.6 |
| M4 | 4.7, 7.12 |
| M5 | 7.14, 7.16, 7.18, 7.19 |
| M6 | 6.3 (optional) |
| M7 | 2.6 (password reset tokens) |
