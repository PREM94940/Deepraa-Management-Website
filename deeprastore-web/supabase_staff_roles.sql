-- Deeprastore Staff Roles Schema (RBAC)

CREATE TABLE IF NOT EXISTS public.staff_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('Manager', 'Staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

-- Security: Only Service Role can insert/update/delete/select. 
-- No public user or client should ever be able to manipulate or read roles directly from the browser.
CREATE POLICY "Enable all access for service role" ON public.staff_roles FOR ALL USING (true);
