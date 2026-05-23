-- Phase 13: Operational Observability - Immutable Publish Snapshots
-- Creates a historical ledger of every live publish event for safe rollbacks.

CREATE TABLE cms_publish_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config JSONB NOT NULL,
    published_by UUID REFERENCES auth.users(id),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    publish_notes TEXT
);

ALTER TABLE cms_publish_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow public read access to snapshots if necessary, or restrict to authenticated users
CREATE POLICY "Managers can read snapshots" 
ON cms_publish_snapshots
FOR SELECT USING (true); -- simplified for now, can restrict later

-- Mutations handled by service role key via Next.js Server Actions
