-- 1. Ensure Base Tables Exist
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES folders(id),
  campaign_id TEXT REFERENCES campaigns(id),
  visibility TEXT DEFAULT 'all',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  type TEXT,
  infobox JSONB DEFAULT '[]'::jsonb,
  body JSONB DEFAULT '[]'::jsonb,
  elements JSONB DEFAULT '[]'::jsonb,
  hidden BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  author TEXT,
  category TEXT DEFAULT 'Compendium',
  status TEXT DEFAULT 'draft',
  layout_data JSONB DEFAULT '{"frames": []}'::jsonb,
  folder_id TEXT REFERENCES folders(id),
  background_url TEXT,
  ambience_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS campaign_members (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  wiki_id TEXT REFERENCES campaigns(id),
  role TEXT DEFAULT 'player',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Apply Extensions (in case tables already existed but were missing columns)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS invite_code TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS custom_genres TEXT[] DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS background_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE folders ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'all';
ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE articles ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ambience_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_wikis JSONB DEFAULT '[]'::jsonb;

-- 3. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE articles;
ALTER PUBLICATION supabase_realtime ADD TABLE folders;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
