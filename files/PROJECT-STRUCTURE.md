# PropAgent V3 — Complete Project Folder Structure
## Every File, Every Folder, Every Purpose

---

```
propagent/
│
├── README.md
├── .gitignore
├── .env.example
│
├── frontend/                          NEXT.JS APP — Deploy to Vercel
│   │
│   ├── app/
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx           Login page
│   │   │   ├── signup/
│   │   │   │   └── page.tsx           Trial signup
│   │   │   └── forgot-password/
│   │   │       └── page.tsx           Password reset
│   │   │
│   │   ├── (marketing)/               Public marketing site
│   │   │   ├── layout.tsx             Marketing nav + footer
│   │   │   ├── page.tsx               Landing page (/)
│   │   │   ├── features/
│   │   │   │   └── page.tsx           Features page
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx           Pricing page (India/UAE/Canada toggle)
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx           Blog index
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx       Blog post
│   │   │   ├── contact/
│   │   │   │   └── page.tsx           Contact page
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx           Privacy Policy
│   │   │   ├── terms/
│   │   │   │   └── page.tsx           Terms of Service
│   │   │   ├── ai-policy/
│   │   │   │   └── page.tsx           AI Usage Policy
│   │   │   └── [city]/
│   │   │       └── page.tsx           City SEO pages (e.g. /mumbai /dubai)
│   │   │
│   │   ├── (dashboard)/               Broker dashboard — requires auth
│   │   │   ├── layout.tsx             Sidebar + header + mobile nav
│   │   │   ├── page.tsx               Redirect → /chats
│   │   │   │
│   │   │   ├── chats/
│   │   │   │   └── page.tsx           Live chats (WebSocket)
│   │   │   │
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx           Calendar + meetings + callbacks
│   │   │   │
│   │   │   ├── properties/
│   │   │   │   ├── page.tsx           Property list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       Add new property form
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       Edit property
│   │   │   │
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx           CRM kanban/list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       Lead detail view
│   │   │   │
│   │   │   ├── callbacks/
│   │   │   │   └── page.tsx           Callback requests table
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx           Analytics dashboard
│   │   │   │
│   │   │   ├── team/
│   │   │   │   └── page.tsx           Team members + roles
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── page.tsx           Redirect → /settings/profile
│   │   │       ├── profile/
│   │   │       │   └── page.tsx       Business info
│   │   │       ├── whatsapp/
│   │   │       │   └── page.tsx       WhatsApp connection
│   │   │       ├── office/
│   │   │       │   └── page.tsx       Office address + visit reminders
│   │   │       ├── ai/
│   │   │       │   └── page.tsx       AI persona + tone + follow-up rules
│   │   │       ├── availability/
│   │   │       │   └── page.tsx       Slot management
│   │   │       ├── notifications/
│   │   │       │   └── page.tsx       Notification preferences
│   │   │       └── billing/
│   │   │           └── page.tsx       Plan + invoices + top-ups
│   │   │
│   │   ├── onboarding/
│   │   │   └── page.tsx               Post-signup setup checklist
│   │   │
│   │   └── superadmin/                Super Admin — separate auth
│   │       ├── layout.tsx             SA shell layout
│   │       ├── page.tsx               SA overview dashboard
│   │       ├── clients/
│   │       │   ├── page.tsx           All clients table
│   │       │   └── [id]/
│   │       │       └── page.tsx       Single client detail
│   │       ├── workspaces/
│   │       │   └── page.tsx           Workspace management
│   │       ├── billing/
│   │       │   └── page.tsx           Revenue, payments, invoices
│   │       ├── ai-governance/
│   │       │   └── page.tsx           Prompts, versions, hallucination logs
│   │       ├── prompts/
│   │       │   └── page.tsx           Prompt editor + version history
│   │       ├── keys/
│   │       │   └── page.tsx           API keys management
│   │       ├── cost-center/
│   │       │   └── page.tsx           Per-client cost breakdown
│   │       ├── security/
│   │       │   └── page.tsx           Audit logs, sessions
│   │       ├── infrastructure/
│   │       │   └── page.tsx           Service health, uptime
│   │       ├── compliance/
│   │       │   └── page.tsx           DPDP / PIPEDA / UAE flags
│   │       ├── feature-flags/
│   │       │   └── page.tsx           Enable/disable per workspace
│   │       └── announcements/
│   │           └── page.tsx           In-app announcements to clients
│   │
│   ├── components/
│   │   ├── ui/                        Base design system components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Drawer.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── Avatar.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileBottomNav.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── MarketingNav.tsx
│   │   │   └── MarketingFooter.tsx
│   │   │
│   │   ├── chats/
│   │   │   ├── ConversationList.tsx
│   │   │   ├── ConversationCard.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── CustomerProfile.tsx
│   │   │   ├── AiLockBar.tsx
│   │   │   ├── TakeOverBar.tsx
│   │   │   └── EscalationBanner.tsx
│   │   │
│   │   ├── calendar/
│   │   │   ├── WeekView.tsx
│   │   │   ├── DayView.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── UpcomingList.tsx
│   │   │   └── SlotPicker.tsx
│   │   │
│   │   ├── properties/
│   │   │   ├── PropertyList.tsx
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyForm.tsx
│   │   │   ├── PhotoUpload.tsx
│   │   │   ├── VideoUpload.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   └── AiTagsEditor.tsx
│   │   │
│   │   ├── leads/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   ├── LeadDetail.tsx
│   │   │   ├── LeadScore.tsx
│   │   │   ├── ActivityLog.tsx
│   │   │   └── LeadFilters.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── StatsGrid.tsx
│   │   │   ├── BarChart.tsx
│   │   │   ├── LineChart.tsx
│   │   │   ├── DonutChart.tsx
│   │   │   └── PropertyPerformance.tsx
│   │   │
│   │   └── marketing/
│   │       ├── Hero.tsx
│   │       ├── Features.tsx
│   │       ├── Pricing.tsx
│   │       ├── Testimonials.tsx
│   │       ├── CTA.tsx
│   │       └── FAQ.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts                Supabase browser client
│   │   ├── supabase-server.ts         Supabase server client (SSR)
│   │   ├── api.ts                     Fetch wrappers for backend
│   │   ├── utils.ts                   Shared utilities
│   │   ├── constants.ts               App constants
│   │   ├── currency.ts                Format INR/AED/CAD
│   │   └── tax.ts                     GST/VAT/HST calculations
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWorkspace.ts
│   │   ├── useConversations.ts
│   │   ├── useRealtime.ts             Supabase realtime
│   │   ├── useProperties.ts
│   │   └── useLeads.ts
│   │
│   ├── types/
│   │   └── index.ts                   All TypeScript interfaces
│   │
│   ├── middleware.ts                   Auth middleware (Next.js)
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
│
├── backend/                           NODE.JS API — Deploy to Render
│   │
│   ├── src/
│   │   ├── index.ts                   Express app entry
│   │   │
│   │   ├── routes/
│   │   │   ├── webhook.ts             POST /webhook/whatsapp
│   │   │   ├── auth.ts                POST /auth/login, /auth/refresh
│   │   │   ├── properties.ts          CRUD /api/properties
│   │   │   ├── conversations.ts       GET/PATCH /api/conversations
│   │   │   ├── meetings.ts            CRUD /api/meetings
│   │   │   ├── callbacks.ts           CRUD /api/callbacks
│   │   │   ├── leads.ts               CRUD /api/leads
│   │   │   ├── availability.ts        CRUD /api/availability
│   │   │   ├── settings.ts            GET/PATCH /api/settings
│   │   │   ├── team.ts                CRUD /api/team
│   │   │   ├── analytics.ts           GET /api/analytics
│   │   │   ├── billing.ts             POST /api/billing
│   │   │   ├── uploads.ts             POST /api/upload (Cloudflare R2)
│   │   │   └── superadmin/
│   │   │       ├── clients.ts
│   │   │       ├── billing.ts
│   │   │       ├── ai-governance.ts
│   │   │       ├── prompts.ts
│   │   │       ├── keys.ts
│   │   │       └── cost-center.ts
│   │   │
│   │   ├── services/
│   │   │   ├── ai.service.ts          Anthropic API (primary)
│   │   │   ├── ai-fallback.service.ts OpenAI fallback, Gemini fallback
│   │   │   ├── whatsapp.service.ts    Send via Twilio / Meta Cloud API
│   │   │   ├── conversation.service.ts Conversation state + history
│   │   │   ├── property-search.service.ts Area + type keyword match
│   │   │   ├── budget.service.ts      Low/high budget detection
│   │   │   ├── escalation.service.ts  Escalation rules + notifications
│   │   │   ├── followup.service.ts    Follow-up scheduler
│   │   │   ├── reminder.service.ts    Pre-visit reminders
│   │   │   ├── callback.service.ts    Callback management
│   │   │   ├── language.service.ts    Language detection
│   │   │   ├── notification.service.ts Push + WhatsApp to owner
│   │   │   ├── hallucination.service.ts Confidence checker
│   │   │   ├── lead-score.service.ts  Lead scoring engine
│   │   │   ├── tax.service.ts         GST / VAT / HST calculation
│   │   │   ├── invoice.service.ts     Invoice generation
│   │   │   ├── upload.service.ts      Cloudflare R2 upload
│   │   │   └── audit.service.ts       Audit log writes
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts                JWT validation
│   │   │   ├── workspace.ts           workspace_id injection
│   │   │   ├── rateLimiter.ts         Per-IP and per-workspace
│   │   │   ├── planGuard.ts           Feature flag enforcement
│   │   │   └── superadminGuard.ts     SA-only routes
│   │   │
│   │   ├── jobs/
│   │   │   ├── index.ts               Start all cron jobs
│   │   │   ├── followup.job.ts        Cron every hour (9AM-9PM)
│   │   │   ├── reminder.job.ts        Cron every 5 min
│   │   │   ├── callback.job.ts        Cron every 30 min
│   │   │   ├── usage-reset.job.ts     Monthly AI usage reset
│   │   │   └── payment-check.job.ts   Daily payment status check
│   │   │
│   │   └── utils/
│   │       ├── prompt.builder.ts      Assemble AI system prompt from workspace data
│   │       ├── language.detector.ts   Devanagari Unicode check
│   │       ├── slot.matcher.ts        "morning" / "evening" → actual slots
│   │       ├── currency.formatter.ts  INR / AED / CAD formatting
│   │       └── logger.ts              Structured logging
│   │
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql             Full schema
│   │   ├── 002_rls.sql                Row-level security
│   │   ├── 003_indexes.sql            Performance indexes
│   │   └── 004_v3_updates.sql         V3 additions
│   └── seed/
│       └── demo.sql                   Demo workspace data
│
│
└── docs/                              All documentation
    ├── MASTER-PLAN.md                 This file
    ├── PROJECT-STRUCTURE.md           Folder map
    ├── prompts/
    │   ├── ai-system-prompt-v3.md     Master AI prompt
    │   └── prompt-variables.md        All {variables} reference
    ├── pages/
    │   ├── dashboard-pages.md         All dashboard pages spec
    │   ├── superadmin-pages.md        All SA pages spec
    │   └── marketing-pages.md         Landing + blog + pricing
    ├── flows/
    │   ├── ai-conversation-flows.md   All 20 conversation scenarios
    │   ├── booking-flow.md            Booking + visit flow
    │   ├── escalation-flow.md         All escalation paths
    │   ├── language-flow.md           Hindi/Hinglish/Voice/Arabic
    │   └── onboarding-flow.md         First-time setup
    ├── design/
    │   ├── design-system.md           Colors, fonts, spacing
    │   ├── component-library.md       All components
    │   └── wireframes.md              Page wireframe descriptions
    ├── compliance/
    │   ├── india-compliance.md        DPDP, GST, IT Act
    │   ├── uae-compliance.md          UAE PDPL, VAT, RERA
    │   └── canada-compliance.md       PIPEDA, CASL, GST/HST
    ├── infrastructure/
    │   ├── deployment.md              Render + Vercel + Supabase setup
    │   ├── env-variables.md           All environment variables
    │   └── costs.md                   Monthly cost breakdown
    └── todo/
        └── todo-v3.md                 Prioritised task list
```
