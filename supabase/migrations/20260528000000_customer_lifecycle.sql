-- 1. Create Wishlists Table
CREATE TABLE IF NOT EXISTS public.wishlists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id text NOT NULL,
    product_name text NOT NULL,
    price numeric NOT NULL,
    img_url text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(customer_id, product_id)
);

-- 2. Create Carts Table
CREATE TABLE IF NOT EXISTS public.carts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id text NOT NULL,
    product_name text NOT NULL,
    price numeric NOT NULL,
    qty integer NOT NULL DEFAULT 1,
    img_url text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(customer_id, product_id)
);

-- 3. Enable RLS on Operational Tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alterations_history ENABLE ROW LEVEL SECURITY;

-- 4. Define Reusable RBAC Check
-- We assume Staff/Managers exist in staff_roles
CREATE OR REPLACE FUNCTION public.is_staff() RETURNS boolean AS $$
BEGIN
  RETURN (SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Customers Table Policies
DROP POLICY IF EXISTS "Customers can view their own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can update their own profile" ON public.customers;
DROP POLICY IF EXISTS "Staff can manage all customers" ON public.customers;
CREATE POLICY "Customers can view their own profile" ON public.customers FOR SELECT USING (id = auth.uid());
CREATE POLICY "Customers can update their own profile" ON public.customers FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Staff can manage all customers" ON public.customers FOR ALL USING (public.is_staff());
CREATE POLICY "System can insert customers" ON public.customers FOR INSERT WITH CHECK (true); -- allowed during auth callback

-- 6. Orders Table Policies
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can manage all orders" ON public.orders;
CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers can insert their own orders" ON public.orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Staff can manage all orders" ON public.orders FOR ALL USING (public.is_staff());

-- 7. Wishlists Table Policies
DROP POLICY IF EXISTS "Customers can manage their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Staff can view all wishlists" ON public.wishlists;
CREATE POLICY "Customers can manage their own wishlists" ON public.wishlists FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "Staff can view all wishlists" ON public.wishlists FOR SELECT USING (public.is_staff());

-- 8. Carts Table Policies
DROP POLICY IF EXISTS "Customers can manage their own carts" ON public.carts;
DROP POLICY IF EXISTS "Staff can view all carts" ON public.carts;
CREATE POLICY "Customers can manage their own carts" ON public.carts FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "Staff can view all carts" ON public.carts FOR SELECT USING (public.is_staff());

-- 9. Support Tickets (Complaints) Policies
DROP POLICY IF EXISTS "Customers can manage their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Staff can manage all tickets" ON public.support_tickets;
CREATE POLICY "Customers can manage their own tickets" ON public.support_tickets FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "Staff can manage all tickets" ON public.support_tickets FOR ALL USING (public.is_staff());

-- 10. Ticket Replies Policies
DROP POLICY IF EXISTS "Customers can view and reply to their own tickets" ON public.ticket_replies;
DROP POLICY IF EXISTS "Staff can manage all ticket replies" ON public.ticket_replies;
CREATE POLICY "Customers can view and reply to their own tickets" ON public.ticket_replies FOR ALL USING (
    ticket_id IN (SELECT id FROM public.support_tickets WHERE customer_id = auth.uid())
);
CREATE POLICY "Staff can manage all ticket replies" ON public.ticket_replies FOR ALL USING (public.is_staff());

-- 11. Measurement Profiles Policies
DROP POLICY IF EXISTS "Customers can manage their own measurements" ON public.measurement_profiles;
DROP POLICY IF EXISTS "Staff can manage all measurements" ON public.measurement_profiles;
CREATE POLICY "Customers can manage their own measurements" ON public.measurement_profiles FOR ALL USING (customer_id = auth.uid());
CREATE POLICY "Staff can manage all measurements" ON public.measurement_profiles FOR ALL USING (public.is_staff());

-- 12. Alterations History Policies
DROP POLICY IF EXISTS "Customers can view their own alterations" ON public.alterations_history;
DROP POLICY IF EXISTS "Staff can manage all alterations" ON public.alterations_history;
CREATE POLICY "Customers can view their own alterations" ON public.alterations_history FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
);
CREATE POLICY "Staff can manage all alterations" ON public.alterations_history FOR ALL USING (public.is_staff());
