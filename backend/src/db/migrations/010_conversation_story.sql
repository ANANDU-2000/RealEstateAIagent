-- Conversation memory for AI replies (rolling story per chat)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS ai_story_summary TEXT;
