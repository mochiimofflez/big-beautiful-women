-- 1. Folders Extensions
ALTER TABLE folders ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'all';
ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Articles Extensions
ALTER TABLE articles ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ambience_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS folder_id TEXT; -- Reference to folders table

-- 3. Profiles Extensions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 5. Campaigns Extensions
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- 6. Realtime Configuration
-- Enable realtime for the tables we want to sync in Google Docs style
ALTER PUBLICATION supabase_realtime ADD TABLE articles;
ALTER PUBLICATION supabase_realtime ADD TABLE folders;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
