-- 1. Extend Profiles Table
-- Ensure necessary columns exist. If they do, this script can be adjusted to ALTER.
-- Adding invite tracking columns.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invited_by TEXT;

-- 2. Invitations Table (New)
CREATE TABLE IF NOT EXISTS invitations (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'site' or 'campaign'
  campaign_id TEXT REFERENCES campaigns(id),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Campaign Extensions
-- Adding owner-specific limits and player assets support
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS player_sheets JSONB DEFAULT '{}'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS members TEXT[] DEFAULT '{}'; -- List of usernames

-- 4. Articles Extensions
-- Categorization & Workflow
ALTER TABLE articles ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Compendium'; -- 'Primary Source', 'Compendium', 'Meta-Story'
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published'; -- 'draft', 'pending', 'published'
ALTER TABLE articles ADD COLUMN IF NOT EXISTS layout_data JSONB DEFAULT '{}'::jsonb; -- For collage-style positioning

-- 5. Audit Log Table (New)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  performed_by TEXT REFERENCES profiles(username),
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
