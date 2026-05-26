-- supabase/customer_ops_schema.sql
-- Database adjustments for Phase 1: Customer Auth & Operations Foundation

-- 1. Ensure RLS is active on main tables
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaints ENABLE ROW LEVEL SECURITY;

-- 2. Add columns to complaints table for media attachments, staff notes, and replacement tracking
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS staff_notes TEXT,
ADD COLUMN IF NOT EXISTS replacement_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- 3. RLS Policies for customers (Customer-level boundaries)

-- Profile Policies
DROP POLICY IF EXISTS "Allow customers to view own profile" ON public.customers;
CREATE POLICY "Allow customers to view own profile" 
ON public.customers FOR SELECT 
USING (auth.uid()::text = id OR (SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

DROP POLICY IF EXISTS "Allow customers to update own profile" ON public.customers;
CREATE POLICY "Allow customers to update own profile" 
ON public.customers FOR UPDATE 
USING (auth.uid()::text = id OR (SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

DROP POLICY IF EXISTS "Allow anonymous profile creation during signup" ON public.customers;
CREATE POLICY "Allow anonymous profile creation during signup" 
ON public.customers FOR INSERT 
WITH CHECK (true);

-- Order Policies
DROP POLICY IF EXISTS "Allow customers to view own orders" ON public.orders;
CREATE POLICY "Allow customers to view own orders" 
ON public.orders FOR SELECT 
USING (auth.uid()::text = customer_id::text OR (SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

DROP POLICY IF EXISTS "Allow customers to create orders" ON public.orders;
CREATE POLICY "Allow customers to create orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid()::text = customer_id::text OR (SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

-- Complaint/Replacement Policies
DROP POLICY IF EXISTS "Allow customers to view own complaints" ON public.complaints;
CREATE POLICY "Allow customers to view own complaints" 
ON public.complaints FOR SELECT 
USING (auth.uid()::text = customer_id::text OR (SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

DROP POLICY IF EXISTS "Allow customers to raise complaints" ON public.complaints;
CREATE POLICY "Allow customers to raise complaints" 
ON public.complaints FOR INSERT 
WITH CHECK (auth.uid()::text = customer_id::text OR (SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

DROP POLICY IF EXISTS "Allow staff to update complaints" ON public.complaints;
CREATE POLICY "Allow staff to update complaints" 
ON public.complaints FOR UPDATE 
USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

-- RLS Policies for Staff/Manager roles (Staff-level boundaries)
DROP POLICY IF EXISTS "Allow staff full access to customers" ON public.customers;
CREATE POLICY "Allow staff full access to customers" 
ON public.customers FOR ALL 
USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

DROP POLICY IF EXISTS "Allow staff full access to orders" ON public.orders;
CREATE POLICY "Allow staff full access to orders" 
ON public.orders FOR ALL 
USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));
