-- Conversations: broker read tracking for unread counts
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_broker_read TIMESTAMPTZ;
