# PropAgent — Master Checklist

## Per-Page Playbook (every task)
- [ ] Read task section in `ALL-PAGES-MASTER.md` + `all-pages-v3.md`
- [ ] Check `SCHEMA-GAPS.md` — run migration if UI field has no DB column
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
- [ ] Mark task complete in `TASKS.md` + update `PROGRESS-CURRENT.md`

## Per-Tab Checklist (multi-tab pages)
Use for Properties form, Settings sidebar, Leads drawer, Super Admin tabs.

- [ ] Parent layout + routing exists before any tab content
- [ ] First tab complete to DoD before starting next tab
- [ ] Each tab has own loading / empty / error states
- [ ] Tab switch preserves unsaved-changes warning (forms)
- [ ] Mobile: tabs → horizontal scroll or bottom sheet per spec

## Stage 1 — Foundation ✅
- [x] Monorepo, DB, backend, frontend, docs, git push

## Stage 2 — Auth ✅
- [x] UI components, auth API, login, signup, middleware, E2E verified

## Stage 3 — Onboarding + Properties (current)
- [ ] 3.1 Onboarding full checklist
- [ ] 3.2 Properties API
- [ ] 3.3–3.7 Properties UI + tabs

## Stage 4–7
See [TASKS.md](./TASKS.md) — atomic IDs through 7.19

## Infrastructure
- [x] Vercel frontend deployed
- [ ] Render backend Node runtime + `/health` live
- [ ] Cloudflare R2 keys (blocks 3.5)

## Master Backlog Docs
- [x] ALL-PAGES-MASTER.md
- [x] SCHEMA-GAPS.md (M1–M7)
- [x] AGENTS.md build order updated
