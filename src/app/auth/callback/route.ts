import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // If we have a custom redirect path, use it, else default to /account
    let next = searchParams.get('next') ?? '/account';

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Can be ignored if middleware handles it
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // Ensure next URL is relative or on the same origin
            if (next.startsWith('/')) {
                return NextResponse.redirect(`${origin}${next}`);
            }
            return NextResponse.redirect(`${origin}/account`);
        }
    }

    // Redirect to home if exchange fails
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
