# PropAgent — Master Checklist

## Per-Page Playbook (every task)
- [ ] Read `all-pages-v3.md` section for this page
- [ ] Desktop layout at 1440px
- [ ] Mobile layout at 375px
- [ ] Lucide icons only
- [ ] Loading skeleton
- [ ] Empty state with CTA
- [ ] Error state with retry
- [ ] Human error messages
- [ ] `metadata` SEO export
- [ ] Zod validation (if form)
- [ ] No fake/seed data
- [ ] Tracking docs updated

## Stage 1 — Foundation ✅
- [x] Monorepo, DB, backend, frontend, docs, git push

## Stage 2 — Auth ✅
- [x] UI components (Button, Input, Card, etc.)
- [x] Backend auth service + routes
- [x] `/login` page
- [x] `/signup` wizard + compliance
- [x] Route protection middleware
- [x] E2E register + login verified (local backend → Render Postgres)

## Stage 3 — Properties
- [ ] Onboarding, properties CRUD, R2 upload

## Stage 4–7
See TASKS.md

## Infrastructure
- [x] Vercel frontend deployed
- [ ] Render backend `/health` live
- [ ] Cloudflare R2 keys
