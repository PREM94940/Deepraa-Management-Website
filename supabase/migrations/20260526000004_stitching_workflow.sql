-- supabase/migrations/20260526000004_stitching_workflow.sql
-- Stitching Workflow & Alterations Sizing System

-- 1. Measurement Profiles Table (Saves Mom, Sister, Bridal profiles for repeat orders)
CREATE TABLE IF NOT EXISTS public.measurement_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
    profile_label text NOT NULL, -- 'Bridal Trousseau', 'Casual Blouse', 'Mom Sizing', 'Sister Sizing', etc.
    bust numeric,
    waist numeric,
    shoulder numeric,
    front_neck_depth numeric,
    back_neck_depth numeric,
    sleeve_length numeric,
    sleeve_round numeric,
    blouse_length numeric,
    unit text DEFAULT 'inches' NOT NULL, -- 'inches', 'cm'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Alteration History Table (Customized Sizing Fitting Memory)
CREATE TABLE IF NOT EXISTS public.alterations_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    customization_id uuid REFERENCES public.stitching_customizations(id) ON DELETE CASCADE,
    complaint_details text NOT NULL,
    adjustment_notes text NOT NULL,
    tailor_remarks text,
    status text DEFAULT 'Requested' NOT NULL, -- 'Requested', 'Alteration_In_Progress', 'Resolved'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add Workflow fields to stitching_customizations
ALTER TABLE public.stitching_customizations 
ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.measurement_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'Pending Review' NOT NULL, -- 'Pending Review', 'Suspicious Size Flagged', 'Verified'
ADD COLUMN IF NOT EXISTS verification_remarks text,
ADD COLUMN IF NOT EXISTS suspicious_flags jsonb DEFAULT '[]'::jsonb;

-- 4. Enable Row Level Security
ALTER TABLE public.measurement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alterations_history ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS Policies for Staff
CREATE POLICY "Allow authenticated staff to manage measurement profiles"
ON public.measurement_profiles FOR ALL
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated staff to manage alterations history"
ON public.alterations_history FOR ALL
USING (auth.role() = 'authenticated');

-- Policies for public/anon users to select & insert their own profiles
CREATE POLICY "Allow public users to read and insert measurement profiles"
ON public.measurement_profiles FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public users to manage alterations"
ON public.alterations_history FOR ALL
USING (true)
WITH CHECK (true);
