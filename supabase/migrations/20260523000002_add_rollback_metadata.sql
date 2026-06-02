-- Alter cms_publish_snapshots to add rollback_source_metadata
ALTER TABLE cms_publish_snapshots ADD COLUMN IF NOT EXISTS rollback_source_metadata JSONB;
