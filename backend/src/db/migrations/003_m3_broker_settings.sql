-- M3: Broker settings extensions
ALTER TABLE broker_settings
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';

ALTER TABLE broker_settings
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

ALTER TABLE broker_settings
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE broker_settings
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}';

ALTER TABLE broker_settings
  ADD COLUMN IF NOT EXISTS ai_prefs JSONB DEFAULT '{
    "answer_property_questions": true,
    "show_photos_automatically": true,
    "call_first_or_visit": "visit"
  }'::jsonb;
