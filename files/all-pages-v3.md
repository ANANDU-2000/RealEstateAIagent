# PropAgent V3 — All Pages Complete Spec
## Every Page, Subpage, Tab, Button, Icon, Micro-interaction

---

## Design System

### Colors
```
Primary Blue:    #2563EB
Blue Dark:       #1D4ED8
Blue Light:      #EFF6FF (backgrounds)
Blue 100:        #DBEAFE (selected states)
Success Green:   #16A34A
Green Light:     #F0FDF4
Warning Amber:   #F59E0B
Amber Light:     #FFFBEB
Danger Red:      #DC2626
Red Light:       #FEF2F2
Orange:          #EA580C (Ultra Hot)
Orange Light:    #FFF7ED
Purple:          #7C3AED
Purple Light:    #F5F3FF
Text Primary:    #0F172A
Text Secondary:  #374151
Text Muted:      #6B7280
Text Disabled:   #9CA3AF
Border:          #E2E8F0
Border Dark:     #CBD5E1
Background:      #F8FAFC
Surface:         #FFFFFF
Surface 2:       #F8FAFC
Surface 3:       #F1F5F9
```

### Typography
```
Font: Inter (Google Fonts)
Mono: JetBrains Mono (IDs, numbers, code)

Scale:
Display:  32px / 700 / -1px  → Page titles on marketing
H1:       24px / 700 / -0.5px → Page headers in dashboard
H2:       18px / 600 / -0.3px → Section headers
H3:       16px / 600 / 0      → Card titles
H4:       14px / 600 / 0      → Sub-section labels
Body:     14px / 400 / 0      → Dashboard body
Small:    13px / 400 / 0      → Secondary text
XSmall:   12px / 400 / 0      → Labels, captions
Tiny:     11px / 400 / 0      → Timestamps, badges
Mono:     13px / 500 / -0.3px → IDs, prices, numbers
```

### Spacing (8px base)
```
2px   — hairline (borders, dividers only)
4px   — xs
8px   — sm
12px  — md
16px  — lg (standard card padding)
20px  — xl
24px  — 2xl (page padding)
32px  — 3xl (section gaps)
48px  — 4xl
64px  — hero
```

### Border Radius
```
4px   → tiny chips
6px   → small buttons, inputs
8px   → standard buttons, inputs
10px  → cards
12px  → large cards, modals
16px  → panels, sheets
20px  → onboarding cards
99px  → pills, avatars, toggles
```

### Shadows
```
sm:  0 1px 2px rgba(0,0,0,0.04)
md:  0 4px 8px rgba(0,0,0,0.06)
lg:  0 8px 24px rgba(0,0,0,0.08)
xl:  0 16px 40px rgba(0,0,0,0.10)
focus: 0 0 0 3px rgba(37,99,235,0.15)
```

---

## ICON SET: Lucide Icons (Free, MIT)

All icons use Lucide. Sizes:
- Nav icons: 18px
- Card icons: 16px
- Inline text icons: 14px
- Small labels: 12px

Key icons used:
```
MessageSquare  → Chats
Calendar       → Calendar
Home           → Properties
Users          → Leads
Phone          → Callbacks
BarChart2      → Analytics
Settings       → Settings
Bell           → Notifications
Zap            → Ultra Hot
TrendingUp     → Hot lead
User           → Agent/Owner
Building       → Office
MapPin         → Location
Clock          → Time/slot
CheckCircle    → Confirmed
XCircle        → Cancelled
AlertTriangle  → Warning
Search         → Search
Plus           → Add new
Pencil         → Edit
Trash2         → Delete
Eye            → View/Preview
Copy           → Copy
RefreshCw      → Refresh
Download       → Export
Upload         → Import
ChevronRight   → Arrow/expand
ChevronDown    → Dropdown
Filter         → Filter
SortAsc        → Sort
Grid           → Grid view
List           → List view
Globe          → Language/market
Shield         → Security
Key            → API key
Server         → Infrastructure
FileText       → Document
Image          → Photo
Video          → Video
Layers         → Property types
CreditCard     → Billing
LogOut         → Logout
Menu           → Mobile menu
X              → Close
Check          → Done
Minus          → Remove
Bot            → AI
Mic            → Voice
Send           → Send message
```

---

## GLOBAL MICRO-INTERACTIONS

All buttons:
- Hover: background lightens or darkens 5%, cursor pointer, transform scale(1.01)
- Active/Press: scale(0.98), shadow reduces
- Disabled: opacity 0.4, cursor not-allowed, no hover effect
- Loading: spinner replaces text, button disabled

All inputs:
- Default: border #E2E8F0
- Focus: border #2563EB, ring 0 0 0 3px rgba(37,99,235,0.15)
- Error: border #DC2626, ring 0 0 0 3px rgba(220,38,38,0.15)
- Success: border #16A34A

All cards:
- Hover: shadow-md, border-color #CBD5E1, translateY(-1px)
- Active: border-color #2563EB

Badges:
- All caps, letter-spacing 0.3px, 10-11px font, pill shape

Toasts:
- Slide in from bottom-right
- Auto-dismiss 4 seconds
- Green for success, red for error, amber for warning
- Manual dismiss X button

Modals:
- Backdrop: rgba(0,0,0,0.4), blur 2px
- Sheet slides from bottom on mobile
- Appears from center with scale(0.96 → 1) + opacity on desktop
- Close on backdrop click (except destructive actions)

---

## PAGE 1: LOGIN `/login`

### Desktop Layout
Full-page split: left 40% brand panel, right 60% form

Left panel:
- Dark background (#0F172A)
- PropAgent logo large
- Tagline: "Never miss a lead. Never lose a deal."
- 3 bullet social proof points (clients, cities, AI responses)

Right panel:
- White, centered form card (max-width 400px)
- "Sign in to PropAgent"

Form fields:
- Email: label "Email", type email, placeholder "you@example.com"
- Password: label "Password", type password, placeholder "••••••••", show/hide toggle (Eye icon)
- "Remember me" checkbox
- "Forgot password?" link → /forgot-password

Buttons:
- Primary: "Sign In →" (full width, #2563EB)
- Divider "or"
- Google OAuth: "Continue with Google" (full width, white with Google icon)

Bottom:
- "Don't have an account? Start free trial" (link to /signup)

Micro-interactions:
- Form shakes on wrong credentials
- Button shows spinner during auth
- Password field shows/hides with Eye icon toggle

### Mobile Layout
Gradient background (#2563EB → #7C3AED)
Centered card (border-radius 20px, padding 28px)
Logo + form only (no split panel)

---

## PAGE 2: SIGNUP `/signup`

Steps (3-step wizard, progress indicator top):

Step 1 — Account
- Business Name *
- Owner Name *
- Email *
- Password * (strength meter: weak/medium/strong)
- Phone (for WhatsApp)
- Country: India / UAE / Canada
- "Continue →"

Step 2 — Plan
- Plan cards (Starter / Pro / Agency) with price toggle (Monthly/Annual)
- Selected plan highlighted with blue border
- "Start Free 14-Day Trial →" (no credit card required for India)
- "Enter promo code" link (collapsible)

Step 3 — Confirm
- Summary: name, email, plan, market
- Terms checkbox (required): "I agree to Terms of Service and Privacy Policy"
- CASL consent (Canada only): "I consent to receive commercial messages via WhatsApp"
- "Create My Account →"

Redirect: → /onboarding

---

## PAGE 3: ONBOARDING `/onboarding`

### Layout
Centered card, white, 500px wide
Progress bar top (steps 1–4)

### Content
"Welcome, [Name]! 🎉"
"Arjun is ready to go. Just 4 quick steps."

Checklist (each tappable):
1. ✓ Account created (auto-done)
2. Connect WhatsApp number (→ opens WhatsApp setup drawer)
3. Add your first property (→ /properties/new)
4. Set your availability (→ /settings/availability)
5. Add office address (→ /settings/office)

Bottom:
"Skip for now — go to dashboard →"
"Test Arjun: text your WhatsApp number 'Hi' and watch the magic."

---

## PAGE 4: DASHBOARD `/chats` (Live Chats)

### Desktop Layout (3-panel)
Left panel (300px fixed): Conversation list
Centre (flex): Chat window
Right panel (280px fixed): Customer profile

### Left Panel

Header:
- "Live Chats" H2
- Unread count badge
- [Search icon] [+ Manual chat icon]

Search bar:
- Input: "Search conversations..."
- Clears on X icon

Tabs (horizontal scroll):
- All (count)
- AI Active (count)
- You (human override count)
- 🔥 Hot (count)
- ⚡ Ultra Hot (count)
- Callbacks (count, orange badge)
- Booked (count)
- Cold (count)

Each conversation card:
- Avatar (initials, colour by lead score)
- Name (or phone number if unknown)
- Last message preview (1 line, ellipsis)
- Timestamp (relative: "2m", "1h", "2d")
- Status badge (AI / You / Booked / Cold / Ultra Hot / Low Budget)
- Unread dot (blue, top right)
- Swipe left (mobile): Archive, Book, Take Over

Sorted by: last message timestamp (newest first by default)

### Centre Panel — Chat Window

Top bar:
- Back arrow (mobile only)
- Customer name + status badge
- Phone number
- [📞 Call] [📋 Profile] buttons
- Ultra Hot banner (orange, full width) if ULTRA_HOT

Chat area:
- Customer bubbles: left, white, border, avatar
- AI bubbles: right, #2563EB, white text + [AI] tag
- Broker bubbles: right, #0F172A
- System events: centred, grey pill ("Visit booked", "AI paused")
- Timestamps below each bubble
- Date separators: "Today", "Yesterday", "Jun 3"
- Audio icon for voice notes + fallback text shown
- Photos inline (tap to expand)

Input area:
AI active state:
- Blue banner: "Arjun is handling this chat"
- [Take Over] button (primary)

Human override state:
- Input box active, placeholder "Type a message..."
- [Send] button (blue)
- [📎 Attach] icon
- [Hand Back to AI] ghost button

Locked state (Ultra Hot / escalated):
- Orange banner: "AI paused — owner notified"
- Input disabled

### Right Panel — Customer Profile

Section: Identity
- Avatar (large, 48px)
- Name
- Phone (tap to call)
- Lead score badge + progress bar
- Tag pills: [NRI] [Investor] [Land] [Hinglish] [Returning] etc.

Section: Details (auto-extracted)
- Budget
- Area interest
- Property type
- Language
- First contact date
- Total messages
- Last active

Section: Actions
- [📞 Call Now]
- [📅 Schedule Callback]
- [📝 Add Note]
- [🗑 Archive]
- [⚡ Mark Ultra Hot] (manual override)

Section: Notes
- Textarea for broker private notes
- Saves on blur

Section: Escalations
- List of all escalation events with timestamp and type

---

## PAGE 5: CALENDAR `/calendar`

### Desktop Layout (main + sidebar)

Main area: Week view (default), Day view, Month view (toggle)

Controls bar:
- [← Prev] [Today] [Next →]
- Month + Year label
- [Week] [Day] [Month] toggle buttons
- [+ Add Slot] button

Event colour coding:
- Green fill: AI-booked site visit
- Blue fill: Manual / office visit
- Orange fill: Callback reminder
- Red fill: Cancelled
- Purple fill: Rescheduled

Calendar grid:
- Time column left
- 7-day week columns
- Events placed at correct time with title + customer name
- Click event → right drawer opens

Right sidebar (280px):
- "Upcoming Today" list
- Each event card:
  - Time + type
  - Customer name (bold)
  - Phone
  - Property name (if site visit)
  - [Call] [Remind] [Cancel] buttons
- "Available Slots" section
  - Green pills for free slots
  - Grey pills for blocked days

Drawer (event click):
- Full event detail
- Customer conversation link
- Property details
- [Cancel Visit] [Reschedule] [Mark No-Show] [Send Reminder]
- Pre-visit reminder status

### Mobile Layout
Day view default
Event list below mini-month calendar
Tap event → bottom sheet

---

## PAGE 6: PROPERTIES `/properties`

### Desktop Layout (list + form)

Left side (320px):
- Tabs: All / Available / Sold / Land / Residential / Commercial / Hidden
- Filter bar: [Search] [Price range] [Type] [City]
- Sort: Price ↑ / Price ↓ / Newest / Most enquired

Each property card:
- Thumbnail (60x50, placeholder icon if no photo)
- Name (bold, ellipsis)
- Location (📍 icon)
- Price (coloured, bold)
- Status chip
- Enquiry count (small, muted)
- [Edit] [Hide] [Mark Sold] icons on hover

Right side (form):
- Edit form loads on card click
- Form tabs: Details / Photos / Videos / Documents / AI Tags

Details tab form fields:
- Property Name *
- Property Type * (dropdown: all 12 types)
- Listing Type: For Sale / For Rent
- Area Size (number) + Unit (sqft/sqyards/acres/kanal/bigha/marla)
- Price * + Currency (INR/AED/CAD)
- City *
- Locality / Area / Sector * (searchable, used for AI)
- Description (max 500 chars, counter shown)
- Status: Available / Sold / Hidden
- Land Type (visible only for land types): Residential / Agricultural / Commercial / Industrial
- AI Tag Note: "AI uses these details + area to match with customers"

Photos tab:
- Drop zone: "Drop photos or click to upload"
- Limit indicator: "5/15 uploaded (Pro plan)"
- Photo grid (3 columns)
- Drag to reorder
- Star icon = set as cover photo
- X to delete
- Max file size: 5MB each, auto-compressed to 500KB

Videos tab (Pro+):
- YouTube/Vimeo link input OR direct upload
- Max 2 videos
- Preview thumbnail

Documents tab (Pro+):
- Upload: brochure, floor plan, legal doc
- Doc type label
- "Visible to customers" toggle per doc

AI Tags tab:
- Auto-generated keywords (editable)
- "Add tag" input
- Examples shown: "near airport", "metro access", "school zone"

Form buttons:
- [Preview as AI sees it] → modal showing how AI presents this property to customers
- [Save Changes] (green, primary)
- [Discard] (ghost)
- [Delete Property] (red, with confirm modal)

### Mobile Layout
2-column card grid
Tap card → full screen form
Camera icon prominent for quick photo add

---

## PAGE 7: LEADS (CRM) `/leads`

### Desktop Layout

Controls:
- [☰ List View] [⊞ Kanban View] toggle
- [🔍 Filter] dropdown: Date / Score / Status / Language / Escalation type
- [📥 Export CSV]
- Search by name/phone

### Kanban View (default)

Columns (scrollable horizontal):
1. New (count)
2. Qualified (count)
3. Interested (count)
4. Hot (count)
5. Ultra Hot (orange header, count)
6. Meeting Booked (count)
7. Visited (count)
8. Low Budget (amber header, count)
9. Cold (grey, count)
10. Won (green, count)
11. Lost (red, count)

Each lead card (KanbanCard):
- Name (bold)
- Budget (coloured by score)
- Area interest (blue, small)
- Status badges
- Time since last contact
- Quick actions on hover: [Call] [WhatsApp] [Move stage] [Note]
- Drag to move between columns
- Ultra Hot card: left border orange, star icon
- Low Budget card: left border amber

Clicking card:
- Right drawer slides in (LeadDetail)

LeadDetail drawer:
Tabs: Overview / Timeline / Notes / Meetings / Escalations

Overview tab:
- All profile info
- Lead score with breakdown (budget match, response speed, visit interest, investor signals)
- Property interests list

Timeline tab:
- Chronological activity log
- Entries: message sent, message received, AI reply, booking made, owner notified, stage changed, note added
- Each with timestamp + icon

Notes tab:
- Broker notes (timestamped)
- Add note textarea + [Save]

Meetings tab:
- All meetings for this lead
- Status (confirmed/no-show/completed)
- [Reschedule] [Cancel] per meeting

Escalations tab:
- All escalation events with type, time, resolution status

### List View
Table with columns:
Name | Phone | Budget | Area | Stage | Score | Last Active | Actions

Sortable, paginated (25/page)

---

## PAGE 8: CALLBACKS `/callbacks`

### Desktop Layout

Controls bar:
- Tabs: All / Pending / ⚠️ Overdue / Done
- Overdue tab shows red badge

Alert banner (if overdue):
"⚠️ You have [N] overdue callbacks. These customers are waiting."

Table columns:
- Customer (name + phone)
- Requested Time
- Context (what AI noted from conversation)
- Status (Pending / Overdue / Done)
- Created (relative time)
- Actions: [📞 Call Now] [Reschedule] [✓ Mark Done] [Open Chat]

Row styles:
- Overdue rows: subtle red left border
- Done rows: opacity 0.6

### Mobile
Card list view
Each card: name, phone (tap to call), context, status
Action buttons below: Call / Reschedule / Done

---

## PAGE 9: ANALYTICS `/analytics`

### Controls
Date range picker: Last 7 days / 30 days / 90 days / Custom
[Export CSV] button

### Stats Row 1 (4 cards)
- Total Leads: number + % change vs prior period
- Visits Booked: number + % change
- ⚡ Ultra Hot Leads: number + orange colour
- AI Messages Used: used/total + days remaining

### Stats Row 2 (4 cards)
- Callbacks Done vs Pending
- Cold Leads (2 follow-ups, no response)
- Low Budget Escalations
- Conversion Rate (leads → visit booked)

### Charts (2 column)
Left: Leads per day (bar chart, 30 days, hoverable tooltips)
Right: Lead source breakdown (donut: WhatsApp AI / Manual / Referral)

### Charts Row 2
Left: Leads by property type (bar: Apartment / Villa / Land / Commercial)
Right: Language breakdown (Hinglish / English / Hindi→Hinglish / Arabic)

### Property Performance Table
Columns: Property Name | Enquiries | Visits | Conversion % | Revenue potential
Sortable

### AI Usage Section
- Messages used this month (progress bar)
- Cost estimate this month
- Daily usage line chart
- Model used (Claude Sonnet)

---

## PAGE 10: TEAM `/team`

### Layout
- Member table + invite form

### Table
Name | Email | Phone | Role | Status | Last Active | Actions

Roles: Owner / Manager / Agent / Viewer / Auditor

### Role Permissions Matrix

| Permission | Owner | Manager | Agent | Viewer | Auditor |
|-----------|-------|---------|-------|--------|---------|
| View all chats | ✓ | ✓ | Own | ✓ | ✓ |
| Take over chat | ✓ | ✓ | Own | ✗ | ✗ |
| Add properties | ✓ | ✓ | ✓ | ✗ | ✗ |
| Delete properties | ✓ | ✓ | ✗ | ✗ | ✗ |
| View analytics | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage billing | ✓ | ✗ | ✗ | ✗ | ✗ |
| Invite team | ✓ | ✓ | ✗ | ✗ | ✗ |
| Change settings | ✓ | ✓ | ✗ | ✗ | ✗ |
| View audit logs | ✓ | ✗ | ✗ | ✗ | ✓ |

### Invite Form
Email + Role dropdown + [Send Invite] button
Pending invites shown below with [Resend] [Cancel]

---

## PAGE 11: SETTINGS

### Sidebar navigation
- 👤 Profile
- 📱 WhatsApp
- 📍 Office & Visits
- 🤖 AI Agent
- 🕒 Availability
- 🔔 Notifications
- 💳 Billing

### Settings: Profile
- Business Name
- Owner Name
- Email (readonly, link to change)
- Phone
- Country
- City
- Timezone (auto-detected, editable)
- Language
- Logo upload (for white-label)
- [Save Changes]

### Settings: WhatsApp
Connection status (connected/disconnected)
Connected number + last message time
[Disconnect] button (red, confirm required)
[Reconnect] link
How to connect: step-by-step instruction
Meta Business Account ID field
Phone Number ID field
WhatsApp API Token (masked, [Show] toggle)

### Settings: Office & Visits
Office Address textarea (required for office visits)
City
Google Maps link (optional)
Warning if empty: "Add your office address so customers can visit you."

Pre-Visit Reminder:
Toggle: Remind me before customer visits
Reminder time: 30min / 1hr / 2hr / 1day
Via: Push + WhatsApp / Push only / WhatsApp only

Auto-customer reminder:
Toggle: Send customer a WhatsApp reminder
Time: 1hr / 2hr / 1day before

### Settings: AI Agent
AI Name (default: Arjun, customisable on Pro+)
Tone: Friendly-casual (default) / Professional / Mix
Language preference: English first / Hinglish first
Follow-up count: 1 / 2 (max 2, hard limit shown)
Follow-up gap: 3hr / 6hr / next morning
No messages after: 8 PM / 9 PM / 10 PM (default 9 PM)

Toggle: Allow Arjun to answer property-specific questions
Toggle: Show property photos automatically
Toggle: Ask call-first or direct visit (required, always on)

[Preview Arjun's prompt →] (read-only for broker, editable in Super Admin)

### Settings: Availability
Calendar grid (Mon–Sun × time slots)
Toggle per day: Available / Blocked
Time slots by day (add, remove)
Buffer between meetings: 0 / 15 / 30 / 45 / 60 min
Recurring days off

### Settings: Notifications
Toggle each:
- New message from customer → Push + WhatsApp
- Ultra Hot lead → Push + WhatsApp (always on, can't disable)
- New meeting booked → Push
- Callback requested → Push
- Overdue callback → Push (repeating)
- AI usage at 70% → Email
- AI usage at 95% → Email + Push
- Payment due → Email
- Payment failed → Email + Push

### Settings: Billing
Current plan name + price
Renewal date
[Upgrade Plan] button
[Add-Ons] section: AI credits, properties, storage
Invoice table: Date / Amount / Status / [Download PDF]
[Change Payment Method]
[Cancel Subscription] (red, with confirm + feedback form)

GST/VAT fields (if applicable):
India: GSTIN field
UAE: TRN field
Canada: Business Number field

---

## PAGE 12: SUPER ADMIN — All Pages

### SA Login (separate URL: /superadmin)
Email + Password only
No OAuth
MFA required (TOTP)

### SA Layout
Dark header (#0F172A)
Tab nav (not sidebar)
Tabs: Dashboard / Clients / Workspaces / Billing / AI Governance / Security / Infrastructure / Compliance / Cost Center / Announcements

### SA Dashboard
Same as broker analytics but global:
- Total clients
- MRR, ARR
- AI messages today + cost
- New signups this week
- Failed payments
- Clients near limit
- Churned this month
- Top-spending clients

### SA Clients
Table: Client ID / Business / Plan / Country / AI Usage / Status / Payment / Joined / Actions

[+ Create Client] button → form:
- Business Name
- Owner Name
- Email
- Phone
- Country
- Plan
- Trial days
→ System generates:
  - Unique Client ID (PA-IN-0042)
  - Workspace
  - Login credentials
  - Welcome email

Client detail view:
- All profile
- Properties list (read-only)
- All conversations (read-only)
- AI usage graph
- Payment history
- Error logs
- Audit log

Per-client controls:
- Change plan
- Set custom limits (override plan)
- Apply discount
- Extend trial
- Mark paid manually
- Suspend (AI paused, can login)
- Block (cannot login)
- Delete (with 30-day data retention)

### SA Billing
Revenue by month (chart)
MRR / ARR cards
Failed payments list
Overdue accounts list
Manual invoice creation
GST/VAT report by market

### SA AI Governance
- Active model (Claude Sonnet / GPT / Gemini)
- Model switch with rollout % control
- Prompt version history
- [Edit Prompt] → versioned editor
- Rollback to previous version
- Hallucination log (questions AI couldn't answer → escalated)
- Confidence distribution chart
- Cost per conversation

### SA Prompts
Version list: v1 / v2 / v3 / current
Each version:
- Created date
- Created by
- Character count
- Status: Active / Archived
- [View] [Edit] [Set as Active] [Rollback]
- Diff view between versions

Edit page:
- Full prompt textarea
- Variable reference sidebar
- [Preview with test workspace]
- [Save as Draft] [Publish]

### SA API Keys
Keys table: Service / Key (masked) / Status / Last Used / [Rotate] [Revoke]
Services: Anthropic / OpenAI / Gemini / Twilio / Meta / Cloudflare R2 / Resend / Razorpay / Stripe

[+ Add Key] form
[Rotate All Keys] (emergency button, requires confirmation)

### SA Cost Center
Per-client cost breakdown:
- AI messages: tokens × rate
- WhatsApp messages: count × rate
- Storage: GB × rate
- Total cost
- Revenue (plan price)
- Margin (%)

Charts: cost per client, most expensive clients, cost trend

### SA Feature Flags
Table: Feature / Default / Override per plan / [Edit]
Toggle per feature for each plan level
Emergency kill switch: disable AI globally (red button, requires MFA confirm)

---

## MARKETING PAGES

### Home `/`

Sections:
1. Nav: Logo | Features | Pricing | Blog | [Login] [Start Free Trial (CTA)]
2. Hero: H1 "Your WhatsApp AI Agent for Real Estate" | Subtext | [Start Free Trial] [Watch Demo]
3. Social proof strip: "Trusted by [N] brokers in India, UAE, Canada"
4. Feature highlights (3 cards): AI Agent / CRM / Analytics
5. How it works (3 steps): Connect WhatsApp → Add Properties → Watch Arjun work
6. Testimonials (3 cards)
7. Pricing preview (3 plans, link to /pricing)
8. Final CTA: "Start your 14-day free trial"
9. Footer: Links / Social / Privacy / Terms / Contact

### Features `/features`
Deep dive on each feature with screenshot/demo GIFs

### Pricing `/pricing`
Market toggle: India / UAE / Canada (changes currency)
Plans (3 columns)
Annual toggle (save 20%)
Feature comparison table
FAQ section
CTA at bottom

### Contact `/contact`
Name / Email / Company / Country / Message
[Send Message]
WhatsApp link: "Chat with us directly on WhatsApp"
Calendar link: "Book a 15-min demo"

### City SEO Pages `/[city]`
e.g. /mumbai /delhi /dubai /toronto
Each: "PropAgent for [City] Real Estate Agents"
Local testimonials, local pricing, local FAQ

---

## MOBILE APP (PWA, same Next.js)

Bottom nav (5 tabs):
💬 Chats (badge)
📅 Calendar
🏠 Properties
👥 Leads
⚙️ Settings

All pages same as desktop but:
- Single column
- Drawers slide from bottom (sheet pattern)
- Chat = full screen (no split panels)
- Properties = card grid
- Leads = card list (no kanban on mobile, too complex)
- Forms = full screen
- All tap targets: minimum 44×44px
- No hover states (tap states instead)
