-- supabase/migrations/20260606_fix_collection_products_fk.sql
-- ============================================================
-- DEEPRASTORE — Schema Patch
-- Purpose: Convert collection_products.product_id from TEXT to UUID
--          and add the missing foreign key constraint to products.id
-- ============================================================

-- 1. Convert product_id to UUID in-place
ALTER TABLE public.collection_products 
ALTER COLUMN product_id TYPE uuid USING product_id::uuid;

-- 2. Add Foreign Key linking product_id to products(id)
ALTER TABLE public.collection_products
ADD CONSTRAINT collection_products_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
