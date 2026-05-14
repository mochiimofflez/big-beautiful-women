-- SQL commands to set up your Supabase database tables.
-- Run these in the 'SQL Editor' of your Supabase project.

-- 1. Profiles Table
CREATE TABLE profiles (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'reader',
  unlocked_wikis JSONB DEFAULT '[]'::jsonb
);

-- 2. Campaigns Table
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT REFERENCES profiles(username),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Articles Table
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  type TEXT NOT NULL,
  infobox JSONB DEFAULT '[]'::jsonb,
  body JSONB DEFAULT '[]'::jsonb,
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  author TEXT REFERENCES profiles(username)
);

-- Enable Row Level Security (Optional, for now you can keep it simple)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Seed the database with the SYSTEM administrative profile
INSERT INTO profiles (username, password, role, unlocked_wikis)
VALUES ('SYSTEM', '7rE31]Q}DJ^Pa#b~(L8', 'gm', '["all"]')
ON CONFLICT (username) DO NOTHING;
