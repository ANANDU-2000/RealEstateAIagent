# PropAgent — Next Stage (Stage 3: Onboarding + Properties)

**Previous:** Task 3.1 Onboarding ✅

## Current Task: 3.2 — Properties API

**Spec:** `docs/tracking/ALL-PAGES-MASTER.md` § 3.2  
**Schema:** `properties`, `property_photos`

### What to Build
- `backend/src/routes/properties.ts` — CRUD scoped to `tenant_id`
- `backend/src/services/properties.service.ts`
- Zod validators for create/update
- Wire into `backend/src/index.ts`

### API Endpoints
| Method | Path |
|--------|------|
| GET | `/properties` |
| GET | `/properties/:id` |
| POST | `/properties` |
| PUT | `/properties/:id` |
| DELETE | `/properties/:id` |

### Definition of Done
- All routes require `requireAuth`
- Every query uses `WHERE tenant_id = $1`
- Zod validation on create/update
- `npm run build:backend` passes

## After 3.2
Task 3.3 Properties list UI → 3.4 Details tab (run **M1** migration first)

See `docs/tracking/TASKS.md` for full list.
