# PropAgent — All Pages Master Backlog

Single source of truth for every page, tab, sub-tab, API route, and DB field mapping.  
**Spec:** [files/all-pages-v3.md](../../files/all-pages-v3.md)  
**Schema:** [backend/src/db/schema.sql](../../backend/src/db/schema.sql)  
**Schema gaps:** [SCHEMA-GAPS.md](./SCHEMA-GAPS.md)

**How to use:** Pick the next `pending` task in build order. Cross-check [TASKS.md](./TASKS.md) for atomic checklist.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `done` | Shipped and verified |
| `stub` | Route exists, not spec-complete |
| `pending` | Not started |
| `blocked` | Waiting on infra/keys (see PENDING.md) |

---

## Build Order Overview

```
Stage 2 (Auth) ✅ → Stage 3 (Onboarding + Properties) → Stage 4 (Settings)
→ Stage 5 (WhatsApp + AI) → Stage 6 (Dashboard) → Stage 7 (Marketing + Super Admin)
```

---

## STAGE 2 — Auth (Complete)

### 2.0 Design System
**Status:** done  
**Files:** `frontend/components/ui/*`, `frontend/app/globals.css`, `frontend/lib/constants.ts`

---

### 2.1–2.2 Auth API
**Status:** done  
**Spec:** build-order-prompts Phase 1  
**Depends on:** Stage 1

**Routes & Files:**
- `backend/src/services/auth.service.ts`
- `backend/src/middleware/auth.ts`, `rateLimiter.ts`
- `backend/src/utils/validators.ts`
- `backend/src/routes/auth.ts`

**API Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/register` | Create tenant + broker_settings + client_plans |
| POST | `/auth/login` | Return access + refresh tokens |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Revoke session |

**UI Fields → DB (Register):**
| UI Field | Table.Column |
|----------|--------------|
| Business Name | `tenants.business_name` |
| Owner Name | `tenants.owner_name` |
| Email | `tenants.email` |
| Password | `tenants.password_hash` (bcrypt) |
| Phone | `tenants.phone` |
| Country | `tenants.country` |
| Plan | `tenants.plan` |
| Trial expiry | `tenants.trial_expires_at` (+14 days) |
| Client ID | `tenants.client_id` (PA-IN-0001 format) |
| Default settings | `broker_settings` (insert) |
| Plan limits | `client_plans` (insert) |
| Session | `sessions.refresh_token` (hashed) |

---

### 2.3 PAGE 1 — Login `/login`
**Status:** done  
**Spec:** all-pages-v3.md PAGE 1 (lines 189–227)

**Routes & Files:**
- `frontend/app/(auth)/layout.tsx`
- `frontend/app/(auth)/login/page.tsx`
- `frontend/components/auth/LoginForm.tsx`
- `frontend/components/auth/AuthBrandPanel.tsx`

**Tabs / Sub-tabs:** None

**DoD:** Split desktop, gradient mobile, Eye toggle, shake on error, spinner, metadata export

---

### 2.4 PAGE 2 — Signup `/signup`
**Status:** done  
**Spec:** all-pages-v3.md PAGE 2 (lines 230–255)

**Routes & Files:**
- `frontend/app/(auth)/signup/page.tsx`
- `frontend/components/auth/SignupWizard.tsx`
- `frontend/lib/validation/auth.ts`

**Wizard Steps:**
1. Account (business, owner, email, password, phone, country)
2. Plan (Starter / Pro / Agency cards, monthly/annual toggle)
3. Confirm (Terms + DPDP IN / CASL CA)

**DoD:** Redirect to `/onboarding` on success

---

### 2.5 Auth Wiring
**Status:** done  

**Routes & Files:**
- `frontend/hooks/useAuth.tsx`
- `frontend/lib/api.ts`
- `frontend/middleware.ts`
- `frontend/app/api/auth/login|register|refresh|logout/route.ts`
- `frontend/lib/auth-cookies.ts`
- `frontend/app/(dashboard)/layout.tsx` (stub)
- `frontend/app/(dashboard)/chats/page.tsx` (placeholder)

**Protected routes:** `/onboarding`, `/chats`, `/properties`, `/leads`, `/callbacks`, `/calendar`, `/analytics`, `/settings`

---

### 2.6 Forgot Password `/forgot-password`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 1 (line 208)  
**Depends on:** 2.5, RESEND_API_KEY

**Routes & Files:**
- `frontend/app/(auth)/forgot-password/page.tsx`
- `backend/src/routes/auth.ts` — `POST /auth/forgot-password`, `POST /auth/reset-password`

**DB:** password reset tokens table (see SCHEMA-GAPS M7) or time-limited JWT

---

### 2.7 Google OAuth
**Status:** pending (deferred)  
**Spec:** all-pages-v3.md PAGE 1  
**Depends on:** Google OAuth client ID

---

## STAGE 3 — Onboarding + Properties

### 3.1 PAGE 3 — Onboarding `/onboarding`
**Status:** done  
**Spec:** all-pages-v3.md PAGE 3 (lines 259–278)  
**Depends on:** 2.5  
**Next task:** YES

**Routes & Files:**
- `frontend/app/onboarding/page.tsx` (replace stub)
- `frontend/components/onboarding/OnboardingChecklist.tsx`
- `frontend/components/onboarding/WhatsAppSetupDrawer.tsx`
- `backend/src/routes/settings.ts` — `GET /settings/onboarding-status`

**Layout:** Centered card 500px, progress bar steps 1–4

**Checklist Items:**
| Step | Label | Action | Completion check |
|------|-------|--------|------------------|
| 1 | Account created | Auto-done | always true post-signup |
| 2 | Connect WhatsApp | Opens WhatsApp setup drawer | `broker_settings.whatsapp_connected` |
| 3 | Add first property | Link → `/properties/new` | `COUNT(properties) > 0` |
| 4 | Set availability | Link → `/settings/availability` | `COUNT(availability_slots) > 0` |
| 5 | Add office address | Link → `/settings/office` | `broker_settings.office_address IS NOT NULL` |

**UI Fields → DB:**
| UI Field | Table.Column |
|----------|--------------|
| Welcome name | `tenants.owner_name` |
| AI name | `broker_settings.ai_name` (default Arjun) |
| WhatsApp status | `broker_settings.whatsapp_connected` |

**API Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/settings/onboarding-status` | Return checklist completion flags |

**DoD:** Progress bar, tappable checklist, skip link to dashboard, mobile 375px

---

### 3.2 Properties API
**Status:** pending  
**Depends on:** 2.5

**Routes & Files:**
- `backend/src/routes/properties.ts`
- `backend/src/services/properties.service.ts`
- `backend/src/utils/validators.ts` — property schemas

**API Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/properties` | List (filters, sort, pagination) |
| GET | `/properties/:id` | Single property + photos |
| POST | `/properties` | Create |
| PUT | `/properties/:id` | Update |
| DELETE | `/properties/:id` | Soft-delete or hard delete |
| POST | `/properties/:id/photos` | Upload photo (R2) — blocked until R2 keys |
| DELETE | `/properties/:id/photos/:photoId` | Remove photo |

**All queries:** `WHERE tenant_id = $1`

---

### 3.3 PAGE 6 — Properties List (left panel)
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 6 (lines 440–456)  
**Depends on:** 3.2

**Routes & Files:**
- `frontend/app/(dashboard)/properties/page.tsx`
- `frontend/components/properties/PropertyList.tsx`
- `frontend/components/properties/PropertyCard.tsx`

**Filter Tabs:**
| Tab | DB Filter |
|-----|-----------|
| All | `tenant_id` only |
| Available | `is_available = true AND is_hidden = false` |
| Sold | `is_available = false` (or `status = 'sold'` after M1) |
| Land | `property_type IN (land types)` |
| Residential | residential types |
| Commercial | commercial types |
| Hidden | `is_hidden = true` |

**Sort:** `price ASC/DESC`, `created_at DESC`, `enquiry_count DESC`

**Card fields:** thumbnail, name, location, price, status chip, enquiry count, hover actions (Edit, Hide, Mark Sold)

---

### 3.4 PAGE 6 — Form Tab: Details
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 6 (lines 462–473)  
**Depends on:** 3.2, **M1 migration**

**Routes & Files:**
- `frontend/app/(dashboard)/properties/new/page.tsx`
- `frontend/app/(dashboard)/properties/[id]/page.tsx`
- `frontend/components/properties/PropertyForm.tsx` — Details tab

**UI Fields → DB Mapping:**
| UI Field | Table.Column | Notes |
|----------|--------------|-------|
| Property Name * | `properties.name` | |
| Property Type * | `properties.property_type` | 12 types enum |
| Listing Type | `properties.listing_type` | sale / rent |
| Area Size | `properties.area_size` | DECIMAL |
| Area Unit | `properties.area_unit` | sqft, sqyards, acres, etc. |
| Price * | `properties.price` | BIGINT |
| Currency | `properties.currency` | INR/AED/CAD |
| City * | `properties.city` | |
| Locality/Area * | `properties.location` | AI search key |
| Description | `properties.details` | max 500 chars |
| Status Available | `properties.is_available` | |
| Status Hidden | `properties.is_hidden` | |
| Status Sold | `properties.is_available = false` | or M1 `status` |
| Land Type | `properties.land_type` | **M1 gap** — land types only |

---

### 3.5 PAGE 6 — Form Tab: Photos
**Status:** pending | **blocked:** R2 keys  
**Spec:** all-pages-v3.md PAGE 6 (lines 475–482)  
**Depends on:** 3.4, R2, 3.2 photo endpoints

**Routes & Files:**
- `frontend/components/properties/PropertyPhotosTab.tsx`
- `backend/src/services/r2.service.ts`

**UI Fields → DB:**
| UI Field | Table.Column |
|----------|--------------|
| Photo URL | `property_photos.url` |
| Cover photo | `property_photos.is_cover` |
| Sort order | `property_photos.sort_order` |
| File size | `property_photos.file_size_kb` |
| Caption | `property_photos.caption` |

**Limits:** `client_plans.max_photos_per_property`, `max_storage_mb`

---

### 3.6 PAGE 6 — Form Tabs: Videos / Documents / AI Tags
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 6 (lines 484–497)  
**Depends on:** 3.4, **M2 migration**

**Sub-tabs:**
| Tab | DB | Gap |
|-----|-----|-----|
| Videos | `property_videos` | **M2** — url, provider, sort_order |
| Documents | `property_documents` | **M2** — url, doc_type, visible_to_customer |
| AI Tags | `properties.area_tags` | TEXT[] — exists |

**Plan gates:** Videos/Docs require Pro+ (`client_plans.can_upload_documents`, `can_use_video`)

---

### 3.7 PAGE 6 — Preview + Delete
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 6 (lines 499–503)

**Features:**
- "Preview as AI sees it" modal
- Save / Discard buttons
- Delete Property with confirm modal

---

## STAGE 4 — Settings (PAGE 11)

**Shared shell:** `frontend/app/(dashboard)/settings/layout.tsx` — sidebar with 7 links

### 4.1 Settings: Profile `/settings/profile`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 11 Profile (lines 693–703)  
**Depends on:** 2.5, **M3 migration** (timezone, language, logo)

**UI Fields → DB:**
| UI Field | Table.Column | Gap |
|----------|--------------|-----|
| Business Name | `tenants.business_name` | |
| Owner Name | `tenants.owner_name` | |
| Email | `tenants.email` | readonly |
| Phone | `tenants.phone` | |
| Country | `tenants.country` | |
| City | `tenants.city` | |
| Timezone | `broker_settings.timezone` | **M3** |
| Language | `broker_settings.language` | **M3** |
| Logo upload | `broker_settings.logo_url` | **M3**, R2 |

**API:** `GET/PATCH /settings/profile`

---

### 4.2 Settings: WhatsApp `/settings/whatsapp`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 11 WhatsApp (lines 705–713)

**UI Fields → DB:**
| UI Field | Table.Column |
|----------|--------------|
| Connection status | `broker_settings.whatsapp_connected` |
| Connected number | `broker_settings.whatsapp_number` |
| Last message time | derived from `messages` |
| Meta Business Account ID | `broker_settings.meta_waba_id` |
| Phone Number ID | `broker_settings.meta_phone_number_id` |
| WhatsApp API Token | `broker_settings.meta_access_token` (masked) |
| Provider | `broker_settings.whatsapp_provider` |
| Connected at | `broker_settings.whatsapp_connected_at` |

**API:** `GET/PATCH /settings/whatsapp`, `POST /settings/whatsapp/disconnect`

---

### 4.3 Settings: Office & Visits `/settings/office`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 11 Office (lines 715–728)

**UI Fields → DB:**
| UI Field | Table.Column |
|----------|--------------|
| Office Address | `broker_settings.office_address` |
| City | `broker_settings.office_city` |
| Google Maps link | `broker_settings.office_maps_link` |
| Remind before visit | `broker_settings.reminder_before_visit` |
| Customer reminder toggle | `broker_settings.customer_reminder` |
| Customer reminder time | `broker_settings.customer_reminder_time` |

---

### 4.4 Settings: AI Agent `/settings/ai`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 11 AI Agent (lines 730–742)  
**Depends on:** **M3** (`ai_prefs JSONB` for toggles)

**UI Fields → DB:**
| UI Field | Table.Column |
|----------|--------------|
| AI Name | `broker_settings.ai_name` |
| Tone | `broker_settings.ai_tone` |
| Language preference | `broker_settings.language_default` |
| Follow-up count | `broker_settings.ai_followup_count` |
| Follow-up gap | `broker_settings.ai_followup_gap` |
| No messages after | `broker_settings.no_msg_after_hour` |
| Answer property questions | `broker_settings.ai_prefs` → **M3** |
| Show photos automatically | `broker_settings.ai_prefs` → **M3** |
| Call-first vs visit | `broker_settings.ai_prefs` → **M3** |

**Plan gate:** Custom persona → `client_plans.can_use_custom_persona`

---

### 4.5 Settings: Availability `/settings/availability`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 11 Availability (lines 744–749)

**UI Fields → DB:**
| UI Field | Table.Column |
|----------|--------------|
| Day of week | `availability_slots.day_of_week` | 0–6 |
| Slot time | `availability_slots.slot_time` |
| Active/blocked | `availability_slots.is_active` |
| Buffer minutes | `availability_slots.buffer_minutes` |

**API:** `GET/PUT /settings/availability` (replace all slots in transaction)

---

### 4.6 Settings: Notifications `/settings/notifications`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 11 Notifications (lines 751–761)  
**Depends on:** **M3** (`notification_prefs JSONB`)

**Toggles (stored in JSONB):**
- New message → push + WhatsApp
- Ultra Hot lead → push + WhatsApp (always on)
- New meeting booked → push
- Callback requested → push
- Overdue callback → push (repeating)
- AI usage 70% → email
- AI usage 95% → email + push
- Payment due / failed → email

---

### 4.7 Settings: Billing `/settings/billing`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 11 Billing (lines 763–775)  
**Depends on:** **M4 migration**, Razorpay/Stripe keys

**UI Fields → DB:**
| UI Field | Table.Column |
|----------|--------------|
| Current plan | `tenants.plan` |
| AI limit/used | `client_plans.ai_message_limit`, `ai_messages_used` |
| Renewal date | `subscriptions.renewal_at` → **M4** |
| GSTIN (IN) | `tenants.gstin` |
| TRN (AE) | `tenants.trn` |
| Business Number (CA) | `tenants.business_number` |
| Invoices | `invoices` table → **M4** |

---

## STAGE 5 — WhatsApp + AI

### 5.1 WhatsApp Webhook
**Status:** pending | **blocked:** META_* keys  
**Depends on:** 4.2

**Routes & Files:**
- `backend/src/routes/webhook.ts`
- `backend/src/services/whatsapp.service.ts`

**DB:** `conversations`, `messages` (dedupe via `whatsapp_msg_id`)

**API:** `GET/POST /webhook/whatsapp` (Meta verify + receive)

---

### 5.2 AI Service + Prompt Builder
**Status:** pending | **blocked:** ANTHROPIC_API_KEY  
**Depends on:** 3.2 (properties for context), 4.4

**Routes & Files:**
- `backend/src/services/ai.service.ts`
- `backend/src/services/prompt-builder.ts`

**DB:** `prompt_versions`, `ai_usage_log`

---

### 5.3 Hallucination Handler
**Status:** pending  
**Depends on:** 5.2

**DB:** `hallucination_log`, `lead_escalations`

---

### 5.4 Cron Jobs
**Status:** pending  
**Depends on:** 5.1, 5.2

**Jobs:** follow-ups (2 cap), 9pm rule, pre-visit reminders, callback overdue, AI usage reset

**DB:** `meetings`, `callbacks`, `conversations`, `client_plans.ai_reset_date`

---

### 5.5 Socket.IO Realtime
**Status:** pending  
**Depends on:** 5.1

**Events:** new message, conversation update, meeting booked  
**Frontend:** extend `hooks/useRealtime.ts` on `/chats`

---

## STAGE 6 — Dashboard Pages

### 6.1 PAGE 4 — Live Chats `/chats`
**Status:** stub  
**Spec:** all-pages-v3.md PAGE 4 (lines 282–386)  
**Depends on:** 5.1, 5.5

**Layout:** 3-panel — list 300px | chat flex | profile 280px

**List Tabs → DB filters:**
| Tab | Filter |
|-----|--------|
| All | all conversations |
| AI Active | `human_override = false AND ai_paused = false` |
| You | `human_override = true` |
| Hot | `lead_score >= threshold` |
| Ultra Hot | `lead_stage = 'ultra_hot'` or escalation |
| Callbacks | `callback_requested = true` |
| Booked | meetings exist |
| Cold | `lead_stage = 'cold'` |

**Centre panel states:** AI active, Human override, Locked (Ultra Hot)

**Right panel sections:**
| Section | DB Fields |
|---------|-----------|
| Identity | `customer_name`, `customer_phone`, avatar initials |
| Lead score | `lead_score`, `lead_stage` |
| Tags | derived: `is_nri`, `language_pref`, etc. |
| Details | `budget_min/max`, `preferred_area`, `preferred_type` |
| Notes | `conversations.broker_notes` |
| Escalations | `lead_escalations` |

**DB tables:** `conversations`, `messages`, `lead_escalations`

---

### 6.2 PAGE 5 — Calendar `/calendar`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 5 (lines 389–436)  
**Depends on:** 4.5, 5.4

**Views:** Week (default), Day, Month

**UI Fields → DB (`meetings`):**
| UI Field | Column |
|----------|--------|
| Scheduled time | `scheduled_at` |
| Type | `meeting_type` (site_visit, office, callback) |
| Status | `status` (confirmed, cancelled, no_show, completed) |
| Customer | `customer_name`, `customer_phone` |
| Property | `property_id` → `properties` |
| Booked by | `booked_by` (ai/broker) |
| Reminders | `reminder_sent_at`, `broker_reminded` |

**Drawer actions:** Cancel, Reschedule, No-Show, Send Reminder

---

### 6.3 PAGE 7 — Leads CRM `/leads`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 7 (lines 512–580)  
**Depends on:** 6.1

**Views:** Kanban (default), List table

**Kanban columns → `conversations.lead_stage`:**
new, qualified, interested, hot, ultra_hot, meeting_booked, visited, low_budget, cold, won, lost

**Drawer tabs:**
| Tab | Data source |
|-----|-------------|
| Overview | `conversations` + score breakdown |
| Timeline | `messages` + `lead_escalations` (+ **M6** `activity_log` optional) |
| Notes | `broker_notes` + note history |
| Meetings | `meetings` WHERE conversation_id |
| Escalations | `lead_escalations` |

**List view columns:** Name, Phone, Budget, Area, Stage, Score, Last Active, Actions — paginated 25/page

---

### 6.4 PAGE 8 — Callbacks `/callbacks`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 8 (lines 584–610)  
**Depends on:** 5.1

**Tabs:** All / Pending / Overdue / Done

**UI Fields → DB (`callbacks`):**
| UI Field | Column |
|----------|--------|
| Customer | `customer_name`, `customer_phone` |
| Requested time | `requested_time` |
| Context | `context_notes` |
| Status | `status` (pending, overdue, done) |
| Completed | `completed_at` |

---

### 6.5 PAGE 9 — Analytics `/analytics`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 9 (lines 614–648)  
**Depends on:** 6.1, 6.2, 6.4

**Data sources:**
- `tenant_stats` view
- `conversations`, `meetings`, `callbacks`, `ai_usage_log`, `client_plans`
- Property performance from `properties.enquiry_count`

**Stats cards:** Total Leads, Visits Booked, Ultra Hot, AI Messages Used, Callbacks, Cold Leads, Low Budget Escalations, Conversion Rate

**Charts:** Leads per day (bar), Lead source (donut), Property type (bar), Language (bar), AI usage line chart

**API:** `GET /analytics/summary?from=&to=`

---

### 6.6 PAGE 10 — Team `/team`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 10 (lines 652–678)  
**Depends on:** 2.5

**UI Fields → DB (`team_members`):**
| UI Field | Column |
|----------|--------|
| Name | `name` |
| Email | `email` |
| Role | `role` (owner, manager, agent, viewer, auditor) |
| Status | `status` (active, invited, disabled) |
| Last active | `last_login` |

**Invite flow:** POST creates row with `status = 'invited'`

**Permissions matrix:** enforce in backend middleware per role (spec table lines 664–674)

**API:** `GET/POST /team`, `PATCH /team/:id`, `DELETE /team/:id`

---

## STAGE 7 — Marketing + Legal + Super Admin

### 7.1 Home `/`
**Status:** pending (foundation page exists, not marketing spec)  
**Spec:** all-pages-v3.md MARKETING Home (lines 899–910)

**Sections:** Nav, Hero, Social proof, Features (3 cards), How it works, Testimonials, Pricing preview, CTA, Footer

**SEO:** metadata, Open Graph

---

### 7.2 Features `/features`
**Status:** pending  
**Spec:** lines 912–913

---

### 7.3 Pricing `/pricing`
**Status:** pending  
**Spec:** lines 915–921

**Features:** Market toggle IN/AE/CA, 3 plan columns, annual toggle, comparison table, FAQ

**Data:** `frontend/lib/constants.ts` PLANS

---

### 7.4 Contact `/contact`
**Status:** pending  
**Spec:** lines 923–927

**Form fields:** Name, Email, Company, Country, Message — no DB (email via Resend or store in `contact_submissions` optional)

---

### 7.5 City SEO `/[city]`
**Status:** pending  
**Spec:** lines 929–932

**Routes:** `/mumbai`, `/delhi`, `/dubai`, `/toronto` (dynamic `[city]`)

**SEO:** JSON-LD LocalBusiness, geo metadata

---

### 7.6 Legal `/privacy`, `/terms`
**Status:** pending  
**Spec:** compliance-all-markets.md, footer links

---

### 7.7 Super Admin Login `/superadmin/login`
**Status:** pending  
**Spec:** all-pages-v3.md PAGE 12 (lines 781–784)  
**Depends on:** SA_JWT_SECRET

**Auth:** Email + password only, no OAuth, **MFA TOTP required**

**DB:** `super_admins` (email, password_hash, totp_secret, is_active)

**Separate from tenant JWT** — use `SA_JWT_SECRET`

---

### 7.8 Super Admin Layout + Tab Nav
**Status:** pending  
**Spec:** lines 786–789

**Layout:** Dark header `#0F172A`, horizontal tabs (not sidebar)

**Top-level tabs:**
| Tab | Route |
|-----|-------|
| Dashboard | `/superadmin` |
| Clients | `/superadmin/clients` |
| Workspaces | `/superadmin/workspaces` |
| Billing | `/superadmin/billing` |
| AI Governance | `/superadmin/ai` |
| Security | `/superadmin/security` |
| Infrastructure | `/superadmin/infrastructure` |
| Compliance | `/superadmin/compliance` |
| Cost Center | `/superadmin/costs` |
| Announcements | `/superadmin/announcements` |
| Feature Flags | `/superadmin/flags` |

**Files:** `frontend/app/superadmin/layout.tsx`, `frontend/components/superadmin/TabNav.tsx`

---

### 7.9 SA Dashboard `/superadmin`
**Status:** pending  
**Spec:** lines 791–800

**Metrics:** Total clients, MRR, ARR, AI messages today + cost, New signups, Failed payments, Clients near limit, Churned, Top spenders

**DB:** aggregate `tenants`, `client_plans`, `ai_usage_log`, `tenant_stats`

---

### 7.10 SA Clients `/superadmin/clients`
**Status:** pending  
**Spec:** lines 802–836

**List table columns:** Client ID, Business, Plan, Country, AI Usage, Status, Payment, Joined, Actions

**Create Client form → DB:**
| Field | Column |
|-------|--------|
| Business Name | `tenants.business_name` |
| Owner Name | `tenants.owner_name` |
| Email | `tenants.email` |
| Phone | `tenants.phone` |
| Country | `tenants.country` |
| Plan | `tenants.plan` |
| Trial days | `tenants.trial_expires_at` |

**Auto-generated:** `client_id`, `broker_settings`, `client_plans`, welcome email

**Client detail sub-views (tabs or sections):**
| Sub-view | Data |
|----------|------|
| Profile | `tenants`, `broker_settings` |
| Properties | `properties` (read-only) |
| Conversations | `conversations`, `messages` (read-only) |
| AI usage graph | `ai_usage_log` |
| Payment history | `invoices` (**M4**) |
| Error logs | app logs / future table |
| Audit log | `sa_audit_log` WHERE target_id |

**Per-client controls:**
| Action | DB effect |
|--------|-----------|
| Change plan | `tenants.plan`, `client_plans` limits |
| Custom limits | `client_plans.*` override |
| Extend trial | `tenants.trial_expires_at` |
| Suspend | `client_plans.is_suspended = true`, AI paused |
| Block | `client_plans.is_blocked = true` |
| Delete | soft delete + 30-day retention policy |

**All SA writes → `sa_audit_log`**

---

### 7.11 SA Workspaces `/superadmin/workspaces`
**Status:** pending  
**Spec:** tab listed line 789 — **v1: 1 tenant = 1 workspace**

List tenants as workspaces until multi-workspace schema added.

---

### 7.12 SA Billing `/superadmin/billing`
**Status:** pending  
**Depends on:** **M4**

**Features:** Revenue chart, MRR/ARR, failed payments, overdue accounts, manual invoice, GST/VAT report by market

---

### 7.13 SA AI Governance `/superadmin/ai`
**Status:** pending  
**Spec:** lines 846–854

**Features:** Active model selector, rollout %, hallucination log, confidence chart, cost per conversation

**DB:** `ai_usage_log`, `hallucination_log`, `prompt_versions`

**Sub-tab: Prompts** → `/superadmin/ai/prompts` (lines 856–870)

| Prompt UI | DB Column |
|-----------|-----------|
| Version number | `prompt_versions.version` |
| Content | `prompt_versions.content` |
| Created by | `prompt_versions.created_by` |
| Active | `prompt_versions.is_active` |
| Deployed at | `prompt_versions.deployed_at` |

**Actions:** View, Edit, Set Active, Rollback, Diff, Save Draft, Publish

---

### 7.14 SA Security `/superadmin/security`
**Status:** pending  
**Spec:** lines 873–877 (API Keys section)

**Main:** Audit log viewer — `sa_audit_log`

**Sub-tab: API Keys** → `/superadmin/security/keys`

| Service | Stored in |
|---------|-----------|
| Anthropic, OpenAI, Gemini, Twilio, Meta, R2, Resend, Razorpay, Stripe | `sa_api_keys` (**M5**) |

**Actions:** Rotate, Revoke, Add Key, Rotate All (MFA confirm)

---

### 7.15 SA Infrastructure `/superadmin/infrastructure`
**Status:** pending  
**Spec:** tab line 789

**Features:** Service health (Render API), DB connection, R2 bucket stats, env var status (masked)

---

### 7.16 SA Compliance `/superadmin/compliance`
**Status:** pending  
**Depends on:** **M5** (`data_requests`)

**Features:** DPDP/PIPEDA/CASL export requests, delete account requests, processing status

---

### 7.17 SA Cost Center `/superadmin/costs`
**Status:** pending  
**Spec:** lines 879–888

**Per-client breakdown:** AI tokens × rate, WhatsApp count × rate, storage GB × rate, revenue, margin %

**DB:** `ai_usage_log`, `client_plans`, plan pricing constants

---

### 7.18 SA Announcements `/superadmin/announcements`
**Status:** pending  
**Depends on:** **M5** (`announcements` table)

**Features:** Broadcast message to all tenants or by plan/country

---

### 7.19 SA Feature Flags `/superadmin/flags`
**Status:** pending  
**Spec:** lines 890–893  
**Depends on:** **M5** (`feature_flags`)

**Features:** Feature × plan level toggles, global AI kill switch (red button, MFA confirm)

---

## MOBILE PWA (cross-cutting)

**Spec:** all-pages-v3.md lines 936–953

**Bottom nav (5 tabs):** Chats, Calendar, Properties, Leads, Settings

**Rules:** Single column, bottom sheets, 44×44px tap targets, no hover states, Leads = list not kanban on mobile

**Apply during each page task** — not a separate stage.

---

## Quick Reference — DB Tables by Stage

| Table | Stage first used |
|-------|------------------|
| `tenants`, `sessions`, `broker_settings`, `client_plans` | 2 |
| `properties`, `property_photos` | 3 |
| `property_videos`, `property_documents` | 3 (M2) |
| `availability_slots` | 4 |
| `conversations`, `messages` | 5 |
| `meetings`, `callbacks`, `lead_escalations` | 5–6 |
| `ai_usage_log`, `hallucination_log`, `prompt_versions` | 5–7 |
| `team_members` | 6 |
| `super_admins`, `sa_audit_log` | 7 |
| `invoices`, `subscriptions`, `payments` | 4/7 (M4) |
| `sa_api_keys`, `feature_flags`, `announcements`, `data_requests` | 7 (M5) |

---

## DoD (every task)

From [BUILD-PLAYBOOK.md](./BUILD-PLAYBOOK.md):
- [ ] Read spec section in all-pages-v3.md
- [ ] Desktop 1440px + mobile 375px
- [ ] Loading / empty / error states
- [ ] Lucide icons only
- [ ] Zod validation (forms)
- [ ] `WHERE tenant_id = $1` on all tenant queries
- [ ] `metadata` export (pages)
- [ ] No fake seed data
- [ ] Update TASKS.md + PROGRESS-CURRENT.md
