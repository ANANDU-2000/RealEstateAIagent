# PropAgent — Schema Gaps & Migrations

Run migrations **before** building UI that depends on missing columns/tables.  
Apply via `backend/src/db/migrations/` + update [schema.sql](../../backend/src/db/schema.sql).

**Referenced from:** [ALL-PAGES-MASTER.md](./ALL-PAGES-MASTER.md), [TASKS.md](./TASKS.md)

---

## M1 — Property status + land type

**Unblocks:** Task 3.4 (Property Details tab)  
**Spec:** all-pages-v3.md PAGE 6 — Status Sold, Land Type field

```sql
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS land_type VARCHAR(30),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available'
    CHECK (status IN ('available', 'sold', 'hidden', 'rented'));
```

**Notes:**
- Map UI "Sold" → `status = 'sold'`, `is_available = false`
- Map UI "Hidden" → `status = 'hidden'`, `is_hidden = true`
- `land_type` visible only when `property_type` is a land type

---

## M2 — Property videos & documents

**Unblocks:** Task 3.6  
**Spec:** all-pages-v3.md PAGE 6 — Videos tab, Documents tab

```sql
CREATE TABLE IF NOT EXISTS property_videos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  provider     VARCHAR(20) DEFAULT 'youtube',
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url                   TEXT NOT NULL,
  doc_type              VARCHAR(50) NOT NULL,
  visible_to_customer   BOOLEAN DEFAULT false,
  file_size_kb          INTEGER,
  uploaded_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_videos_property ON property_videos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_property ON property_documents(property_id);
```

---

## M3 — Broker settings extensions

**Unblocks:** Tasks 4.1, 4.4, 4.6  
**Spec:** all-pages-v3.md PAGE 11 — Profile, AI Agent, Notifications

```sql
ALTER TABLE broker_settings
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_prefs JSONB DEFAULT '{
    "answer_property_questions": true,
    "show_photos_automatically": true,
    "call_first_or_visit": "visit"
  }';
```

**`notification_prefs` keys:** new_message, ultra_hot, meeting_booked, callback_requested, overdue_callback, ai_usage_70, ai_usage_95, payment_due, payment_failed

---

## M4 — Billing tables

**Unblocks:** Tasks 4.7, 7.12  
**Spec:** Settings Billing, SA Billing

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan            VARCHAR(20) NOT NULL,
  status          VARCHAR(20) DEFAULT 'active',
  provider        VARCHAR(20),
  external_id     TEXT,
  renewal_at      TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount          BIGINT NOT NULL,
  currency        VARCHAR(5) NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending',
  provider        VARCHAR(20),
  external_id     TEXT,
  pdf_url         TEXT,
  issued_at       TIMESTAMPTZ DEFAULT NOW(),
  paid_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id      UUID REFERENCES invoices(id) ON DELETE SET NULL,
  amount          BIGINT NOT NULL,
  currency        VARCHAR(5) NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending',
  provider        VARCHAR(20),
  external_id     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
```

---

## M5 — Super Admin platform tables

**Unblocks:** Tasks 7.14, 7.16, 7.18, 7.19

```sql
CREATE TABLE IF NOT EXISTS sa_api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service      VARCHAR(30) NOT NULL,
  key_hash     TEXT NOT NULL,
  key_preview  VARCHAR(12),
  status       VARCHAR(20) DEFAULT 'active',
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  rotated_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key  VARCHAR(50) UNIQUE NOT NULL,
  description  TEXT,
  default_on   BOOLEAN DEFAULT false,
  plan_overrides JSONB DEFAULT '{}',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(200) NOT NULL,
  body         TEXT NOT NULL,
  target       VARCHAR(20) DEFAULT 'all',
  target_filter JSONB,
  published_at TIMESTAMPTZ,
  created_by   VARCHAR(200),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('export', 'delete')),
  status       VARCHAR(20) DEFAULT 'pending',
  regulation   VARCHAR(10),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_data_requests_tenant ON data_requests(tenant_id);
```

---

## M6 — Activity log (optional)

**Unblocks:** Task 6.3 Leads Timeline tab (cleaner than stitching messages only)

```sql
CREATE TABLE IF NOT EXISTS activity_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id  UUID REFERENCES conversations(id) ON DELETE CASCADE,
  activity_type    VARCHAR(30) NOT NULL,
  description      TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_conversation ON activity_log(conversation_id, created_at DESC);
```

**Alternative:** Derive timeline from `messages` + `lead_escalations` + stage change events without M6 for v1.

---

## M7 — Password reset tokens

**Unblocks:** Task 2.6 Forgot password

```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_hash ON password_reset_tokens(token_hash);
```

---

## Migration workflow

1. Add SQL file: `backend/src/db/migrations/00X_description.sql`
2. Update `backend/src/db/schema.sql` to match (source of truth for new agents)
3. Run locally: `npm run migrate --workspace=backend`
4. Mark migration done in this file with date
5. Proceed with dependent UI task

| ID | Status | Applied |
|----|--------|---------|
| M1 | pending | — |
| M2 | pending | — |
| M3 | pending | — |
| M4 | pending | — |
| M5 | pending | — |
| M6 | optional | — |
| M7 | pending | — |
