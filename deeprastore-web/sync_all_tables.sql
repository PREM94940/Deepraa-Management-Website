-- Run this in your Supabase SQL Editor to make sure every column exists.

-- 1. CUSTOMERS
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gst_number text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_type text DEFAULT 'retail';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_orders integer DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_spent numeric DEFAULT 0.0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS complaint_count integer DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS refund_count integer DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'Low';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS loyalty_level text DEFAULT 'Bronze';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS measurements jsonb;

-- 2. ORDERS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'Lead';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'website';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_date timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS target_days integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reference_image text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_screenshot text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'Pending Approval';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS measurements jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expected_delivery_date timestamp with time zone;

-- 3. ORDER ITEMS
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customizations jsonb;

-- 4. ORDER STATUS HISTORY
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS old_status text;
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS new_status text;
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS changed_by text;
ALTER TABLE public.order_status_history ADD COLUMN IF NOT EXISTS notes text;

-- 5. PRODUCTS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';

-- 6. COMPLAINTS
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id);
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id);
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS issue_type text;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS issue_reason text;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS expected_resolution_date timestamp with time zone;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS refund_status text;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS status text DEFAULT 'Open';

-- 7. STORE UI SETTINGS
CREATE TABLE IF NOT EXISTS public.store_ui_settings (
    id integer PRIMARY KEY DEFAULT 1,
    config jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.store_ui_settings ENABLE ROW LEVEL SECURITY;

-- 8. ALLOW ALL FOR ANON ON ALL TABLES
DO $$
DECLARE
    table_rec record;
BEGIN
    FOR table_rec IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'CREATE POLICY "Allow anon full access" ON public.' || quote_ident(table_rec.tablename) || ' FOR ALL USING (true) WITH CHECK (true);';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END LOOP;
END $$;
