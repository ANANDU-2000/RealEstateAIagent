# PropAgent Frontend — Agent Guide

Next.js 16 App Router. Read `node_modules/next/dist/docs/` for Next.js 16 breaking changes.

## Route Groups
```
app/(auth)/          — login, signup (public)
app/(dashboard)/     — protected broker dashboard
app/(marketing)/     — public marketing (Stage 7)
app/onboarding/      — post-signup checklist
```

## Component Locations
- `components/ui/` — Button, Input, Card, etc. (design system)
- `components/auth/` — LoginForm, SignupWizard
- `components/layout/` — Sidebar, PageHeader (Stage 6+)
- `lib/` — api.ts, constants.ts, validation/
- `hooks/` — useAuth.ts, useRealtime.ts

## Auth Token Strategy
- Access token: stored in memory via `useAuth` (React state)
- Refresh token: httpOnly cookie set by `/api/auth/refresh` and `/api/auth/login` route handlers
- API calls: `Authorization: Bearer {accessToken}` via `lib/api.ts`
- Never store passwords or access tokens in localStorage

## Required Per Route Group
- `loading.tsx` — skeleton fallback
- `error.tsx` — error boundary with retry

## Design System
Source: `files/all-pages-v3.md`
- Font: Inter via `next/font`
- Primary: `#2563EB`, Sidebar: `#0F172A`
- Lucide icons only — import from `lucide-react`

## Key Lucide Icons
```
MessageSquare → Chats    Calendar → Calendar    Home → Properties
Users → Leads            Phone → Callbacks      BarChart2 → Analytics
Settings → Settings      Building2 → Logo       Eye/EyeOff → Password
CheckCircle → Success    AlertTriangle → Warning
```

## API Client
All backend calls go through `lib/api.ts` → `NEXT_PUBLIC_API_URL`

## Compliance UI
- Signup Step 3: Terms + Privacy links; DPDP text for IN; CASL for CA
- Links to `/terms` and `/privacy` (Stage 7 — stub OK until built)

## Build Checklist
- [ ] Desktop 1440px layout matches spec
- [ ] Mobile 375px responsive
- [ ] Loading / empty / error states
- [ ] `metadata` export on page
- [ ] No Supabase imports
