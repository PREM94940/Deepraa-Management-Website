import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';
    
    // Debug logging to ensure environment variables are present on the client
    if (typeof window !== 'undefined') {
        console.log("[FRONTEND-DEBUG] supabaseUrl starts with https:", supabaseUrl.startsWith('https'));
    }

    return createBrowserClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            // Provide a mock lock to prevent navigator.locks deadlocks in headless browsers or Safari
            lock: async (name, acquireTimeout, fn) => {
                return await fn();
            }
        }
    });
}

// Keep the singleton for backwards compatibility but warn if it hangs
export const supabase = createClient();

