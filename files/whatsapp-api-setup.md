# WhatsApp Business API — Complete Registration Guide
## Real Facts Only. No Guesses. Updated June 2025.

---

## What You Need to Know First

**Meta On-Premise API is dead.**
Meta officially sunset On-Premises in October 2025. All deployments must now use Cloud API. Cloud API is the only supported option — Meta hosts the infrastructure, you make REST calls to graph.facebook.com.

**Pricing changed July 1, 2025.**
Meta now charges per delivered template message, not per 24-hour conversation window. Customer support conversations within 24-hour windows are completely free.

**Direct access is now available.**
Since Meta launched Cloud API, direct integration is available to any business with a Meta Business Account — you no longer need to go through a BSP (Twilio, Gupshup, etc.).

---

## What PropAgent Needs

PropAgent is a SaaS platform. You (Anandu) register ONE WhatsApp Business Account for PropAgent as a solution provider/platform. Each broker-client then connects their own number to PropAgent via OAuth embedded signup.

Two models:

**Model A — Each broker's own number (recommended)**
- Broker connects their own WhatsApp Business number to PropAgent
- Meta Embedded Signup flow (handled in PropAgent settings page)
- Each broker = separate WABA (WhatsApp Business Account)
- You need a Meta App with WhatsApp product

**Model B — PropAgent shared number (not recommended)**
- One number for all clients
- Limited, not scalable, no personalisation
- Do not use this

Use Model A.

---

## STEP 1 — Create Meta Developer Account

1. Go to: **developers.facebook.com**
2. Log in with your Facebook account
3. Click "My Apps" → "Create App"
4. App type: **Business**
5. App name: `PropAgent`
6. Business portfolio: select your Meta Business Manager or create one

Time: 10 minutes

---

## STEP 2 — Create Meta Business Manager Account

1. Go to: **business.facebook.com**
2. Create account with:
   - Legal business name (must match documents)
   - Business email
   - Country: India
   - Phone number
3. Complete Meta's business verification — upload official documentation: tax ID (GST certificate), incorporation documents, or utility bill. Wait 2–10 business days for approval.
4. This step is required. Meta checks your website and contact details. If details don't match or your site looks inactive, verification will stall.

**Documents to keep ready:**
- GST certificate (India)
- Trade licence (UAE)
- Business registration (Canada)
- Utility bill or bank statement matching the business address
- Company website (must be live, must mention your business name)

Time: 2–10 business days for verification

---

## STEP 3 — Add WhatsApp Product to Your App

1. In Meta Developer Console → your PropAgent app
2. Left sidebar → "Add Product"
3. Select: **WhatsApp**
4. Click "Set Up"
5. This creates a test WhatsApp Business Account automatically
6. You get a test phone number to experiment with (cannot use for production)

Time: 5 minutes

---

## STEP 4 — Get a Dedicated Phone Number

You cannot use your existing personal or business WhatsApp number. The number must be new (or unused on WhatsApp), able to receive SMS or voice calls, and clearly tied to your business. A common mistake: businesses try to switch their existing WhatsApp number to the API, which leads to downtime.

**What to buy:**
- A SIM card on any operator (Airtel, Jio, Vi — for India)
- Keep it active (it needs SMS/voice for OTP)
- Never install WhatsApp app on this number
- This will be PropAgent's platform number (or client's number via embedded signup)

**For client numbers:**
- Client registers their own business number
- PropAgent's embedded signup flow handles the connection
- Client's existing WhatsApp Business App number CAN be migrated but requires extra steps

Time: Buy SIM same day, activation 1–2 hours

---

## STEP 5 — Register the Phone Number in Meta

1. In WhatsApp section of Developer Console
2. "Phone Numbers" → "Add Phone Number"
3. Enter the number
4. Choose verification: SMS or Voice call
5. Enter OTP received
6. Enable Two-Step Verification via Security Center — this creates a 6-digit PIN used in registration.

**Display Name — Critical Rule:**
Choose a display name that includes your actual business name — e.g., "Arjun by PropAgent" instead of just "Arjun". Generic names like "Agent", "Sales Assistant", "SupportBot" get rejected with no clear reason.

Wait for the display name to be approved — only then will certificate download and registration work. There are two approvals: first an ethical check, then business verification review. You get notified when it's approved.

Time: Display name approval = 1–5 business days

---

## STEP 6 — Get Your API Credentials

Once approved, collect these from Developer Console:

```
Phone Number ID:     From WhatsApp → Phone Numbers tab
WABA ID:             From WhatsApp → API Setup
Access Token:        From System User (permanent token)
App Secret:          From App Settings → Basic
Verify Token:        You create this (any string, for webhook verification)
```

**Create a Permanent System User Token (do this, not a personal token):**
1. Meta Business Manager → Business Settings
2. System Users → Add
3. Name: `propagent-api`
4. Role: Employee
5. Assign assets: your WhatsApp Business Account → Full Control
6. Generate token → select permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
7. Copy the token — you only see it once. Store in backend `.env`

Time: 30 minutes

---

## STEP 7 — Set Up Webhook

WhatsApp delivers incoming messages to your server via webhook.

1. In Developer Console → WhatsApp → Configuration → Webhook
2. Callback URL: `https://your-backend.onrender.com/webhook/whatsapp`
3. Verify Token: the string you chose
4. Subscribe to fields:
   - `messages` (incoming messages)
   - `message_status` (delivered, read receipts)
5. Click Verify and Save

**Your backend must respond to GET requests for verification:**
```javascript
// webhook.ts
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});
```

Time: 30 minutes

---

## STEP 8 — Create Message Templates

Cloud API uses Graph API for sending messages and Webhooks for receiving events, both over HTTPS.

You need approved templates for:
1. First outbound message to a new lead (if you initiate)
2. Follow-up messages
3. Pre-visit reminders
4. Owner alerts (Ultra Hot, Low Budget)
5. Booking confirmations

**Template submission:**
1. Developer Console → WhatsApp → Message Templates
2. "Create Template"
3. Category: **Utility** (for transactional/booking messages) or **Marketing** (for follow-ups)
4. Language: English, Hindi, Arabic (create separate per language)
5. Fill content with variables like `{{1}}`, `{{2}}`
6. Submit for review

**Template approval time: 24–48 hours for most, up to 7 days occasionally**

**Important: Customer-initiated conversations are FREE.**
Within the 24-hour window after a customer messages you first, you can reply freely without templates and without cost. This covers PropAgent's primary use case (customer messages Arjun first).

**Templates needed only for:**
- Follow-up message 1 (AI sending after silence)
- Follow-up message 2
- Pre-visit reminder to customer
- Booking confirmation

---

## STEP 9 — Go Live (Production Access)

In Developer Console:
1. App Review → Permissions
2. Request: `whatsapp_business_messaging`, `whatsapp_business_management`
3. Describe your use case: "Automated property enquiry responses and meeting booking via AI"
4. Submit for review
5. **Without this, you can only message numbers you manually add as test numbers**

Production approval time: 3–10 business days

---

## STEP 10 — Embedded Signup for Client Numbers

For PropAgent SaaS — each broker connects their own number. This uses Meta's Embedded Signup flow.

**Setup:**
1. In Developer Console → WhatsApp → Configuration → Embedded Signup
2. Enable "Enable Embedded Signup"
3. Get the JavaScript snippet
4. Add to PropAgent's Settings → WhatsApp page

**How it works:**
- Broker opens PropAgent → Settings → WhatsApp
- Clicks "Connect WhatsApp Number"
- Meta popup opens (Embedded Signup)
- Broker logs into their Facebook account
- Grants PropAgent permission to manage their WABA
- Meta returns: phone_number_id, waba_id, access_token
- Store in PropAgent's broker_settings table (encrypted)
- Webhook auto-configured for their number

**Scopes needed in your Meta App for Embedded Signup:**
- `whatsapp_business_management`
- `whatsapp_business_messaging`
- `business_management`

---

## REAL PRICING (Updated July 2025 + January 2026)

**Model: Per delivered template message (not per conversation)**

**Customer-initiated messages (within 24 hours): FREE**
This is PropAgent's main flow. Customer texts first → Arjun replies → ALL replies within 24 hours = FREE.

**Template messages you send proactively:**

India (INR billing from January 2026):
| Category | Rate |
|----------|------|
| Marketing template | ₹1.09 per message |
| Utility template | ₹0.145 per message |
| Authentication | ₹0.145 per message |
| Service (customer-initiated, within 24hr) | FREE |

UAE (USD billing):
| Category | Rate |
|----------|------|
| Marketing template | ~$0.04 per message |
| Utility template | ~$0.01 per message |
| Service (within 24hr) | FREE |

Marketing messages sent to India are priced at $0.0107 (≈₹0.89) per message.

**PropAgent Cost Estimate per Client per Month:**

Scenario: 100 leads, each generating 8 messages (customer-initiated):
- Customer messages (inbound): FREE
- Arjun replies within 24hr window: FREE
- Follow-up message 1 (utility template): 100 × ₹0.145 = ₹14.50
- Follow-up message 2 (utility template): 50 × ₹0.145 = ₹7.25
- Visit reminder (utility template): 20 × ₹0.145 = ₹2.90
- Booking confirmation (utility template): 20 × ₹0.145 = ₹2.90
- **Total WhatsApp cost: ~₹27/client/month**

This is extremely cheap. WhatsApp cost is not the concern — AI (Claude) cost is the larger variable.

---

## WHATSAPP TEMPLATES FOR PROPAGENT

### Template 1: Follow-Up 1 (Utility)
```
Name: propagent_followup_1
Category: UTILITY
Language: en
Body: Hi {{1}}, just checking in — did you want to lock in that property visit we discussed?
```

### Template 2: Follow-Up 1 Hinglish (Utility)
```
Name: propagent_followup_1_hi
Category: UTILITY
Language: hi (submit as English with Hindi text)
Body: Yaar, visit confirm karna tha kya? Batao toh!
```

### Template 3: Follow-Up 2 (Utility)
```
Name: propagent_followup_2
Category: UTILITY
Language: en
Body: Hi {{1}}, this property is getting a lot of attention. Want me to hold a slot for you?
```

### Template 4: Visit Reminder to Customer (Utility)
```
Name: propagent_visit_reminder
Category: UTILITY
Language: en
Body: Reminder: Your visit is scheduled for {{1}} at {{2}}. See you there!
```

### Template 5: Booking Confirmation (Utility)
```
Name: propagent_booking_confirm
Category: UTILITY
Language: en
Body: Done! Your visit is confirmed for {{1}} at {{2}}. {{3}} will meet you. Any questions? Reply here.
```

### Template 6: Ultra Hot Alert to Owner (Utility)
```
Name: propagent_ultrahot_alert
Category: UTILITY
Language: en
Body: 🔴 URGENT: High-value lead {{1}} ({{2}}) — Budget {{3}}. They are waiting. Call within 30 minutes.
```

---

## COMMON ERRORS AND FIXES

| Error | Cause | Fix |
|-------|-------|-----|
| Display name rejected | Generic name (Agent, Bot, AI) | Use "Arjun by [Business Name]" |
| Number status stuck "Pending" | Display name not yet approved | Wait for display name approval first, then register |
| Webhook verification failing | Wrong verify token | Match META_VERIFY_TOKEN exactly in code and console |
| "Not a valid WhatsApp number" | Number has WhatsApp app installed | Factory reset WhatsApp on that device first |
| Template rejected | Misleading, promotional, or vague content | Make it clearly transactional (utility), not marketing |
| 190 error: Invalid OAuth token | Token expired or wrong scopes | Regenerate System User permanent token |
| Rate limit hit | Too many requests | Meta allows 80 msg/sec by default — more than enough |

---

## WHAT TO BUILD IN SETTINGS → WHATSAPP PAGE

The WhatsApp settings page in PropAgent must do:

1. **Status display** — Connected / Disconnected
2. **Embedded Signup button** — "Connect WhatsApp Number" → opens Meta popup
3. **Connected number display** — +91 XXXXX XXXXX
4. **WABA ID display** (read-only, for support)
5. **Phone Number ID display** (read-only)
6. **Webhook status** — Auto-configured, no manual entry
7. **Last message received** — timestamp
8. **Message template status** — list of approved templates
9. **Disconnect button** — revokes token, clears DB fields
10. **Test message button** — sends "Hi from PropAgent test" to owner's own number

**Data stored per workspace in `broker_settings`:**
```sql
meta_phone_number_id    TEXT  -- used in API calls
meta_access_token       TEXT  -- encrypted at rest
meta_waba_id            TEXT
whatsapp_connected      BOOLEAN
whatsapp_number         VARCHAR(20)
whatsapp_connected_at   TIMESTAMPTZ
```
