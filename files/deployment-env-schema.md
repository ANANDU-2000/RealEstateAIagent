# PropAgent V3 — Infrastructure, Deployment & API Keys
## Render Free + Supabase Free + Vercel Free + All Env Variables

---

## FREE TIER STACK

| Service | Use | Free Limit | Upgrade When |
|---------|-----|------------|--------------|
| Vercel | Frontend (Next.js) | 100GB/month | Traffic > 100GB |
| Render | Backend (Node.js) | 750 hrs/month (sleeps) | Need always-on |
| Supabase | Database + Auth + Realtime | 500MB DB, 50MB/day transfer | > 10 active clients |
| Cloudflare R2 | Photos + files | 10GB free | > 10GB files |
| Resend | Email | 3,000/month | > 3,000 emails |
| Twilio | WhatsApp | Pay-per-msg (~₹0.7/msg) | - (always pay) |
| Anthropic | Claude AI | Pay-per-token | - (always pay) |

**Render free tier sleeps after 15 min idle.**
Fix: UptimeRobot free plan → ping `/health` every 5 min.

---

## ALL ENVIRONMENT VARIABLES

### Backend `.env`

```env
# ─────────────────────────────────────────────────────
# SERVER
# ─────────────────────────────────────────────────────
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://propagent.vercel.app
JWT_SECRET=minimum_32_character_random_string_here
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

# ─────────────────────────────────────────────────────
# SUPABASE
# ─────────────────────────────────────────────────────
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# NEVER use anon key in backend — always service_role

# ─────────────────────────────────────────────────────
# AI MODELS
# ─────────────────────────────────────────────────────
# Primary
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ANTHROPIC_MAX_TOKENS=400
ANTHROPIC_TEMPERATURE=0.3

# Fallback (if Claude fails)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_FALLBACK_ENABLED=true

# Second fallback
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-flash
GEMINI_FALLBACK_ENABLED=true

# Confidence threshold for human handoff
AI_CONFIDENCE_THRESHOLD=0.70

# ─────────────────────────────────────────────────────
# WHATSAPP — TWILIO (India & Canada)
# ─────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_SECRET=your_webhook_validation_secret

# ─────────────────────────────────────────────────────
# WHATSAPP — META CLOUD API (UAE + production scale)
# ─────────────────────────────────────────────────────
META_PHONE_NUMBER_ID=123456789012345
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxx
META_VERIFY_TOKEN=your_webhook_verify_token
META_APP_SECRET=xxxxxxxxxxxxxxxx
META_WABA_ID=123456789012345

# ─────────────────────────────────────────────────────
# FILE STORAGE — CLOUDFLARE R2
# ─────────────────────────────────────────────────────
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=propagent-files
R2_PUBLIC_URL=https://files.propagent.in

# ─────────────────────────────────────────────────────
# EMAIL — RESEND
# ─────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@propagent.in
EMAIL_REPLY_TO=support@propagent.in

# ─────────────────────────────────────────────────────
# PAYMENTS — RAZORPAY (India)
# ─────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────────────────
# PAYMENTS — STRIPE (UAE + Canada)
# ─────────────────────────────────────────────────────
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────────────────
# PUSH NOTIFICATIONS — WEB PUSH
# ─────────────────────────────────────────────────────
VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_SUBJECT=mailto:admin@propagent.in

# ─────────────────────────────────────────────────────
# MONITORING — SENTRY
# ─────────────────────────────────────────────────────
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o0.ingest.sentry.io/0

# ─────────────────────────────────────────────────────
# ANALYTICS — POSTHOG
# ─────────────────────────────────────────────────────
POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POSTHOG_HOST=https://app.posthog.com

# ─────────────────────────────────────────────────────
# UPTIME — BETTERSTACK
# ─────────────────────────────────────────────────────
BETTERSTACK_SOURCE_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────────────────
# SUPER ADMIN
# ─────────────────────────────────────────────────────
SUPER_ADMIN_EMAIL=admin@propagent.in
SUPER_ADMIN_TOTP_SECRET=BASE32_ENCODED_SECRET
SA_JWT_SECRET=different_secret_from_broker_jwt_minimum_64_chars

# ─────────────────────────────────────────────────────
# REDIS (Queue + Rate Limiting)
# ─────────────────────────────────────────────────────
REDIS_URL=redis://default:password@hostname:6379
# Free: Upstash Redis (10,000 commands/day free)

# ─────────────────────────────────────────────────────
# CRON JOBS CONFIG
# ─────────────────────────────────────────────────────
FOLLOWUP_CRON=0 9-21 * * *
REMINDER_CRON=*/5 * * * *
CALLBACK_CRON=*/30 * * * *
USAGE_RESET_CRON=0 0 1 * *
PAYMENT_CHECK_CRON=0 9 * * *
```

### Frontend `.env.local`

```env
# ─────────────────────────────────────────────────────
# SUPABASE (browser-safe keys only)
# ─────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# anon key is safe for frontend — RLS enforces security

# ─────────────────────────────────────────────────────
# API
# ─────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://propagent-backend.onrender.com
NEXT_PUBLIC_APP_URL=https://propagent.vercel.app

# ─────────────────────────────────────────────────────
# ANALYTICS
# ─────────────────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ─────────────────────────────────────────────────────
# PAYMENTS (frontend public keys)
# ─────────────────────────────────────────────────────
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────────────────
# PUSH NOTIFICATIONS
# ─────────────────────────────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────────────────
# SENTRY
# ─────────────────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o0.ingest.sentry.io/0
```

---

## AI MODEL SELECTION PER TASK

| Task | Model | Why |
|------|-------|-----|
| Customer conversation (primary) | Claude Sonnet | Best instruction following, low hallucination |
| Customer conversation (fallback) | GPT-4o mini | Cheaper, fast, good quality |
| Customer conversation (2nd fallback) | Gemini 1.5 Flash | Lowest cost, multilingual |
| Lead scoring | Claude Haiku | Fast, cheap, extraction task |
| Language detection | Rule-based (Unicode check) | No AI needed, deterministic |
| Prompt assembly | Server-side template string | No AI needed |
| Analytics summaries | Claude Haiku | Summarisation only |
| Invoice generation | Templating (no AI) | Deterministic |

### Failover Logic
```
Primary: Claude Sonnet
├── If timeout (>8s) → retry once
├── If error → switch to GPT-4o mini
│   ├── If GPT error → switch to Gemini 1.5 Flash
│   │   └── If Gemini error → queue message, notify owner
│   └── If GPT ok → log fallback used
└── If Anthropic quota exceeded → switch to GPT immediately
```

---

## COST PER AI CONVERSATION (Estimate)

Claude Sonnet pricing (as of 2025):
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens

Average conversation:
- System prompt: ~800 tokens (input)
- History (5 turns): ~400 tokens (input)
- Customer message: ~50 tokens (input)
- AI reply: ~80 tokens (output)
- Total per turn: ~1,250 input + 80 output

Per turn cost:
- Input: 1,250 × $3/1M = $0.00375 = ₹0.31
- Output: 80 × $15/1M = $0.0012 = ₹0.10
- **Per turn: ~₹0.41**

Per conversation (avg 6 turns): ~₹2.5

Per 500 messages/month (Starter plan): ~₹205
Starter plan revenue: ₹2,999
**AI cost as % of revenue: ~6.8%**

---

## WHATSAPP COST

Twilio WhatsApp per message:
- Incoming: $0.005 (~₹0.42)
- Outgoing: $0.005 (~₹0.42)
- Per conversation (10 messages): ~₹4.2

Meta Business Initiated conversations: $0.0492 per 24hr window
User-initiated conversations: Free for first 1,000/month

---

## RENDER FREE TIER DEPLOYMENT

### Backend `render.yaml`

```yaml
services:
  - type: web
    name: propagent-api
    env: node
    plan: free
    region: singapore   # closest to India + Gulf
    branch: main
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      # All other vars set in Render Dashboard → Environment
```

### Keep-Alive Setup (Render Free Tier)

Option A: UptimeRobot (free)
1. Go to uptimerobot.com → Create free account
2. New Monitor → HTTP(s)
3. URL: `https://YOUR-APP.onrender.com/health`
4. Interval: 5 minutes
5. Alert: email if down

Option B: GitHub Actions (free 2,000 min/month)
```yaml
# .github/workflows/keepalive.yml
name: Keep Alive
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl https://YOUR-APP.onrender.com/health
```

---

## SUPABASE FREE TIER SETUP

### Step 1: Create Project
1. supabase.com → New Project
2. Name: propagent
3. Database password: strong random string (save it)
4. Region: ap-south-1 (Mumbai) for India; eu-central-1 for UAE/Canada
5. Plan: Free

### Step 2: Run Migrations
1. Dashboard → SQL Editor
2. Run each migration file in order

### Step 3: Enable Realtime
1. Dashboard → Database → Replication
2. Enable replication on: conversations, messages, meetings, callbacks

### Step 4: Set Up Auth
1. Dashboard → Auth → Settings
2. Disable email confirmations (for faster testing)
3. Add custom JWT claims for workspace_id

### Step 5: Storage Buckets
1. Dashboard → Storage → New Bucket
2. Bucket: `property-photos` (public: true)
3. Bucket: `property-docs` (public: false)
4. Max file size: 5MB
5. Allowed MIME types: image/*, application/pdf

### Free Tier Limits
- 500MB database
- 1GB file storage
- 50MB transfer/day
- 500K Edge Function invocations/month
- 2 concurrent realtime connections (upgrade for more)

**Upgrade to Pro ($25/month) when:**
- DB > 400MB
- Daily transfer > 40MB
- > 5 active workspaces using realtime

---

## VERCEL FREE TIER DEPLOYMENT

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Or: connect GitHub repo in Vercel dashboard
# Auto-deploys on git push to main
```

### Vercel Project Settings
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Install command: `npm install`

### Edge Config (for feature flags)
```bash
vercel env add EDGE_CONFIG_ID
# Use Vercel Edge Config for fast feature flag reads
```

### Free Tier Limits
- 100GB bandwidth/month
- Unlimited hobby projects
- 12 deployments/day
- Serverless functions: 100GB-hours/month

---

## MCP SETUP (Cursor Pro)

### What MCPs to Use in Development

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_URL": "https://YOUR_PROJECT.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbG..."
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/propagent"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "github_pat_..."
      }
    }
  }
}
```

### Cursor Prompts Per File (Copy-Paste These)

#### For `src/services/ai.service.ts`:
```
Build the AI service for PropAgent.
- Primary: Anthropic Claude Sonnet
- Fallback: OpenAI GPT-4o mini
- Second fallback: Gemini 1.5 Flash
- Build prompt from workspace data using prompt.builder.ts
- Log every call to ai_usage_log table
- Hard stop if workspace ai_messages_used >= ai_message_limit
- Return {text, confidence, model_used, tokens_used}
- Timeout: 8 seconds before fallback
- All errors caught and logged to Sentry
```

#### For `src/routes/webhook.ts`:
```
Build the WhatsApp webhook handler for PropAgent.
- Validate Twilio/Meta signature
- Extract: phone, body, media_type
- If media_type = audio: return voice note fallback template
- If media_type = image: store and continue conversation
- Lookup or create conversation by phone + workspace_id
- Check: is_ai_paused, is_suspended, followup_capped
- If paused/suspended: skip AI, notify broker
- If new message: pass to conversation.service.ts
- Update: last_message_at, message count
- Always return 200 to Twilio (never 4xx/5xx)
```

#### For `src/utils/prompt.builder.ts`:
```
Build the prompt assembler for PropAgent.
- Accept: workspace_id
- Fetch: broker_settings, available properties, slots, booked slots
- Replace all {variables} in the master prompt template
- min_property_price = MIN(properties.price) WHERE is_available=true
- max_property_price = MAX(properties.price) WHERE is_available=true
- property_list_json = array of {name, type, area_size, area_unit, price, currency, city, location, area_tags, details}
- available_slots_json = slots not in booked_slots for next 14 days
- Return complete prompt string
- Cache per workspace for 5 minutes (Redis)
```

---

## COMPLETE SQL SCHEMA

```sql
-- Run in Supabase SQL Editor

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TENANTS
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       VARCHAR(20) UNIQUE NOT NULL,
  business_name   VARCHAR(200) NOT NULL,
  owner_name      VARCHAR(200) NOT NULL,
  email           VARCHAR(200) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  country         VARCHAR(5) DEFAULT 'IN' CHECK (country IN ('IN','AE','CA','SA','QA')),
  city            VARCHAR(100),
  plan            TEXT DEFAULT 'trial',
  status          TEXT DEFAULT 'trial',
  trial_expires   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  gstin           VARCHAR(20),   -- India
  trn             VARCHAR(20),   -- UAE
  business_number VARCHAR(20),   -- Canada
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- BROKER SETTINGS
CREATE TABLE broker_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  whatsapp_number         VARCHAR(20),
  whatsapp_connected      BOOLEAN DEFAULT false,
  whatsapp_provider       TEXT DEFAULT 'twilio',
  meta_phone_number_id    TEXT,
  meta_access_token       TEXT,
  office_address          TEXT,
  office_city             VARCHAR(100),
  office_maps_link        TEXT,
  reminder_before_visit   TEXT DEFAULT '1hr',
  customer_reminder       BOOLEAN DEFAULT true,
  customer_reminder_time  TEXT DEFAULT '1hr',
  ai_name                 VARCHAR(50) DEFAULT 'Arjun',
  ai_followup_count       INTEGER DEFAULT 2,
  ai_followup_gap         TEXT DEFAULT 'next_morning',
  ai_tone                 TEXT DEFAULT 'friendly',
  no_msg_after_hour       INTEGER DEFAULT 21,
  language_default        TEXT DEFAULT 'english',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENT PLANS
CREATE TABLE client_plans (
  tenant_id               UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  can_use_ai              BOOLEAN DEFAULT true,
  ai_message_limit        INTEGER DEFAULT 100,
  ai_messages_used        INTEGER DEFAULT 0,
  ai_reset_date           DATE DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),
  max_properties          INTEGER DEFAULT 5,
  max_photos_per_property INTEGER DEFAULT 5,
  max_team_members        INTEGER DEFAULT 1,
  can_use_instagram       BOOLEAN DEFAULT false,
  can_use_custom_persona  BOOLEAN DEFAULT false,
  can_use_multiple_agents BOOLEAN DEFAULT false,
  can_use_api             BOOLEAN DEFAULT false,
  can_upload_documents    BOOLEAN DEFAULT false,
  can_white_label         BOOLEAN DEFAULT false,
  can_use_video           BOOLEAN DEFAULT false,
  is_suspended            BOOLEAN DEFAULT false,
  is_blocked              BOOLEAN DEFAULT false
);

-- PROPERTIES
CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  property_type   TEXT NOT NULL DEFAULT 'apartment',
  listing_type    TEXT DEFAULT 'sale',
  area_size       DECIMAL(10,2),
  area_unit       TEXT DEFAULT 'sqft',
  price           BIGINT NOT NULL,
  currency        TEXT DEFAULT 'INR',
  city            VARCHAR(100) NOT NULL,
  location        VARCHAR(300) NOT NULL,
  area_tags       TEXT[] DEFAULT '{}',
  details         TEXT,
  is_available    BOOLEAN DEFAULT true,
  is_hidden       BOOLEAN DEFAULT false,
  enquiry_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for area search
CREATE INDEX idx_properties_location ON properties USING gin(area_tags);
CREATE INDEX idx_properties_tenant ON properties(tenant_id, is_available);

-- PROPERTY PHOTOS
CREATE TABLE property_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     VARCHAR(200),
  sort_order  INTEGER DEFAULT 0,
  is_cover    BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM MEMBERS
CREATE TABLE team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email       VARCHAR(200) NOT NULL,
  name        VARCHAR(200),
  role        TEXT DEFAULT 'agent' CHECK (role IN ('owner','manager','agent','viewer','auditor')),
  status      TEXT DEFAULT 'active',
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  joined_at   TIMESTAMPTZ,
  UNIQUE(tenant_id, email)
);

-- AVAILABILITY SLOTS
CREATE TABLE availability_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  slot_time       TIME NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  buffer_minutes  INTEGER DEFAULT 30
);

-- CONVERSATIONS
CREATE TABLE conversations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_phone          VARCHAR(20) NOT NULL,
  customer_name           VARCHAR(200),
  status                  TEXT DEFAULT 'active',
  intent                  TEXT DEFAULT 'unknown',
  lead_stage              TEXT DEFAULT 'new',
  budget_min              BIGINT,
  budget_max              BIGINT,
  preferred_type          TEXT,
  preferred_area          TEXT,
  language_pref           TEXT DEFAULT 'english',
  lead_score              INTEGER DEFAULT 0,
  human_override          BOOLEAN DEFAULT false,
  ai_paused               BOOLEAN DEFAULT false,
  followup_count          INTEGER DEFAULT 0,
  followup_capped         BOOLEAN DEFAULT false,
  is_returning            BOOLEAN DEFAULT false,
  callback_requested      BOOLEAN DEFAULT false,
  callback_requested_time TIMESTAMPTZ,
  voice_note_received     BOOLEAN DEFAULT false,
  is_nri                  BOOLEAN DEFAULT false,
  assigned_to             UUID REFERENCES team_members(id),
  first_message_at        TIMESTAMPTZ DEFAULT NOW(),
  last_message_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, customer_phone)
);

CREATE INDEX idx_conversations_tenant ON conversations(tenant_id, status);
CREATE INDEX idx_conversations_phone ON conversations(customer_phone, tenant_id);

-- MESSAGES
CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  direction         TEXT CHECK (direction IN ('inbound','outbound')),
  sender            TEXT CHECK (sender IN ('customer','ai','broker','system')),
  content           TEXT NOT NULL,
  media_type        TEXT DEFAULT 'text',
  media_url         TEXT,
  whatsapp_msg_id   VARCHAR(200),
  ai_model_used     TEXT,
  ai_confidence     DECIMAL(3,2),
  status            TEXT DEFAULT 'sent',
  sent_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, sent_at DESC);

-- MEETINGS
CREATE TABLE meetings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id   UUID REFERENCES conversations(id),
  customer_name     VARCHAR(200),
  customer_phone    VARCHAR(20),
  property_id       UUID REFERENCES properties(id),
  meeting_type      TEXT DEFAULT 'site_visit',
  scheduled_at      TIMESTAMPTZ NOT NULL,
  booked_by         TEXT DEFAULT 'ai',
  status            TEXT DEFAULT 'confirmed',
  reminder_sent_at  TIMESTAMPTZ,
  broker_reminded   BOOLEAN DEFAULT false,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- CALLBACKS
CREATE TABLE callbacks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id     UUID REFERENCES conversations(id),
  customer_name       VARCHAR(200),
  customer_phone      VARCHAR(20) NOT NULL,
  requested_time      TIMESTAMPTZ,
  context_notes       TEXT,
  status              TEXT DEFAULT 'pending',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

-- LEAD ESCALATIONS
CREATE TABLE lead_escalations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id   UUID REFERENCES conversations(id),
  escalation_type   TEXT NOT NULL,
  triggered_at      TIMESTAMPTZ DEFAULT NOW(),
  owner_notified_at TIMESTAMPTZ,
  resolved          BOOLEAN DEFAULT false,
  notes             TEXT
);

-- AI USAGE LOG
CREATE TABLE ai_usage_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  model           VARCHAR(100),
  input_tokens    INTEGER DEFAULT 0,
  output_tokens   INTEGER DEFAULT 0,
  cost_usd        DECIMAL(10,8) DEFAULT 0,
  fallback_used   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- HALLUCINATION LOG
CREATE TABLE hallucination_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id   UUID REFERENCES conversations(id),
  question          TEXT NOT NULL,
  ai_confidence     DECIMAL(3,2),
  action_taken      TEXT, -- 'answered' | 'escalated' | 'refused'
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- PROMPT VERSIONS (Super Admin)
CREATE TABLE prompt_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version     INTEGER NOT NULL,
  content     TEXT NOT NULL,
  created_by  VARCHAR(100),
  is_active   BOOLEAN DEFAULT false,
  deployed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial prompt version
INSERT INTO prompt_versions (version, content, created_by, is_active, deployed_at)
VALUES (3, 'v3_prompt_content_here', 'admin@propagent.in', true, NOW());

-- SA AUDIT LOG
CREATE TABLE sa_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email VARCHAR(200),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  details     JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own workspace data
-- (Backend uses service_role which bypasses RLS)
-- Frontend direct queries use anon key + these policies

CREATE POLICY "own_workspace" ON properties
  FOR ALL USING (
    tenant_id IN (
      SELECT t.id FROM tenants t
      JOIN team_members tm ON tm.tenant_id = t.id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Same pattern for all tables
```
