# Meta WhatsApp Setup for PropAgent

Complete these steps in Meta Business Manager. PropAgent cannot fix error **(#133010) Account not registered** from code alone.

## 1. Register the phone number

1. Open [Meta Business Suite](https://business.facebook.com/) → **WhatsApp Manager** → asset **PropAgent**.
2. Confirm phone **+91 90564 58838** shows status **Connected** on the Phone numbers tab.
3. Use these IDs in PropAgent (from your Meta screenshots, June 2026):

| Field | Value | Where in Meta |
|-------|-------|---------------|
| WhatsApp business number | `9056458838` | Phone numbers tab |
| **WABA ID** | `930455233343881` | Business asset header (PropAgent) |
| **Phone Number ID** | `1234959086357829` | Phone profile modal header (top of profile screen) |
| Access token | *(paste from Meta Developers → System User token)* | API Setup |

> **Outdated IDs (do not use):** WABA `1730231438174869`, Phone Number ID `1240751975783102` — these were saved on PA-IN-0003 earlier but Meta now shows the new IDs above.

4. Click **Register phone number** in Meta if status is not Connected (fixes error #133010).

## 2. Access token

1. Meta Developers → your app → **WhatsApp** → **API Setup**.
2. Create a **System User** permanent token with:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
3. Paste the token in PropAgent → Settings → WhatsApp → **Access token** → Save.

## Production URLs

- **Frontend:** https://real-estate-a-iagent.vercel.app
- **Backend:** https://realestateaiagent-0ubp.onrender.com

## 3. Webhook (required for chats to appear)

| Field | Value |
|-------|-------|
| Callback URL | `https://realestateaiagent-0ubp.onrender.com/webhook/whatsapp` |
| Verify token | `propagent_webhook_verify_2026_secure` (must match Render `META_VERIFY_TOKEN`) |
| Subscribe | `messages` |

After saving the webhook in Meta, click **Verify and save**.

## 4. App secret (required for inbound messages)

1. Meta Developers → App → **Settings** → **Basic** → copy **App Secret**.
2. Add to Render service env as `META_APP_SECRET`.
3. Redeploy backend.

Without `META_APP_SECRET`, Meta POST webhooks are rejected and **Chats stay empty**.

## 5. Test recipients (dev / trial apps)

If your app is in development mode, add your personal WhatsApp number under **API Setup → To** before messaging the business number.

## 6. Verify in PropAgent

1. Settings → WhatsApp → **Save settings**.
2. Click **Send test message** — must succeed (no #133010).
3. Status badge should show **Connected** only after a successful test.
4. Message **hi** from your phone to the business number.
5. Open **Chats** — conversation should appear within seconds.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `(#133010) Account not registered` | Register phone in WhatsApp Manager (step 1) |
| Chats empty, test OK | Set webhook + `META_APP_SECRET` on Render |
| AI not replying | Ensure `OPENAI_API_KEY` on Render; inbound message must arrive first |
| Save then disconnected | Expected — send test message after every credential change |
