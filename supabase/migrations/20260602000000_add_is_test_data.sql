-- Migration: Add is_test_data flag to products table
-- Purpose: Safely segment Phase 1 mock products from real Shopify migration data.

ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT false;

-- Create an index to quickly filter out test products on the storefront
CREATE INDEX IF NOT EXISTS idx_products_is_test_data ON public.products(is_test_data);
