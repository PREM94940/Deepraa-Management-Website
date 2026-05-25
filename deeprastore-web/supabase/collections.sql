-- Create public.collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    banner_image TEXT,
    mobile_banner TEXT,
    whatsapp_cta TEXT,
    seo_title TEXT,
    seo_description TEXT,
    visibility TEXT NOT NULL DEFAULT 'draft', -- 'published', 'draft', 'scheduled', 'hidden'
    sort_order INTEGER DEFAULT 0,
    collection_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'smart', 'offer', 'occasion'
    rules JSONB DEFAULT '{}'::jsonb, -- smart collection rules, e.g. { "tag": "bridal" }
    product_ids TEXT[] DEFAULT '{}'::text[], -- ordered list of product IDs for manual placement
    layout_settings JSONB DEFAULT '{
        "grid_style": "portrait",
        "columns": 3,
        "rows": 4,
        "card_size": "medium",
        "aspect_ratio": "3/4",
        "spacing": "default",
        "padding": "default",
        "mobile_layout": "2-column",
        "banner_position": "top",
        "filter_visibility": true,
        "sort_dropdown_visibility": true
    }'::jsonb,
    scheduled_publish_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create public.collection_products (join table for explicit merchandising position)
CREATE TABLE IF NOT EXISTS public.collection_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0, -- Explicit visual sort order index
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_collection_product UNIQUE (collection_id, product_id)
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Allow public read access to active collections"
ON public.collections FOR SELECT USING (visibility = 'published');

CREATE POLICY "Allow public read access to collection_products"
ON public.collection_products FOR SELECT USING (true);

-- Authenticated/Editor policy (using public access fallback as local testing uses anon key client)
CREATE POLICY "Allow anon select on collections for editing"
ON public.collections FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on collections"
ON public.collections FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on collections"
ON public.collections FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete on collections"
ON public.collections FOR DELETE USING (true);

-- Same policies for collection_products
CREATE POLICY "Allow anon select on collection_products"
ON public.collection_products FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on collection_products"
ON public.collection_products FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on collection_products"
ON public.collection_products FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete on collection_products"
ON public.collection_products FOR DELETE USING (true);
