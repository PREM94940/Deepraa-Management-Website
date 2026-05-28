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

        const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && authData.user) {
            const user = authData.user;
            const email = user.email || '';
            const fullName = user.user_metadata?.full_name || (email ? email.split('@')[0] : 'Customer');
            const phone = user.phone || null;

            // Sync Customer Profile for Google Login
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (!existingCustomer) {
                await supabase.from('customers').insert({
                    id: user.id,
                    email: email || undefined,
                    phone_number: phone || undefined,
                    full_name: fullName,
                    created_at: new Date().toISOString(),
                    total_orders: 0,
                    total_spent: 0,
                    complaint_count: 0,
                    refund_count: 0,
                    risk_level: 'Low',
                    loyalty_level: 'Bronze',
                });
            }

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
