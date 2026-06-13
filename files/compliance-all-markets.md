# PropAgent V3 — Compliance, Legal, Tax
## India + UAE + Canada — Full Rules

---

## INDIA

### Tax
- GST 18% on SaaS subscriptions (SAC code 998316 — Software as a service)
- Required fields on invoice: GSTIN of PropAgent entity, SAC code, tax amount, total
- B2B clients: collect their GSTIN
- E-invoice: required if annual turnover > ₹5 Crore
- Input tax credit: B2B clients can claim ITC
- Monthly GSTR-1 + GSTR-3B filing required

### Invoice Template Fields (India)
```
PropAgent India Pvt. Ltd. (or your entity)
GSTIN: XX-XXXXXXXXXX-X-XX
Address: [Registered address]
Invoice No: PA-IN-2025-[NNNN]
Invoice Date: DD/MM/YYYY
Due Date: DD/MM/YYYY

Bill To:
  Business Name: [Client name]
  GSTIN: [Client GSTIN if B2B]
  Address: [Client address]
  State: [State]

Description: PropAgent [Plan] — [Month] [Year]
SAC Code: 998316
Amount (before tax): ₹X,XXX
CGST (9%): ₹XXX (if same state)
SGST (9%): ₹XXX (if same state)
— OR —
IGST (18%): ₹XXX (if different state)
Total: ₹X,XXX
```

### Data Laws (DPDP Act 2023)
- Collect consent before processing personal data
- Privacy notice at signup (what data, why, how long)
- Allow users to request data deletion
- Allow users to view their data
- Breach notification: inform users within 72 hours
- Nominate Data Protection Officer if large scale processing

### Action List
- [ ] Privacy Policy page (DPDP compliant)
- [ ] Consent checkbox at signup
- [ ] "Delete my data" button in settings
- [ ] "Export my data" (CSV) in settings
- [ ] Privacy notice shown before first WhatsApp message sent
- [ ] Data retention: delete inactive accounts after 3 years

### WhatsApp Rules (India)
- TRAI DND registry: check before automated outreach
- Business Initiated messages require approved templates
- Templates must be submitted to Meta for approval (24-48 hrs)
- Opt-out mechanism: customer replies STOP → mark as opted out, stop all AI messages
- Customer-initiated messages: 24-hour reply window (free), after that needs template

---

## UAE

### Tax (VAT)
- VAT 5% on SaaS
- VAT registration required if: taxable supplies > AED 375,000/year (mandatory) or > AED 187,500 (voluntary)
- Tax Invoice required fields: TRN of supplier, TRN of buyer (if registered), date, VAT amount, total
- Returns: quarterly VAT return to FTA (Federal Tax Authority)

### Invoice Template Fields (UAE)
```
PropAgent FZC (or your entity)
TRN: 100-XXXXXX-XXXXX
Address: [UAE address or free zone]
Tax Invoice No: PA-AE-2025-[NNNN]
Tax Invoice Date: DD/MM/YYYY

Customer:
  Name: [Client name]
  TRN: [Client TRN if registered]

Description: PropAgent [Plan] — [Month] [Year]
Amount (excl. VAT): AED XXX.XX
VAT (5%): AED XX.XX
Total (incl. VAT): AED XXX.XX
```

### Data Laws (UAE PDPL)
- Federal Decree No. 45 of 2021
- Consent required for personal data processing
- Data must not be transferred outside UAE without adequate protection
- Controller must appoint DPO if large scale
- Breach notification: inform within 72 hours

### RERA Compliance (Real Estate)
- Disclaimer on all property listings: "All property information is provided by the broker. Verify details with the relevant real estate authority (RERA / DLD)."
- Never claim properties are RERA-approved without verification
- No false advertising of prices or availability

### Action List
- [ ] UAE-specific privacy policy section
- [ ] RERA disclaimer on all property cards and AI messages
- [ ] AED currency display
- [ ] VAT calculation on invoices
- [ ] TRN field in client settings
- [ ] Data residency option (store UAE data in UAE Supabase region)

---

## CANADA

### Tax (GST/HST/PST/QST)
- Federal GST 5% applies to all digital services sold in Canada
- Must register for GST/HST if: revenue from Canadian customers > CAD 30,000 in any 4 quarters
- Simplified registration available for non-resident businesses

Provincial rates on top of GST:
```
Province         GST    HST    PST    Total
British Columbia 5%     -      7%     12%
Alberta          5%     -      -      5%
Saskatchewan     5%     -      6%     11%
Manitoba         5%     -      7%     12%
Ontario          -      13%    -      13%
Quebec           5%     -      9.975% 14.975% (QST)
Nova Scotia      -      15%    -      15%
New Brunswick    -      15%    -      15%
PEI              -      15%    -      15%
Newfoundland     -      15%    -      15%
```

For SaaS (digital service supplied to Canadian customer = B2C):
- Apply the rate for the province the customer is in
- GST/HST: include in invoice, remit to CRA
- QST: separate registration with Revenu Québec required

### Invoice Template Fields (Canada)
```
PropAgent Inc. (or your entity)
Business Number: XXXXXXXXX RT 0001
HST/GST Registration: XXXXXXXXX RT 0001
Invoice No: PA-CA-2025-[NNNN]
Invoice Date: YYYY-MM-DD

Bill To:
  [Client name]
  [Province]

Description: PropAgent [Plan] — [Month] [Year]
Amount: CAD XX.XX
GST/HST (X%): CAD X.XX
Total: CAD XX.XX
```

### CASL (Canada Anti-Spam Law)
**This is critical. Fines up to CAD 10 million.**

Rules:
1. Express consent required before sending commercial messages via WhatsApp
2. Implied consent allowed for: existing business relationship (2 years), published contact information (within intended use)
3. Every commercial message must contain:
   - Sender identification (business name, address)
   - Unsubscribe mechanism
   - Unsubscribes must be honoured within 10 business days
4. Consent records must be kept (who, when, how consent was given)
5. Pre-ticked boxes are NOT valid consent

Implementation:
- Signup form: "I consent to receive WhatsApp messages from PropAgent about my account and property enquiries" — mandatory checkbox
- First WhatsApp message template: includes "Reply STOP to unsubscribe"
- STOP detection → mark opted_out = true, never message again
- Consent log: stored in DB with timestamp

### PIPEDA (Privacy Law)
- Consent before collecting personal info
- Tell them what you're collecting and why
- Let them access and correct their info
- Safeguard their info
- Let them withdraw consent

### FINTRAC (Anti-Money Laundering)
- Applies only if: accepting cash > CAD 10,000 in one transaction
- For SaaS subscription payments via card: generally not applicable
- For in-person cash transactions: report to FINTRAC

### Action List
- [ ] CASL consent checkbox at signup (Canada flag = show this)
- [ ] "Reply STOP to unsubscribe" in first WhatsApp template
- [ ] opted_out field in conversations table (already included)
- [ ] STOP/UNSUBSCRIBE detection in webhook handler
- [ ] Consent log table
- [ ] Province detection → correct tax rate
- [ ] French language support (Quebec)
- [ ] PIPEDA section in privacy policy
- [ ] Business Number field in Canada client settings

---

## TERMS OF SERVICE KEY CLAUSES

All Markets:

1. Acceptable Use
   - Do not use PropAgent to send spam
   - Do not list fake properties
   - Do not impersonate real estate agents without authority
   - Do not violate WhatsApp's Business Policy

2. AI Disclaimer
   - AI responses are not legal, financial, or investment advice
   - All property details should be independently verified
   - PropAgent is not responsible for AI errors or hallucinations

3. Data Processing
   - PropAgent processes customer data on behalf of the broker (data processor relationship)
   - Broker is the data controller
   - Data Processing Agreement (DPA) available on request

4. Limitation of Liability
   - Not liable for missed leads, failed bookings, or lost deals due to technical issues
   - Maximum liability = amount paid in last 3 months

5. Payment Terms
   - India: Razorpay, INR, auto-renewal, 7-day grace period on failed payment
   - UAE: Stripe, AED, auto-renewal
   - Canada: Stripe, CAD, auto-renewal

6. Cancellation
   - Cancel anytime, data retained 30 days after cancellation
   - No refunds for partial months

7. Governing Law
   - India: Jurisdiction — [City where registered], India
   - UAE: DIFC Courts or Abu Dhabi Courts
   - Canada: Province of [where incorporated], Canada

---

## PRIVACY POLICY KEY SECTIONS

What we collect:
- Account info: name, email, phone, business details
- Usage data: conversations, meetings, property enquiries (on behalf of broker)
- Payment info: handled by Razorpay/Stripe (we don't store card details)
- Technical: IP address, device type, session duration

How we use it:
- Provide the service
- Send billing emails
- Improve the AI model (opt-out available)
- Legal compliance

Who we share with:
- Anthropic (AI processing) — data processing agreement in place
- Twilio (WhatsApp delivery) — DPA in place
- Supabase (database hosting) — DPA in place
- Stripe/Razorpay (payments) — PCI-DSS compliant

Your rights:
- Access your data
- Delete your data
- Correct your data
- Export your data
- Withdraw consent

---

## AI USAGE POLICY

What the AI does:
- Responds to customer WhatsApp enquiries using property data you provide
- Never gives legal, financial, or tax advice
- Refers to verified data only

What the AI does not do:
- Make commitments on your behalf without your approval
- Store customer data outside your workspace
- Share your data with other brokers

Accuracy:
- AI uses only data you upload
- If uncertain, AI escalates to you
- You can review all AI messages in the dashboard

Opt-out:
- Customers can say STOP to opt out of AI messages
- You can disable AI at any time (Settings → AI Agent → toggle off)
