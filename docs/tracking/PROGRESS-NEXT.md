# PropAgent — Next Stage (Stage 2: Auth)

**Prerequisites from Stage 1:** All met ✅

## Entry Criteria
- [x] DB schema applied
- [x] Backend skeleton running
- [x] Frontend skeleton running
- [x] Env files wired
- [ ] Render service updated to Node.js runtime (see PENDING.md)

## Stage 2 Goals
Build login/signup end-to-end so every dashboard page can require auth.

### Backend Tasks
1. `src/services/auth.service.ts` — bcrypt + JWT
2. `src/middleware/auth.ts` — Bearer token validation
3. `src/routes/auth.ts`:
   - `POST /auth/register` — create tenant + broker_settings + client_plans
   - `POST /auth/login` — return access + refresh tokens
   - `POST /auth/refresh` — rotate refresh token
   - `POST /auth/logout` — invalidate session

### Frontend Tasks
1. `app/(auth)/login/page.tsx` — email/password form
2. `app/(auth)/signup/page.tsx` — 3-step wizard (account → plan → confirm)
3. `middleware.ts` — protect `(dashboard)` routes
4. Auth context/hook for token storage

### Definition of Done
- New broker can register → gets tenant row in DB
- Login returns JWT → frontend stores token
- Protected route redirects to `/login` without token
- `GET /health` still works without auth

## After Stage 2
Proceed to Stage 3: Onboarding + Properties CRUD (see `TASKS.md`)
