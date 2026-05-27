import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback to anon key in local dev if service role key is mocked or invalid
export const isMockKey = !serviceRoleKey || serviceRoleKey.startsWith('mock');
const supabaseServiceRoleKey = isMockKey ? anonKey : serviceRoleKey;

if (isMockKey && process.env.NODE_ENV === 'production') {
    console.error("WARNING: SUPABASE_SERVICE_ROLE_KEY is mocked or missing in production! Server operations demanding admin credentials (like CMS editing) will fail due to RLS.");
}

// This client uses the service role key and bypasses RLS.
// It MUST NEVER be used in client components or passed to the browser.
// Use ONLY in Server Actions, API routes, or Edge Functions.
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});


