-- Track last inbound webhook ping per tenant (for WhatsApp health UI)
ALTER TABLE broker_settings
  ADD COLUMN IF NOT EXISTS last_webhook_at TIMESTAMPTZ;
