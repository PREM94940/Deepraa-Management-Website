-- supabase/migrations/20260606000001_canonicalize_collection_products.sql
-- ============================================================
-- DEEPRASTORE — Collection Pipeline Canonicalization
-- Purpose: Make collection_products the single source of truth
--          for product-to-collection assignments.
--
-- Context:
--   - product_collections: 169 rows of real data, no FK/PK/RLS
--   - collection_products:   0 rows, no formal schema
--   - Storefront reads: collection_products
--   - Admin Catalog writes: product_collections (being changed)
--
-- Strategy:
--   1. Formally define collection_products with proper constraints
--   2. Migrate 169 rows from product_collections → collection_products
--   3. product_collections is NOT dropped (retained as passive backup)
--
-- Rollback:
--   Revert admin/catalog/page.tsx to write to product_collections.
--   No data will be lost (product_collections is preserved).
-- ============================================================


-- ============================================================
-- STEP 1: Add primary key to collection_products if missing
-- ============================================================
-- The table may already exist from CMS Editor session.
-- We use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS public.collection_products (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id uuid NOT NULL,
    product_id    text NOT NULL,
    position      integer NOT NULL DEFAULT 0,
    created_at    timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if table pre-existed without them
ALTER TABLE public.collection_products
    ADD COLUMN IF NOT EXISTS id           uuid DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS position     integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at   timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;


-- ============================================================
-- STEP 2: Add foreign key constraint to collections table
-- ============================================================
ALTER TABLE public.collection_products
    DROP CONSTRAINT IF EXISTS collection_products_collection_id_fkey;

ALTER TABLE public.collection_products
    ADD CONSTRAINT collection_products_collection_id_fkey
    FOREIGN KEY (collection_id)
    REFERENCES public.collections(id)
    ON DELETE CASCADE;


-- ============================================================
-- STEP 3: Add UNIQUE constraint to prevent duplicate assignments
-- ============================================================
ALTER TABLE public.collection_products
    DROP CONSTRAINT IF EXISTS collection_products_unique_pair;

ALTER TABLE public.collection_products
    ADD CONSTRAINT collection_products_unique_pair
    UNIQUE (collection_id, product_id);


-- ============================================================
-- STEP 4: Add indexes for storefront query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id
    ON public.collection_products (collection_id);

CREATE INDEX IF NOT EXISTS idx_collection_products_position
    ON public.collection_products (collection_id, position);


-- ============================================================
-- STEP 5: Enable Row Level Security
-- ============================================================
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 6: Define RLS Policies
-- ============================================================

-- Public storefront can read (needed for /collections/[slug] page)
DROP POLICY IF EXISTS "Public can read collection_products" ON public.collection_products;
CREATE POLICY "Public can read collection_products"
    ON public.collection_products
    FOR SELECT
    USING (true);

-- Staff and Manager can manage assignments
DROP POLICY IF EXISTS "Staff can manage collection_products" ON public.collection_products;
CREATE POLICY "Staff can manage collection_products"
    ON public.collection_products
    FOR ALL
    USING (
        (SELECT role FROM public.staff_roles WHERE id = auth.uid())
        IN ('Staff', 'Manager')
    );


-- ============================================================
-- STEP 7: Migrate existing data from product_collections
-- ============================================================
-- Copies all 169 real production rows into collection_products.
-- Uses ON CONFLICT DO NOTHING for full idempotency.
-- position = 0 because product_collections had no ordering.
-- product_id cast: product_collections uses UUID type for product_id
-- but collection_products uses text. Cast explicitly.
--
-- ROW-NUMBERED version assigns deterministic position per collection
-- so that products within the same collection get sequential ordering.

INSERT INTO public.collection_products (collection_id, product_id, position, created_at)
SELECT
    pc.collection_id,
    pc.product_id::text,
    ROW_NUMBER() OVER (
        PARTITION BY pc.collection_id
        ORDER BY pc.created_at ASC
    ) - 1 AS position,   -- 0-indexed position
    pc.created_at
FROM public.product_collections pc
ON CONFLICT (collection_id, product_id) DO NOTHING;


-- ============================================================
-- STEP 8: Verify migration (informational)
-- ============================================================
-- Run these manually after migration to verify:
--
--   SELECT COUNT(*) FROM public.collection_products;
--   -- Expected: >= 169
--
--   SELECT COUNT(*) FROM public.product_collections;
--   -- Expected: 169 (unchanged — not dropped)
--
-- product_collections is intentionally preserved as backup.
-- It will be dropped in a future cleanup migration after
-- 30-day verification period.
-- ============================================================
