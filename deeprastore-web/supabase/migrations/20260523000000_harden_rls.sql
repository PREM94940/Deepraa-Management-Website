-- Phase 12 CMS Infrastructure Hardening
-- Enforce Row Level Security (RLS) on critical operational tables

-- 1. store_ui_settings (Live and Draft CMS Payloads)
ALTER TABLE store_ui_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for Next.js frontend hydration)
CREATE POLICY "Public read access to store_ui_settings" 
ON store_ui_settings
FOR SELECT USING (true);

-- Mutations (INSERT, UPDATE, DELETE) are intentionally NOT allowed via the anon key.
-- All mutations will be handled by the Next.js server actions using the service_role key.

-- 2. staff_roles (RBAC Definitions)
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;

-- Allow staff users to read their own roles or allow public read if necessary for the auth flow
-- The middleware uses server-side Supabase client, but let's ensure the frontend can read if needed.
CREATE POLICY "Public read access to staff_roles" 
ON staff_roles
FOR SELECT USING (true);

-- No mutations allowed for staff_roles via anon key.
