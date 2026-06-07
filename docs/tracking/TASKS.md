# PropAgent — Tasks by Stage

## Stage 1 — Foundation ✅ Complete

## Stage 2 — Auth ✅ Complete

### 2.0 Design System
- [x] UI base components (`components/ui/*`)
- [x] Extended CSS tokens + `lib/constants.ts`

### 2.1 Backend Auth Service
- [x] `auth.service.ts` — bcrypt, JWT, client_id generation
- [x] `middleware/auth.ts` — requireAuth
- [x] `middleware/rateLimiter.ts` — 10/min on /auth
- [x] `utils/validators.ts` — Zod schemas

### 2.2 Backend Auth Routes
- [x] `routes/auth.ts` — register, login, refresh, logout
- [x] Wire into `index.ts`

### 2.3 Login Page
- [x] `(auth)/layout.tsx` — split panel
- [x] `(auth)/login/page.tsx` + LoginForm
- [x] Desktop + mobile, error shake, loading spinner

### 2.4 Signup Wizard
- [x] `(auth)/signup/page.tsx` + SignupWizard (3 steps)
- [x] DPDP/CASL compliance checkboxes
- [x] Plan cards with market pricing

### 2.5 Auth Wiring
- [x] `lib/api.ts` auth methods
- [x] `hooks/useAuth.tsx`
- [x] `middleware.ts` route protection
- [x] `(dashboard)/layout.tsx` stub + `/chats` placeholder
- [x] API route handlers for cookie refresh

## Stage 3 — Onboarding + Properties
- [ ] `/onboarding` checklist
- [ ] `/properties` list + edit
- [ ] `/properties/new`
- [ ] `routes/properties.ts` CRUD

## Stage 4 — Settings
- [ ] `/settings/office`, `/settings/ai`, `/settings/availability`

## Stage 5 — WhatsApp + AI
- [ ] Webhook, AI service, prompt builder, cron jobs

## Stage 6 — Dashboard
- [ ] `/chats`, `/calendar`, `/leads`, `/callbacks`, `/analytics`

## Stage 7 — Marketing + Admin
- [ ] `/`, `/pricing`, `/[city]`, `/privacy`, `/terms`, `/superadmin/*`
