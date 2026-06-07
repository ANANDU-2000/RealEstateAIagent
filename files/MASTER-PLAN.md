# PropAgent V3.0 — Master Plan
## Real Estate Operating System — End to End

---

## What PropAgent Is

A SaaS platform that gives every real estate broker a WhatsApp AI agent, CRM, property management system, booking engine, team manager, and analytics — all in one dashboard.

One product. Three markets: India, UAE, Canada.

---

## Markets

### India
- Language: English, Hinglish, Hindi
- Currency: INR
- Tax: GST 18% on SaaS subscriptions
- Payment: Razorpay
- Compliance: DPDP Act 2023, IT Act 2000
- WhatsApp: Twilio / Meta Cloud API
- Measurement: sq ft, sq yards, kanal, bigha, acres

### UAE (Gulf)
- Language: English, Arabic
- Currency: AED
- Tax: VAT 5%
- Payment: Stripe
- Compliance: UAE Personal Data Protection Law, RERA
- WhatsApp: Meta Cloud API
- Measurement: sq ft

### Canada
- Language: English, French (Quebec)
- Currency: CAD
- Tax: GST/HST/PST by province
- Payment: Stripe
- Compliance: PIPEDA, CASL (anti-spam), FINTRAC
- WhatsApp: Meta Cloud API
- Measurement: sq ft

---

## Full Feature List

### Core
- WhatsApp AI Agent (Arjun)
- Multi-language: English, Hinglish, Hindi (Devanagari → Hinglish reply), Arabic, French
- Voice note detection and graceful fallback
- Area-based property search (not list-all)
- Budget qualification with low/high escalation
- 2 follow-ups max, never after 9 PM
- Existing customer detection (no re-onboarding)
- Human takeover at any point
- Real-time dashboard with WebSocket

### CRM
- Lead pipeline: New → Qualified → Interested → Hot → Ultra Hot → Booked → Visited → Won → Lost
- Lead scoring engine
- Kanban + list view
- Notes, activities, tags
- Callback tracker
- Escalation history

### Property Management
- All types: apartment, villa, house, studio, penthouse, plot, land, commercial, warehouse, shop, office, building
- Multiple currencies
- Multiple measurement units
- Photos (up to 20/property on Pro+)
- Videos (Pro+)
- Documents: brochure, floor plan, legal
- AI tags for search

### Booking
- Site visit, office visit, phone call booking
- Ask call-first or direct visit
- Slot availability system
- Pre-visit reminders to owner
- Customer WhatsApp reminder
- Calendar with colour-coded events

### Team
- Roles: Owner, Manager, Agent, Viewer, Auditor
- Per-role permissions
- Assign leads to agents
- Agent performance tracking

### Analytics
- Leads, meetings, conversions
- Property performance
- AI usage cost
- Revenue tracking
- Churn signals

### Super Admin
- All client management
- Workspace creation
- Billing control
- AI governance
- Prompt versioning
- Model switching
- API key rotation
- Feature flags
- Cost center
- Audit logs

---

## Plans & Pricing

### India Plans

| Plan | Price | AI Msgs | Properties | Team |
|------|-------|---------|------------|------|
| Starter | ₹2,999/mo | 500 | 10 | 1 |
| Pro | ₹5,999/mo | 2,000 | 50 | 3 |
| Agency | ₹12,999/mo | 10,000 | Unlimited | 10 |
| Custom | Negotiated | Custom | Custom | Custom |

### UAE Plans

| Plan | Price | AI Msgs | Properties | Team |
|------|-------|---------|------------|------|
| Starter | AED 149/mo | 500 | 10 | 1 |
| Pro | AED 299/mo | 2,000 | 50 | 3 |
| Agency | AED 649/mo | 10,000 | Unlimited | 10 |

### Canada Plans

| Plan | Price | AI Msgs | Properties | Team |
|------|-------|---------|------------|------|
| Starter | CAD 49/mo | 500 | 10 | 1 |
| Pro | CAD 99/mo | 2,000 | 50 | 3 |
| Agency | CAD 199/mo | 10,000 | Unlimited | 10 |

### Add-Ons (All Markets)

| Add-On | India | UAE | Canada |
|--------|-------|-----|--------|
| +500 AI messages | ₹499 | AED 25 | CAD 9 |
| +10 properties | ₹299 | AED 15 | CAD 5 |
| +1 team member | ₹599 | AED 30 | CAD 11 |
| Extra storage 10GB | ₹199 | AED 10 | CAD 4 |

---

## Tax Rules

### India GST
- SaaS subscription: 18% GST
- Invoice must show: HSN 9983, GSTIN of seller
- For B2B clients: collect their GSTIN, apply reverse charge for inter-state if applicable
- E-invoice required if turnover > ₹5Cr

### UAE VAT
- VAT 5% on SaaS
- VAT registration required if revenue > AED 375,000/year
- Invoice must show: TRN number, VAT amount

### Canada Tax
- GST 5% federal on all SaaS (supply of software = taxable supply)
- HST applies in: Ontario 15%, Nova Scotia 15%, New Brunswick 15%, PEI 15%, NL 15%
- PST applies in: BC, Saskatchewan, Manitoba (separate from GST)
- QST in Quebec (9.975%) in addition to GST
- Digital services tax: must register if revenue > CAD 30,000/quarter from Canadian customers
- CASL compliance: must have express consent before sending commercial messages

---

## Legal & Compliance

### India
- DPDP Act 2023: collect consent before processing personal data, allow deletion
- IT Act 2000 Section 43A: reasonable security practices
- No cold calling without DNC check
- WhatsApp Business Policy compliance required

### UAE
- Personal Data Protection Law (Federal Decree No. 45 of 2021)
- RERA compliance for property listings (if listing real properties)
- No discriminatory property listings
- Must store data of UAE residents in UAE or approved countries (data localisation emerging)

### Canada
- PIPEDA: must have privacy policy, consent to collect, right to access/correct/delete
- CASL: WhatsApp messages require express consent (implied consent allowed for existing business relationships for 2 years)
- FINTRAC: if handling payments > CAD 10,000 cash, need to report
- Quebec Law 25: stricter than PIPEDA, need DPA officer if handling sensitive data at scale

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI hallucination | Medium | High | Hallucination control system, confidence thresholds |
| WhatsApp ban | Low | Critical | Meta policy compliance, human review triggers |
| Data breach | Low | Critical | RLS, encryption, audit logs |
| Client churn after trial | High | Medium | Strong onboarding, 14-day follow-up sequence |
| Payment failure | Medium | Medium | Retry logic, grace period 7 days |
| Multi-tenant data leak | Low | Critical | workspace_id on every query, RLS policies |
| AI cost explosion | Medium | High | Per-workspace hard caps, usage alerts at 70/85/95% |
| Spam complaints (CASL) | Low | High | Express consent flow, unsubscribe in every message |
| RERA violation UAE | Low | Medium | Disclaimer on all listings: "Verify with RERA" |
| GST non-compliance India | Low | High | Auto-invoice generation, GSTIN validation |

---

## Build Phases

### Phase 1 — MVP (8 weeks)
- WhatsApp webhook + AI agent (Arjun)
- Property CRUD
- Conversation management
- Basic booking
- Callback tracker
- Simple dashboard: chats, calendar, properties
- Login / auth
- India only
- Vercel + Render + Supabase

### Phase 2 — CRM + Team (4 weeks)
- Full CRM kanban
- Team roles and permissions
- Analytics page
- Callbacks page
- Settings: all tabs
- Onboarding flow
- Email notifications

### Phase 3 — Gulf Expansion (4 weeks)
- Arabic language support
- AED currency
- UAE VAT on invoices
- RERA disclaimer
- Stripe payment gateway

### Phase 4 — Canada Expansion (4 weeks)
- French language support
- CAD currency
- GST/HST/PST calculation
- CASL consent flow
- PIPEDA privacy controls

### Phase 5 — Enterprise (6 weeks)
- Multi-branch support
- Franchise management
- White-label
- API access
- Super admin full panel
- AI governance panel

---

## TODO List (Prioritised)

### P0 — Must Have Before Launch
- [ ] WhatsApp webhook receiver
- [ ] AI conversation engine with Arjun prompt v2
- [ ] Property CRUD with photos
- [ ] Area-based property search
- [ ] Budget escalation (low/high)
- [ ] Slot booking system
- [ ] Pre-visit reminder cron
- [ ] Callback system
- [ ] Multi-tenant data isolation (workspace_id on all tables)
- [ ] Login / JWT auth
- [ ] Hallucination control (confidence thresholds)
- [ ] India GST on invoices
- [ ] Language detection (Devanagari → Hinglish)
- [ ] Voice note fallback
- [ ] 2 follow-up hard cap
- [ ] No-message-after-9pm rule
- [ ] Super admin client creation
- [ ] AI usage hard cap enforcement

### P1 — Launch + 30 Days
- [ ] Full CRM kanban
- [ ] Lead scoring engine
- [ ] Team roles and permissions
- [ ] Analytics dashboard
- [ ] Onboarding checklist
- [ ] Email: welcome, booking confirm, reminder
- [ ] Mobile responsive (all pages)
- [ ] Supabase realtime WebSocket for chat

### P2 — Month 2
- [ ] UAE (AED, Arabic, VAT)
- [ ] Stripe integration
- [ ] RERA disclaimer
- [ ] Custom AI name per workspace
- [ ] AI audit logs
- [ ] Prompt version management (super admin)
- [ ] Backup system
- [ ] UptimeRobot keep-alive

### P3 — Month 3
- [ ] Canada (CAD, French, CASL consent)
- [ ] Multi-branch
- [ ] API access (Agency plan)
- [ ] Webhook outgoing (Zapier/n8n)
- [ ] White-label (Agency plan)
- [ ] Instagram DM integration (Pro+)
