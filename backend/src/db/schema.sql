-- ═══════════════════════════════════════════════════════════
-- PropAgent V3 — Complete PostgreSQL Schema
-- Run on Render PostgreSQL
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════
-- TENANTS (one row per broker/client)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tenants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        VARCHAR(20) UNIQUE NOT NULL,
  business_name    VARCHAR(200) NOT NULL,
  owner_name       VARCHAR(200) NOT NULL,
  email            VARCHAR(200) UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  phone            VARCHAR(20),
  country          VARCHAR(5) DEFAULT 'IN',
  city             VARCHAR(100),
  plan             VARCHAR(20) DEFAULT 'trial',
  status           VARCHAR(20) DEFAULT 'trial',
  trial_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  gstin            VARCHAR(20),
  trn              VARCHAR(20),
  business_number  VARCHAR(20),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_client_id ON tenants(client_id);

-- ═══════════════════════════════════════════════════════
-- SESSIONS (JWT refresh tokens)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(refresh_token);

-- ═══════════════════════════════════════════════════════
-- BROKER SETTINGS (one row per tenant)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS broker_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  whatsapp_number         VARCHAR(20),
  whatsapp_connected      BOOLEAN DEFAULT false,
  whatsapp_connected_at   TIMESTAMPTZ,
  whatsapp_provider       VARCHAR(20) DEFAULT 'meta',
  meta_phone_number_id    TEXT,
  meta_access_token       TEXT,
  meta_waba_id            TEXT,
  office_address          TEXT,
  office_city             VARCHAR(100),
  office_maps_link        TEXT,
  reminder_before_visit   VARCHAR(10) DEFAULT '1hr',
  customer_reminder       BOOLEAN DEFAULT true,
  customer_reminder_time  VARCHAR(10) DEFAULT '1hr',
  ai_name                 VARCHAR(50) DEFAULT 'Arjun',
  ai_tone                 VARCHAR(20) DEFAULT 'friendly',
  ai_followup_count       INTEGER DEFAULT 2,
  ai_followup_gap         VARCHAR(20) DEFAULT 'next_morning',
  no_msg_after_hour       INTEGER DEFAULT 21,
  language_default        VARCHAR(20) DEFAULT 'english',
  timezone                VARCHAR(50) DEFAULT 'Asia/Kolkata',
  language                VARCHAR(10) DEFAULT 'en',
  logo_url                TEXT,
  notification_prefs      JSONB DEFAULT '{}',
  ai_prefs                JSONB DEFAULT '{
    "answer_property_questions": true,
    "show_photos_automatically": true,
    "call_first_or_visit": "visit"
  }'::jsonb,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- CLIENT PLANS (limits per tenant)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS client_plans (
  tenant_id                UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  can_use_ai               BOOLEAN DEFAULT true,
  ai_message_limit         INTEGER DEFAULT 100,
  ai_messages_used         INTEGER DEFAULT 0,
  ai_reset_date            DATE DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE,
  max_properties           INTEGER DEFAULT 5,
  max_photos_per_property  INTEGER DEFAULT 5,
  max_team_members         INTEGER DEFAULT 1,
  max_storage_mb           INTEGER DEFAULT 500,
  can_use_instagram        BOOLEAN DEFAULT false,
  can_use_custom_persona   BOOLEAN DEFAULT false,
  can_use_api              BOOLEAN DEFAULT false,
  can_upload_documents     BOOLEAN DEFAULT false,
  can_white_label          BOOLEAN DEFAULT false,
  can_use_video            BOOLEAN DEFAULT false,
  is_suspended             BOOLEAN DEFAULT false,
  is_blocked               BOOLEAN DEFAULT false,
  monthly_price_paise      BIGINT,
  monthly_price_currency   VARCHAR(5) DEFAULT 'INR',
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- PROPERTIES
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS properties (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           VARCHAR(200) NOT NULL,
  property_type  VARCHAR(30) NOT NULL DEFAULT 'apartment',
  listing_type   VARCHAR(10) DEFAULT 'sale',
  area_size      DECIMAL(12,2),
  area_unit      VARCHAR(15) DEFAULT 'sqft',
  price          BIGINT NOT NULL,
  currency       VARCHAR(5) DEFAULT 'INR',
  city           VARCHAR(100) NOT NULL,
  location       VARCHAR(300) NOT NULL,
  area_tags      TEXT[] DEFAULT '{}',
  details        TEXT,
  is_available   BOOLEAN DEFAULT true,
  is_hidden      BOOLEAN DEFAULT false,
  land_type      VARCHAR(30),
  status         VARCHAR(20) DEFAULT 'available'
    CHECK (status IN ('available', 'sold', 'hidden', 'rented')),
  enquiry_count  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_available ON properties(tenant_id, is_available);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(tenant_id, city);

-- ═══════════════════════════════════════════════════════
-- PROPERTY PHOTOS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS property_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  caption      VARCHAR(200),
  sort_order   INTEGER DEFAULT 0,
  is_cover     BOOLEAN DEFAULT false,
  file_size_kb INTEGER,
  uploaded_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_property ON property_photos(property_id);

-- ═══════════════════════════════════════════════════════
-- TEAM MEMBERS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS team_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email        VARCHAR(200) NOT NULL,
  name         VARCHAR(200),
  password_hash TEXT,
  role         VARCHAR(20) DEFAULT 'agent',
  status       VARCHAR(20) DEFAULT 'active',
  invited_at   TIMESTAMPTZ DEFAULT NOW(),
  joined_at    TIMESTAMPTZ,
  last_login   TIMESTAMPTZ,
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_tenant ON team_members(tenant_id);

-- ═══════════════════════════════════════════════════════
-- AVAILABILITY SLOTS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS availability_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  slot_time       TIME NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  buffer_minutes  INTEGER DEFAULT 30
);

CREATE INDEX IF NOT EXISTS idx_slots_tenant ON availability_slots(tenant_id, day_of_week);

-- ═══════════════════════════════════════════════════════
-- CONVERSATIONS (one per unique customer phone per tenant)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS conversations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_phone           VARCHAR(20) NOT NULL,
  customer_name            VARCHAR(200),
  status                   VARCHAR(20) DEFAULT 'active',
  intent                   VARCHAR(20) DEFAULT 'unknown',
  lead_stage               VARCHAR(20) DEFAULT 'new',
  budget_min               BIGINT,
  budget_max               BIGINT,
  preferred_type           VARCHAR(50),
  preferred_area           VARCHAR(200),
  language_pref            VARCHAR(30) DEFAULT 'english',
  lead_score               INTEGER DEFAULT 0,
  human_override           BOOLEAN DEFAULT false,
  ai_paused                BOOLEAN DEFAULT false,
  followup_count           INTEGER DEFAULT 0,
  followup_capped          BOOLEAN DEFAULT false,
  is_returning             BOOLEAN DEFAULT false,
  callback_requested       BOOLEAN DEFAULT false,
  callback_requested_time  TIMESTAMPTZ,
  voice_note_received      BOOLEAN DEFAULT false,
  opted_out                BOOLEAN DEFAULT false,
  is_nri                   BOOLEAN DEFAULT false,
  assigned_to              UUID REFERENCES team_members(id) ON DELETE SET NULL,
  broker_notes             TEXT,
  last_broker_read         TIMESTAMPTZ,
  first_message_at         TIMESTAMPTZ DEFAULT NOW(),
  last_message_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, customer_phone)
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(tenant_id, customer_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_stage ON conversations(tenant_id, lead_stage);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(tenant_id, last_message_at DESC);

-- ═══════════════════════════════════════════════════════
-- MESSAGES
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  direction           VARCHAR(10) NOT NULL CHECK (direction IN ('inbound','outbound')),
  sender              VARCHAR(10) NOT NULL CHECK (sender IN ('customer','ai','broker','system')),
  content             TEXT NOT NULL,
  media_type          VARCHAR(20) DEFAULT 'text',
  media_url           TEXT,
  whatsapp_msg_id     VARCHAR(200),
  ai_model_used       VARCHAR(60),
  ai_confidence       DECIMAL(4,3),
  status              VARCHAR(20) DEFAULT 'sent',
  sent_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id, sent_at DESC);
-- Deduplication index
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_wa_id ON messages(whatsapp_msg_id)
  WHERE whatsapp_msg_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════
-- MEETINGS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS meetings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id     UUID REFERENCES conversations(id) ON DELETE SET NULL,
  customer_name       VARCHAR(200),
  customer_phone      VARCHAR(20),
  property_id         UUID REFERENCES properties(id) ON DELETE SET NULL,
  meeting_type        VARCHAR(20) DEFAULT 'site_visit',
  scheduled_at        TIMESTAMPTZ NOT NULL,
  booked_by           VARCHAR(10) DEFAULT 'ai',
  status              VARCHAR(20) DEFAULT 'confirmed',
  reminder_sent_at    TIMESTAMPTZ,
  broker_reminded     BOOLEAN DEFAULT false,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_tenant ON meetings(tenant_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(tenant_id, status);

-- ═══════════════════════════════════════════════════════
-- CALLBACKS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS callbacks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id   UUID REFERENCES conversations(id) ON DELETE SET NULL,
  customer_name     VARCHAR(200),
  customer_phone    VARCHAR(20) NOT NULL,
  requested_time    TIMESTAMPTZ,
  context_notes     TEXT,
  status            VARCHAR(20) DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_callbacks_tenant ON callbacks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_callbacks_overdue ON callbacks(tenant_id, requested_time)
  WHERE status = 'pending';

-- ═══════════════════════════════════════════════════════
-- LEAD ESCALATIONS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS lead_escalations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id     UUID REFERENCES conversations(id) ON DELETE SET NULL,
  escalation_type     VARCHAR(30) NOT NULL,
  triggered_at        TIMESTAMPTZ DEFAULT NOW(),
  owner_notified_at   TIMESTAMPTZ,
  resolved            BOOLEAN DEFAULT false,
  notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_escalations_tenant ON lead_escalations(tenant_id, resolved);

-- ═══════════════════════════════════════════════════════
-- AI USAGE LOG
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  model           VARCHAR(80),
  input_tokens    INTEGER DEFAULT 0,
  output_tokens   INTEGER DEFAULT 0,
  cost_usd        DECIMAL(12,8) DEFAULT 0,
  fallback_used   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant ON ai_usage_log(tenant_id, created_at DESC);

-- ═══════════════════════════════════════════════════════
-- AI FAILURES LOG
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ai_failures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id   UUID REFERENCES conversations(id) ON DELETE SET NULL,
  error_message   TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_failures_tenant ON ai_failures(tenant_id, created_at DESC);

-- ═══════════════════════════════════════════════════════
-- TENANT DOCUMENTS (PDF/text for AI context)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tenant_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id  UUID REFERENCES properties(id) ON DELETE CASCADE,
  filename     VARCHAR(255) NOT NULL,
  file_url     TEXT,
  mime_type    VARCHAR(100),
  status       VARCHAR(20) NOT NULL DEFAULT 'processing',
  error_message TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id  UUID NOT NULL REFERENCES tenant_documents(id) ON DELETE CASCADE,
  chunk_index  INTEGER NOT NULL,
  chunk_text   TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_documents_tenant ON tenant_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_documents_property ON tenant_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_document_chunks_document ON tenant_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_tenant_document_chunks_tenant ON tenant_document_chunks(tenant_id);

-- ═══════════════════════════════════════════════════════
-- HALLUCINATION LOG
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS hallucination_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id  UUID REFERENCES conversations(id) ON DELETE SET NULL,
  question         TEXT NOT NULL,
  ai_confidence    DECIMAL(4,3),
  action_taken     VARCHAR(20),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- PROMPT VERSIONS (Super Admin only)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS prompt_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version     INTEGER NOT NULL,
  content     TEXT NOT NULL,
  created_by  VARCHAR(100),
  is_active   BOOLEAN DEFAULT false,
  deployed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Insert v3 as active
INSERT INTO prompt_versions (version, content, created_by, is_active, deployed_at)
SELECT 3, 'v3 — see docs/prompts/ai-system-prompt-v3.md', 'admin', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM prompt_versions WHERE version = 3);

-- ═══════════════════════════════════════════════════════
-- SUPER ADMIN AUDIT LOG
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sa_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email  VARCHAR(200),
  action       TEXT NOT NULL,
  target_type  VARCHAR(50),
  target_id    UUID,
  details      JSONB,
  ip_address   VARCHAR(50),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sa_audit_created ON sa_audit_log(created_at DESC);

-- ═══════════════════════════════════════════════════════
-- SUPER ADMIN USERS (separate from tenant users)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS super_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          VARCHAR(200),
  role          VARCHAR(20) DEFAULT 'support',
  totp_secret   TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════
-- UPDATED_AT AUTO-TRIGGER
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER broker_settings_updated_at
  BEFORE UPDATE ON broker_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════
-- HELPER VIEWS
-- ═══════════════════════════════════════════════════════

-- Active conversations with lead count
CREATE OR REPLACE VIEW tenant_stats AS
SELECT
  t.id AS tenant_id,
  t.business_name,
  t.plan,
  COUNT(DISTINCT c.id) FILTER (WHERE c.created_at > NOW() - INTERVAL '30 days') AS leads_this_month,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'confirmed') AS meetings_confirmed,
  COALESCE(cp.ai_messages_used, 0) AS ai_used,
  COALESCE(cp.ai_message_limit, 0) AS ai_limit
FROM tenants t
LEFT JOIN conversations c ON c.tenant_id = t.id
LEFT JOIN meetings m ON m.tenant_id = t.id
LEFT JOIN client_plans cp ON cp.tenant_id = t.id
GROUP BY t.id, t.business_name, t.plan, cp.ai_messages_used, cp.ai_message_limit;
