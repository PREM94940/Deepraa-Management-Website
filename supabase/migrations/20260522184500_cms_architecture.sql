-- Phase 11 CMS Architecture Migrations

-- 1. Create Enums
CREATE TYPE cms_status AS ENUM ('draft', 'published', 'archived', 'scheduled');
CREATE TYPE page_type AS ENUM ('homepage', 'lookbook', 'landing_page', 'collection_curated');

-- 2. Create storefront_themes
CREATE TABLE storefront_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    status cms_status DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    tokens JSONB DEFAULT '{}'::jsonb,
    sections JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create storefront_pages
CREATE TABLE storefront_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id UUID REFERENCES storefront_themes(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    type page_type DEFAULT 'landing_page',
    sections JSONB DEFAULT '[]'::jsonb,
    seo_metadata JSONB DEFAULT '{}'::jsonb,
    locale TEXT DEFAULT 'en-IN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create media_library
CREATE TABLE media_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    dimensions JSONB,
    aspect_ratio TEXT,
    focal_x INTEGER DEFAULT 50,
    focal_y INTEGER DEFAULT 50,
    tags TEXT[],
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create page_audit_logs
CREATE TABLE page_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id UUID REFERENCES storefront_themes(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    previous_state JSONB,
    diff_summary JSONB,
    publish_notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE storefront_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_audit_logs ENABLE ROW LEVEL SECURITY;

-- 7. Add Policies (Public Read)
-- We allow anyone to read published themes
CREATE POLICY "Public themes viewable" ON storefront_themes
    FOR SELECT USING (status = 'published');
    
CREATE POLICY "Public pages viewable" ON storefront_pages
    FOR SELECT USING (
        theme_id IN (SELECT id FROM storefront_themes WHERE status = 'published')
    );

CREATE POLICY "Media viewable" ON media_library
    FOR SELECT USING (true);

-- (Admin policies will be handled via the backend service role or specific RLS later)
