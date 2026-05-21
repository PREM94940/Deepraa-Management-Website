-- DEEPRSTORE OMNICHANNEL ERP - Initial Database Schema

-- 1. Create Customers Table (Permanent Identity System)
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    phone_number text UNIQUE NOT NULL,
    whatsapp_number text,
    email text,
    city text,
    address text,
    gst_number text,
    customer_type text DEFAULT 'retail',
    tags text[],
    total_orders integer DEFAULT 0,
    total_spent numeric DEFAULT 0.0,
    complaint_count integer DEFAULT 0,
    refund_count integer DEFAULT 0,
    risk_level text DEFAULT 'Low', -- 'Low', 'Medium', 'High'
    loyalty_level text DEFAULT 'Bronze', -- 'Bronze', 'Silver', 'Gold', 'Platinum'
    notes text,
    measurements jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Admins can do everything. For now, we allow authenticated users (staff).
CREATE POLICY "Allow authenticated users to manage customers" 
ON public.customers FOR ALL 
USING (auth.role() = 'authenticated');

-- 2. Update Orders Table (If it exists, otherwise create it)
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES public.customers(id),
    status text DEFAULT 'Lead',
    total_amount numeric NOT NULL,
    payment_status text DEFAULT 'Pending',
    source text DEFAULT 'website',
    delivery_date timestamp with time zone,
    notes text,
    measurements jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage orders" 
ON public.orders FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to read their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = customer_id);

-- 3. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id text, -- Can be UUID if referring to products table, or text for custom
    product_name text NOT NULL,
    price numeric NOT NULL,
    quantity integer DEFAULT 1,
    customizations jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage order items" 
ON public.order_items FOR ALL 
USING (auth.role() = 'authenticated');

-- 4. Order Status History (Workflow Engine Tracker)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status text,
    new_status text NOT NULL,
    changed_by text,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage status history" 
ON public.order_status_history FOR ALL 
USING (auth.role() = 'authenticated');

-- Note: For public customers creating an order on the website, 
-- you will need an 'INSERT' policy for anon users, or use a secure backend API route.

-- 5. Products Table (Omnichannel Inventory)
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sku text UNIQUE NOT NULL,
    title text NOT NULL,
    description text,
    price numeric NOT NULL,
    images text[],
    category text,
    status text DEFAULT 'Active', -- 'Active', 'Draft', 'Out of Stock'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage products" 
ON public.products FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public to view products" 
ON public.products FOR SELECT 
USING (true);

-- 6. Storage Bucket for Product Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for Product Images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated users to upload images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- 7. Complaints & Issues Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id),
    customer_id uuid REFERENCES public.customers(id),
    issue_type text NOT NULL,
    issue_reason text NOT NULL,
    expected_resolution_date timestamp with time zone,
    refund_amount numeric DEFAULT 0,
    refund_status text,
    status text DEFAULT 'Open',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage complaints" 
ON public.complaints FOR ALL 
USING (auth.role() = 'authenticated');
