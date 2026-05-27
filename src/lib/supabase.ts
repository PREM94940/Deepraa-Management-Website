import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

// Use createBrowserClient from @supabase/ssr so auth tokens are stored
// in cookies (not just localStorage). This is CRITICAL: it allows the
// Next.js middleware and server actions to read the authenticated session.
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
