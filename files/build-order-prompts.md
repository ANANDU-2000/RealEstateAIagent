# PropAgent V3 — Build Order + Cursor Prompts
## Which Page First. Exact Order. No Guessing.

---

## WHY THIS ORDER

Rule: Build what blocks everything else first. Work outside-in.

Priority logic:
1. Auth blocks every dashboard page → build first
2. Database schema blocks every feature → set up before any page
3. WhatsApp webhook blocks the core product → build before UI
4. Properties blocks AI (AI needs property data) → build before AI
5. Chats is the most complex UI → build after simpler pages work

---

## PHASE 0 — FOUNDATION (Before Any Page)
### Do This First, Nothing Else

---

### Step 0.1 — Supabase Setup (30 minutes)

1. Create Supabase project at supabase.com
2. Region: ap-south-1 (Mumbai)
3. Go to SQL Editor
4. Run the full schema from `infrastructure/deployment-env-schema.md`
5. Enable Realtime on: conversations, messages, meetings, callbacks
6. Create storage buckets: property-photos (public), property-docs (private)
7. Copy your Project URL and anon key and service_role key

Done when: you can run `SELECT * FROM tenants;` and get empty table with no error.

---

### Step 0.2 — Backend Skeleton (1 hour)

```bash
mkdir backend && cd backend
npm init -y
npm install express typescript ts-node @types/express @types/node
npm install @anthropic-ai/sdk @supabase/supabase-js dotenv cors helmet
npm install node-cron
npm install -D nodemon @types/node-cron
npx tsc --init
```

Create `src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.listen(process.env.PORT || 3001, () => {
  console.log('PropAgent API running');
});
```

Done when: `curl localhost:3001/health` returns `{"ok":true}`.

---

### Step 0.3 — Frontend Skeleton (30 minutes)

```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install @supabase/supabase-js lucide-react
```

Done when: `npm run dev` → localhost:3000 shows Next.js welcome.

---

## PHASE 1 — BUILD ORDER (Follow Exactly)

---

### PAGE 1: LOGIN `/login` + `/signup`
**Build first. Nothing works without auth.**

Cursor prompt for `app/(auth)/login/page.tsx`:
```
Build the PropAgent login page.

Stack: Next.js 14 app router, TypeScript, Tailwind CSS.
Auth: Supabase Auth (email + password).

Design:
- Desktop: two-column split. Left 40% = dark panel (#0F172A) with logo "PropAgent" in white, tagline "Never miss a lead. Never lose a deal." Right 60% = white, centered card max-width 400px.
- Mobile: full width, gradient background #2563EB to #7C3AED, white card centered.
- Font: Inter. Primary colour: #2563EB.

Form fields:
1. Email (type=email, placeholder="you@example.com")
2. Password (type=password, placeholder="••••••••", Eye icon toggle show/hide)
3. "Remember me" checkbox (left) + "Forgot password?" link (right)
4. [Sign In →] button (full width, #2563EB, border-radius 8px)
5. Divider "or"
6. [Continue with Google] button (white, border, Google icon SVG)
7. Bottom: "Don't have an account? Start free trial" link to /signup

Behaviour:
- On submit: supabase.auth.signInWithPassword({ email, password })
- On success: router.push('/chats')
- On error: shake animation on form, show error message below password
- Loading state: spinner inside Sign In button, button disabled
- Google OAuth: supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/chats' } })

Use Lucide icons for Eye, EyeOff.
No external component libraries. Pure Tailwind only.
```

Cursor prompt for `app/(auth)/signup/page.tsx`:
```
Build the PropAgent signup page. 3-step wizard.

Stack: Next.js 14, TypeScript, Tailwind CSS, Supabase Auth.

Step indicator: 3 dots at top (filled for current, outlined for future).

Step 1 — Account:
Fields: Business Name *, Owner Name *, Email *, Password * (with strength meter: weak/medium/strong shown as coloured bar), Phone, Country dropdown (India / UAE / Canada)
[Continue →] button validates all required fields before advancing.

Step 2 — Plan:
3 plan cards side by side: Starter / Pro / Agency
Each card: plan name, price in correct currency based on Step 1 country, 3 key features
Clicking card selects it (blue border)
Default selected: Starter
Monthly/Annual toggle (annual shows "Save 20%")
[Continue →]

Step 3 — Confirm:
Summary of name, email, plan
Terms checkbox: "I agree to Terms of Service and Privacy Policy" (required)
If country=Canada: additional checkbox "I consent to receive WhatsApp messages from PropAgent" (CASL, required)
[Create My Account →]

On Step 3 submit:
1. supabase.auth.signUp({ email, password, options: { data: { business_name, owner_name, phone, country, plan } } })
2. Call POST /api/auth/setup-workspace with the data
3. On success: router.push('/onboarding')

Error handling: inline field errors, form does not advance if validation fails.
No external libraries. Pure Tailwind.
```

---

### PAGE 2: ONBOARDING `/onboarding`
**Build second. New users land here after signup.**

Cursor prompt for `app/onboarding/page.tsx`:
```
Build the PropAgent onboarding checklist page.

Stack: Next.js 14, TypeScript, Tailwind CSS.

Layout: Centered card, white, max-width 500px, border-radius 20px, padding 40px, shadow-xl. Background: gradient #EFF6FF to #F5F3FF.

Content:
- Logo "PropAgent" in #2563EB, 24px bold
- H1: "Welcome, [owner_name]! 🎉" (fetch from Supabase user metadata)
- Subtext: "Arjun is ready. Just 4 quick steps to go live."
- Progress bar: filled portion = (completed steps / 4) × 100%
- Progress text: "2 of 4 steps done" below bar

Checklist items (4):
1. Connect WhatsApp Number → status from broker_settings.whatsapp_connected
2. Add First Property → status: count of properties > 0
3. Set Availability → status: count of availability_slots > 0
4. Add Office Address → status: broker_settings.office_address is not null

Each item is a row:
- Left: circle icon (filled green checkmark if done, number if pending)
- Centre: bold title + small subtitle explaining why it matters
- Right: [Set Up →] button (primary if next uncompleted, ghost if future)

Clicking [Set Up →]:
- Item 1: opens bottom drawer with WhatsApp embedded signup flow
- Item 2: router.push('/properties/new')
- Item 3: router.push('/settings/availability')
- Item 4: router.push('/settings/office')

Bottom:
- Info box (blue): "Test Arjun now: text your WhatsApp number 'Hi' and watch Arjun respond."
- [Go to Dashboard →] link (skips remaining steps)

Fetch workspace data on load. Auto-check which steps are complete.
```

---

### PAGE 3: PROPERTIES `/properties`
**Build third. AI needs this data before we can build chats.**

Cursor prompt for `app/(dashboard)/properties/page.tsx`:
```
Build the PropAgent properties list page.

Stack: Next.js 14, TypeScript, Tailwind CSS, Supabase client.
Data: fetch from properties table WHERE tenant_id = workspace_id AND is_hidden = false.
Real-time: subscribe to properties table changes via Supabase Realtime.

Desktop layout: two-column. Left 320px fixed = property list. Right = edit form (or empty state if nothing selected).

Left panel:
- Tabs: All / Available / Sold / Land / Residential / Commercial / Hidden
  Each tab filters the list. Tab shows count in small grey pill.
- Search bar: filters by name or location (client-side filter, instant)
- Sort dropdown: Newest / Price High-Low / Price Low-High / Most Enquiries
- Each property card:
  - Thumbnail (60×50px, cover photo URL or placeholder icon based on property_type)
  - Name (bold, truncate with ellipsis at 140px)
  - Location (MapPin icon 12px + text)
  - Price (bold, #2563EB, formatted: ₹68 Lakh / AED 250K / CAD 499K)
  - Status chip (green Available / red Sold / grey Hidden)
  - Enquiry count (small, muted)
  - On hover: [Edit] [Hide] icons appear right-aligned
- [+ Add Property] button top right (primary, navigates to /properties/new)

Right panel (shows when card selected):
- Edit form loads immediately on card click (no page navigation)
- Tabs: Details / Photos / Documents / AI Tags

Details tab:
Fields in 2-column grid:
- Property Name * (text input)
- Property Type * (select: Apartment / Villa / House / Studio / Penthouse / Plot / Agricultural Land / Commercial Land / Shop / Office / Warehouse / Building)
- Listing Type (select: For Sale / For Rent)
- Area Size (number input) + Unit (select: sqft / sqyards / acres / kanal / bigha / marla)
  When property_type is agricultural/commercial land → default unit to acres
  When residential → default to sqft
- Price * (number) + Currency (select: INR / AED / CAD) — default based on workspace country
- City * (text)
- Locality / Area / Sector * (text, placeholder "e.g. Sector 72, Mohali")
  Note below: "Arjun uses this to match customer area searches"
- Description (textarea, 500 char max, live counter)
- Status (select: Available / Sold / Hidden)

Photos tab:
- Drop zone with dashed border and camera icon
- "Drop photos or click to upload (Max 5MB each, auto-compressed)"
- Plan limit shown: "5 / 15 photos used (Pro plan)"
- 3-column photo grid
- Each photo: hover shows X delete + star icons
- Star = set as cover photo (only one at a time)
- Drag to reorder (sortable)

AI Tags tab:
- Auto-generated tags shown as pills (editable)
- "Add tag" text input + Enter to add
- Remove tag: X on each pill
- Help text: "Arjun uses these to match your property with customer searches. Add landmarks, nearby areas, features."
- Example tags shown: "near airport", "metro nearby", "gated society"

Form save:
- [Save Changes] button (green, bottom right)
- [Discard] ghost button
- [Delete Property] red text link (shows confirm dialog before delete)
- [Preview as Arjun sees it] icon button → modal showing exact text Arjun sends customers

On save: PATCH /api/properties/:id. Show success toast.
On delete: confirm dialog → DELETE /api/properties/:id → remove from list.

Mobile layout: single column. Property cards stack. Tap → full screen form. Back button returns to list.

Empty state (no properties): illustration, "Add your first property to get started", [+ Add Property] button.
```

Cursor prompt for `app/(dashboard)/properties/new/page.tsx`:
```
Build the Add New Property page for PropAgent.

Same form as the edit form above but:
- Page title: "Add Property"
- No pre-filled values
- [Save Property] button (not "Save Changes")
- On success: POST /api/properties → redirect to /properties with new property selected in list
- Back button: return to /properties
- On mobile: full screen form
```

---

### PAGE 4: SETTINGS → OFFICE & AI `/settings/office` and `/settings/ai`
**Build before the webhook — AI needs these settings at runtime.**

Cursor prompt for `app/(dashboard)/settings/office/page.tsx`:
```
Build the Office & Visits settings page for PropAgent.

Stack: Next.js 14, TypeScript, Tailwind CSS, Supabase.

Fetch from broker_settings WHERE tenant_id = workspace_id.
Save via PATCH /api/settings.

Layout: single column cards, max-width 640px, centred.

Card 1 — Office Address:
Title: "Office Address"
Subtitle: "Shared with customers who request an office visit."
Warning alert (show only if office_address is empty):
  "⚠️ Add your office address so customers can visit you in person."
  Alert style: amber background, amber border.
Fields:
- Full Office Address (textarea, 4 rows, placeholder "e.g. SCO 154, Sector 17-C, Chandigarh 160017")
- City (text input)
- Google Maps Link (text input, optional, placeholder "https://maps.google.com/...")

Card 2 — Pre-Visit Reminders:
Title: "Pre-Visit Reminders"
Subtitle: "Get notified before a customer visits so you can call to confirm."
Toggle row: "Remind me before customer visits" (ON by default)
When toggle is ON, show:
- "Remind me how early?" select: 30 minutes / 1 hour / 2 hours / 1 day
- "Remind me via" select: Push + WhatsApp / Push only / WhatsApp only

Toggle row: "Auto-remind customer too"
Subtitle: "Arjun sends customer a WhatsApp reminder before their visit."
When ON:
- "How early to remind customer?" select: 1 hour / 2 hours / 1 day

[Save Settings] button (primary, full width at bottom)
On save: PATCH /api/settings, show success toast "Settings saved".
```

Cursor prompt for `app/(dashboard)/settings/ai/page.tsx`:
```
Build the AI Agent settings page for PropAgent.

Stack: Next.js 14, TypeScript, Tailwind CSS.
Fetch: broker_settings. Save: PATCH /api/settings.

Card 1 — Agent Identity:
Title: "AI Agent Settings"
Fields:
- AI Name (text input, default "Arjun", only editable on Pro plan)
  If Starter plan: show field as read-only with "Upgrade to Pro to customise" label
- Tone (select: Friendly & Casual (recommended) / Professional / Mix)

Card 2 — Follow-Up Rules:
Title: "Follow-Up Rules"
Info box (blue): "Arjun sends at most 2 follow-ups per lead. This cannot be increased."
Toggle row: "Follow-up unresponsive leads"
When ON:
- "Follow-up after silence of" select: 3 hours / 6 hours / Next morning (default)
- Second follow-up: always next morning at 9 AM

Card 3 — Timing Rules:
Title: "Messaging Limits"
Toggle row: "Never message after 9 PM" (ON, cannot be disabled — show lock icon)
  Subtitle: "Arjun will never follow up or send proactive messages after 9 PM."

Card 4 — Behaviour:
Title: "Conversation Behaviour"
Toggle row: "Ask 'call first or direct visit?' before booking" — ON, locked
  Subtitle: "Required — helps qualify customers before scheduling."
Toggle row: "Send property photos automatically"
Toggle row: "Enable Hinglish mode (for Indian customers)"
  Subtitle: "Arjun detects Hinglish and replies accordingly."
Toggle row: "Enable Hindi understanding (replies in Hinglish)"
  Subtitle: "If customer writes in Hindi script, Arjun replies in Hinglish."

[Preview Arjun's Prompt →] link at bottom
  Opens read-only modal showing the assembled system prompt for this workspace.

[Save Settings] button.
```

---

### PAGE 5: SETTINGS → AVAILABILITY `/settings/availability`
**Build before booking works.**

Cursor prompt for `app/(dashboard)/settings/availability/page.tsx`:
```
Build the Availability settings page for PropAgent.

Stack: Next.js 14, TypeScript, Tailwind CSS, Supabase.

Fetch availability_slots WHERE tenant_id = workspace_id.
Display as 7-day grid (Mon–Sun).

Layout: one card per day of week.

Each day card:
- Day name (Monday, Tuesday, etc.)
- Toggle: Available / Blocked (right side)
- When Available:
  - List of time slots for that day
  - Each slot: time chip (e.g. "10:00 AM") + X delete button
  - [+ Add Slot] button → time picker inline
  - Time picker: hour select + minute select (00 / 30 only)
- When Blocked: grey card, "No meetings on this day"

Buffer setting (below all days):
"Time between meetings" select: None / 15 min / 30 min / 45 min / 60 min

[Save Availability] button.

On save: replace all slots for this tenant (delete existing, insert new).
Show toast: "Availability saved. Arjun will now offer these slots."

Default slots (for new workspaces with no data):
Mon–Fri: 10:00 AM, 11:00 AM, 3:00 PM, 5:00 PM
Saturday: 10:00 AM, 11:00 AM
Sunday: blocked
```

---

### BACKEND: WEBHOOK `/webhook/whatsapp`
**Build this after properties and settings exist — AI needs that data.**

Cursor prompt for `src/routes/webhook.ts`:
```
Build the WhatsApp webhook handler for PropAgent backend.

Stack: Node.js, Express, TypeScript.
Supabase client (service role key) for all DB queries.
Anthropic SDK for AI responses.

POST /webhook/whatsapp:

1. Validate Meta webhook signature (X-Hub-Signature-256 header)
   Skip validation in development (NODE_ENV !== 'production').

2. Parse body. Find the message object:
   body.entry[0].changes[0].value.messages[0]
   If no messages array → return 200 immediately (status updates, not messages)

3. Extract:
   - from: phone number (e.g. "919876543210")
   - message_id: for deduplication
   - type: "text" | "audio" | "image" | "document"
   - text: body.text?.body or empty string
   - phone_number_id: from body.entry[0].changes[0].value.metadata.phone_number_id

4. Find workspace by phone_number_id:
   SELECT tenant_id FROM broker_settings WHERE meta_phone_number_id = phone_number_id

5. If no workspace found → log, return 200 (ignore)

6. Check workspace status:
   SELECT is_suspended, is_blocked, ai_messages_used, ai_message_limit, can_use_ai
   FROM client_plans WHERE tenant_id = tenant_id
   If is_blocked OR is_suspended OR NOT can_use_ai → return 200 (do not respond)
   If ai_messages_used >= ai_message_limit → send template "limit reached" → return 200

7. Find or create conversation:
   UPSERT conversations (tenant_id, customer_phone) ON CONFLICT DO UPDATE last_message_at
   If human_override OR ai_paused → save message only, notify broker via push, return 200

8. Handle media type:
   If type = "audio":
     Send voice note fallback template to customer
     Flag voice_note_received = true
     Return 200
   If type = "image":
     Store media URL (download later if needed)
     Continue with "I received your image." + normal flow
   If type = "text":
     Continue to AI processing

9. Store inbound message in messages table

10. Check followup_capped:
    If conversation.followup_count >= 2 AND message is a follow-up (not customer reply):
      Skip AI, return 200

11. Detect language:
    Run detectLanguage(text) from language.detector.ts
    Returns: "english" | "hinglish" | "devanagari"
    Update conversation.language_pref if changed

12. Build conversation history:
    SELECT content, sender, direction FROM messages
    WHERE conversation_id = id ORDER BY sent_at DESC LIMIT 10
    Reverse for chronological order
    Format as: [{ role: "user", content: msg.content }, { role: "assistant", content: msg.content }]

13. Build AI prompt:
    Call buildPrompt(tenant_id) from prompt.builder.ts
    This assembles the full system prompt with workspace data injected

14. Call AI:
    getAIResponse(history, systemPrompt, tenant_id)
    Returns: { text, model_used, input_tokens, output_tokens }
    Increment ai_messages_used += 1

15. Detect escalation signals in AI response:
    If response contains ULTRA_HOT → createEscalation('ultra_hot') → notifyOwner(URGENT)
    If response contains LOW_BUDGET → createEscalation('low_budget') → notifyOwner
    If response contains NEGOTIATION → createEscalation('negotiation') → notifyOwner

16. Detect booking in AI response:
    If response contains slot confirmation + name + phone → createMeeting()

17. Send WhatsApp reply:
    POST to https://graph.facebook.com/v20.0/{phone_number_id}/messages
    Headers: Authorization: Bearer {meta_access_token}
    Body: { messaging_product: "whatsapp", to: from, type: "text", text: { body: aiText } }

18. Store outbound message in messages table

19. Log AI usage in ai_usage_log

Always return 200 to Meta webhook (even on errors). Never return 4xx or 5xx to Meta.
All errors caught in try/catch — log to console, still return 200.
```

---

### PAGE 6: CHATS `/chats`
**Build after webhook works — test real conversations.**

Cursor prompt for `app/(dashboard)/chats/page.tsx`:
```
Build the Live Chats page for PropAgent.

Stack: Next.js 14, TypeScript, Tailwind CSS, Supabase Realtime.

Desktop: 3-panel layout.
Panel 1 (left, 300px): conversation list
Panel 2 (centre, flex): chat window
Panel 3 (right, 280px): customer profile

Panel 1 — Conversation List:

Fetch conversations WHERE tenant_id = workspace_id ORDER BY last_message_at DESC.
Subscribe to conversations table via Supabase Realtime — auto-update list on new message.

Header: "Live Chats" + unread count badge + [Search] + [+ New Chat] icons

Tabs (horizontal scroll):
All / AI Active / You (human override) / 🔥 Hot / ⚡ Ultra Hot / Callbacks / Booked / Cold

Search bar: filter by name or phone (client-side, instant)

Each conversation card (ConversationCard component):
- Avatar: circle with initials, colour = based on lead score (grey=cold, blue=warm, orange=hot, red=ultra_hot)
- Name (bold) or phone if name unknown
- Last message preview (1 line, ellipsis, max 55 chars)
- Timestamp (relative: "2m", "1h", "3d")
- Status badge: "AI" green / "You" purple / "Booked" blue / "Cold" grey / "⚡ Ultra Hot" orange
- Unread dot (blue circle, top right) if broker hasn't read

Click conversation → load in Panel 2

Panel 2 — Chat Window:

Top bar:
- Customer name + status badge
- Phone number (small, grey)
- [📞 Call] button (opens phone dialer)
- [📋 Profile] button (opens Panel 3 on mobile, already visible on desktop)
- If intent = ultra_hot: show orange banner "⚡ ULTRA HOT — Owner notified. AI paused."
- If intent = low_budget: show amber banner "💰 Low Budget — Owner notified. AI paused."

Chat messages area (scrollable, newest at bottom):
- Customer message: left, white bubble, grey border, avatar left
- AI message: right, #2563EB bubble, white text, small "[AI]" tag above
- Broker message: right, #0F172A bubble, white text, no AI tag
- System event: centred grey pill ("Visit booked — Tue 3 PM", "AI paused")
- Audio message (from customer): audio icon + "Voice note received" + AI reply text shown
- Timestamps below each bubble
- Date separators: "Today", "Yesterday", "Jun 3"
- Auto-scroll to bottom on new message

Subscribe to messages WHERE conversation_id = active_id via Supabase Realtime.
New message → append to list + scroll to bottom + play subtle sound (optional).

AI Active state (bottom bar):
- Blue banner: "Arjun is handling this conversation"
- [Take Over] button (primary, right side)

Human override state (bottom bar):
- Input box: "Type a message..." (active)
- [Send] button
- [📎] attach icon
- [Hand Back to AI] ghost button (left side)

Take Over: PATCH /api/conversations/:id { human_override: true }
Hand Back: PATCH /api/conversations/:id { human_override: false }

Locked state (ultra_hot or escalated):
- Orange banner: "AI paused — [Owner name] has been notified"
- Input disabled

Panel 3 — Customer Profile (CustomerProfile component):

Avatar (48px) + name + phone
Lead score: progress bar (0–100), label (Cold/Warm/Hot/Ultra Hot)
Tag pills: NRI, Investor, Land, Hinglish, Returning, Voice Note

Details section:
Budget | Area | Property Type | Language | First contact | Total messages | Last active

Actions:
[📞 Call Now] [📅 Schedule Callback] [📝 Add Note] [🗑 Archive]

Private Notes:
Textarea (saves on blur) → PATCH /api/conversations/:id { broker_notes: text }

Escalations:
List of escalation events (type + timestamp + resolved status)

Mobile layout:
- Only list shown initially
- Tap conversation → full screen chat (Panel 2 only)
- Profile accessible via [Profile] button → bottom sheet
```

---

### PAGE 7: CALENDAR `/calendar`
**Build after chats. Meetings come from conversations.**

Cursor prompt for `app/(dashboard)/calendar/page.tsx`:
```
Build the Calendar page for PropAgent.

Stack: Next.js 14, TypeScript, Tailwind CSS, Supabase.

Data:
- meetings: WHERE tenant_id = workspace_id AND scheduled_at >= today - 7 days
- callbacks: WHERE tenant_id = workspace_id AND status IN ('pending', 'overdue')
- availability_slots: WHERE tenant_id = workspace_id

Layout: main area (week view) + right sidebar (280px, upcoming list)

Controls:
[← Prev] [Today] [Next →] | Month label | [Week] [Day] toggle | [+ Add Slot] button

Colour coding:
- Green: site visit (AI booked)
- Blue: office visit or manual booking
- Orange: callback reminder
- Red: cancelled
- Purple: rescheduled pending

Week grid:
- Time column (left, 50px): 8 AM to 8 PM, hourly
- 7 columns (Mon–Sun)
- Each event rendered at correct time position
- Event card: customer name + type + time (small text)
- Click event → right drawer

Right sidebar:
"Today's Schedule" section:
- Each event as card:
  - Colour accent left border
  - Time + type label
  - Customer name (bold)
  - Phone number (tap to call)
  - Property name (if site visit)
  - [Call] [Remind] [Cancel] action buttons

"Available Slots" section:
- Free slots as green pills
- Blocked days as grey pills

Overdue callbacks section (if any):
- Red alert: "⚠️ [N] callbacks are overdue"
- Each as card with [Call Now] button

Event drawer (click any event):
- Full details
- Link to conversation
- [Cancel Visit] [Reschedule] [Mark No-Show] [Send Reminder to Customer]

Mobile:
- Day view default (week view too dense)
- Scrollable event list below mini date picker
- Tap event → bottom sheet
```

---

### PAGE 8: LEADS `/leads`
**Build after chats — lead data comes from conversations.**

Cursor prompt for `app/(dashboard)/leads/page.tsx`:
```
Build the Leads CRM page for PropAgent.

Stack: Next.js 14, TypeScript, Tailwind CSS, Supabase.

Data: conversations table with full details, ordered by lead_score DESC.

Toggle: [⊞ Kanban] [☰ List] view

Kanban view:
Columns (horizontal scroll):
New | Qualified | Interested | Hot | Ultra Hot | Meeting Booked | Visited | Low Budget | Cold | Won | Lost

Ultra Hot column: orange header, orange left border on cards.
Low Budget column: amber header.

Each lead card:
- Name (bold) or phone
- Budget range (coloured)
- Area preference (small, brand colour)
- Status badges (Hinglish, NRI, Land, Returning, etc.)
- Time since last message
- Hover: [Call] [Chat] [Move] [Note] action row

Drag cards between columns to change lead_stage.
On drop: PATCH /api/leads/:id { lead_stage: newStage }

Click card → right drawer (LeadDetail):
Tabs: Overview / Timeline / Notes / Meetings / Escalations
Same content as Profile panel in chats but with full history.

List view:
Table: Name | Phone | Budget | Area | Stage | Score | Last Active | Actions
Sortable columns.
[Export CSV] button.

Filters bar:
Date range | Score range | Stage | Language | Has visit booked | Escalation type

Mobile: card list only (no kanban — too small).
```

---

### PAGE 9: CALLBACKS `/callbacks`
**Build after leads.**

Cursor prompt for `app/(dashboard)/callbacks/page.tsx`:
```
Build the Callbacks page for PropAgent.

Stack: Next.js 14, TypeScript, Tailwind CSS, Supabase.

Data: callbacks WHERE tenant_id = workspace_id ORDER BY requested_time ASC.

Tabs: All | Pending | ⚠️ Overdue | Done

Overdue detection: callbacks WHERE status = 'pending' AND requested_time < NOW()
Auto-update status to 'overdue' via backend cron.

If overdue count > 0: show amber alert banner at top.

Table columns:
Customer (name + phone) | Requested Time | Context | Status | Created | Actions

Status chips:
- Pending: amber dot
- Overdue: red dot + text red
- Done: green dot + row opacity 0.6

Actions per row:
- [📞 Call Now] (opens dialer with number)
- [Reschedule] (datetime picker inline)
- [✓ Mark Done] (PATCH /api/callbacks/:id { status: 'done', completed_at: NOW() })
- [Open Chat] (navigates to /chats with that conversation active)

Overdue rows: subtle red left border.
Done rows: opacity 0.6.

Mobile: card list. Each card: name, phone (call icon), context, status chip, action buttons below.
```

---

### PAGE 10: ANALYTICS `/analytics`
**Build after other pages have data.**

Cursor prompt for `app/(dashboard)/analytics/page.tsx`:
```
Build the Analytics page for PropAgent.

Stack: Next.js 14, TypeScript, Tailwind CSS.
Data: fetch from GET /api/analytics?range=30 (30 days default).

Date range picker top right: "Last 7 days" / "30 days" / "90 days" / Custom

Stats row 1 (4 cards):
- Total Leads (count + % change vs prior period, green up arrow or red down)
- Visits Booked (count + % change)
- ⚡ Ultra Hot (count, orange colour)
- AI Messages (used / limit, days until reset)

Stats row 2 (4 cards):
- Callbacks Done vs Pending (done/total ratio)
- Cold Leads (2 follow-ups no reply)
- Low Budget Escalations
- Conversion Rate (leads → visit booked, as %)

Charts row (2 column):
Left: Leads per day — vertical bar chart (canvas or SVG, no external library needed, pure SVG)
  X-axis: dates, Y-axis: count, hover tooltip
Right: Lead type breakdown — donut chart (SVG)
  Segments: Residential / Commercial / Land / Unknown

Charts row 2:
Left: Leads by language (bar: English / Hinglish / Hindi-detected)
Right: Property enquiry ranking (table: property name, enquiries, conversion %)

AI usage section:
- Bar showing used/limit
- Estimated cost this month (based on ai_usage_log)
- Model used

[Export CSV] button → downloads all stats as CSV.
```

---

### PAGE 11: SUPER ADMIN `/superadmin`
**Build last. Needs all other systems working first.**

Cursor prompt for `app/superadmin/page.tsx`:
```
Build the Super Admin overview page for PropAgent.

This page is only accessible to super admin accounts.
SA auth: separate JWT, separate login at /superadmin/login.
Check: if JWT does not have role='super_admin' → redirect to /superadmin/login.

Stack: Next.js 14, TypeScript, Tailwind CSS.
Dark theme throughout (background #0F172A, cards #1E293B, borders #334155, text #E2E8F0).

Layout:
- Dark top bar: PropAgent logo + "SUPER ADMIN" label + admin email + [Logout]
- Horizontal tab nav (not sidebar): Dashboard / Clients / Billing / AI Governance / Prompts / API Keys / Cost Center / Security

Dashboard tab (default):

Stats row 1 (4 dark cards):
- Total Clients (count)
- MRR (₹X.XL or formatted by market)
- AI Messages Today + estimated cost
- Active Clients (status=active count)

Stats row 2 (4 dark cards):
- New Signups This Week
- Failed Payments (count, red if > 0)
- Clients Near AI Limit (>85% used, amber)
- Churned This Month

Client table (below stats):
Columns: Client ID | Business | Plan | Country | AI Usage | Status | Payment | Joined | Actions

Client ID format: PA-IN-0042 (PA = PropAgent, IN = country code, 4-digit sequential)
Plan chips: Starter (grey) / Pro (purple) / Agency (amber) / Custom (blue)
AI Usage: bar showing used/limit percentage

Per-client actions: [View] [Change Plan] [Suspend] [Block]
[+ Create Client] button (primary, top right of table)

Create Client drawer:
Fields: Business Name, Owner Name, Email, Phone, Country, Plan, Trial Days (default 14)
On save: creates tenant record, client_plans record, sends welcome email via Resend.

Clients tab:
Full client management with search, filter by plan/country/status.

Billing tab:
Monthly revenue chart (MRR over 12 months), line chart.
Failed payments table with [Retry] [Mark Paid] [Contact] actions.

AI Governance tab:
Active model display (claude-sonnet-4-20250514).
[Switch Model] → dropdown select, requires confirmation modal.
Hallucination log (questions AI couldn't answer → escalated to human).
Daily AI cost chart.

Prompts tab:
Version history table: Version | Created | Status | Character Count | Actions
[Edit Prompt] → full textarea editor, shows character count, [Save as Draft] [Publish].
[Rollback] → restores previous version with confirmation.

API Keys tab:
Table: Service | Key Preview | Status | Last Used | Actions
Services: Anthropic / Meta WhatsApp / Cloudflare R2 / Resend / Razorpay / Stripe
[Rotate Key] [Revoke Key] per row.

Cost Center tab:
Per-client cost breakdown table: Client | AI Cost | WhatsApp Cost | Storage Cost | Total Cost | Revenue | Margin %.
Sort by margin % to find unprofitable clients.
```

---

## FULL BUILD ORDER SUMMARY

| # | What | Where | Estimated Time |
|---|------|-------|---------------|
| 0.1 | Supabase schema + buckets | Supabase console | 30 min |
| 0.2 | Backend skeleton | Local | 1 hr |
| 0.3 | Frontend skeleton | Local | 30 min |
| 1 | Login + Signup | `/login`, `/signup` | 3 hrs |
| 2 | Onboarding checklist | `/onboarding` | 2 hrs |
| 3 | Properties CRUD | `/properties` | 4 hrs |
| 4 | Settings: Office + AI | `/settings/office`, `/settings/ai` | 3 hrs |
| 5 | Settings: Availability | `/settings/availability` | 2 hrs |
| 6 | Backend: WhatsApp webhook | `backend/webhook.ts` | 4 hrs |
| 7 | Backend: AI service | `backend/ai.service.ts` | 3 hrs |
| 8 | Backend: Prompt builder | `backend/prompt.builder.ts` | 2 hrs |
| 9 | Chats page | `/chats` | 6 hrs |
| 10 | Calendar page | `/calendar` | 4 hrs |
| 11 | Leads/CRM page | `/leads` | 4 hrs |
| 12 | Callbacks page | `/callbacks` | 2 hrs |
| 13 | Analytics page | `/analytics` | 3 hrs |
| 14 | Settings: WhatsApp | `/settings/whatsapp` | 2 hrs |
| 15 | Deploy backend to Render | render.com | 1 hr |
| 16 | Deploy frontend to Vercel | vercel.com | 30 min |
| 17 | WhatsApp webhook live test | Meta console | 1 hr |
| 18 | Super Admin | `/superadmin/*` | 6 hrs |
| 19 | Team page | `/team` | 2 hrs |
| 20 | Marketing landing page | `/` | 4 hrs |

**Total estimated: ~60 hours of focused Cursor Pro sessions.**

---

## HOW TO USE EACH CURSOR PROMPT

1. Open Cursor Pro
2. Open the target file (`Cmd+P` to navigate)
3. Press `Cmd+K` (inline edit) or open Agent (`Cmd+I`)
4. Paste the exact prompt above
5. Let it generate
6. Review: check for any hallucinated imports or missing variables
7. Run, fix errors, iterate

**Cursor Agent mode tips:**
- Always include: "No external component libraries. Pure Tailwind only." to avoid random library imports
- Always include the data source: "Fetch from [table] WHERE tenant_id = workspace_id"
- Always include the save mechanism: "Save via PATCH /api/[endpoint]"
- Always include mobile: "Mobile layout: [describe]"
- If output is incomplete: "Continue from where you stopped, starting at [component name]"
