import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// This client uses the service role key and bypasses RLS.
// It MUST NEVER be used in client components or passed to the browser.
// Use ONLY in Server Actions, API routes, or Edge Functions.
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});
