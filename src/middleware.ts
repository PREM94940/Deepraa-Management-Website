import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Basic in-memory rate limiting for Edge (sliding window would require Redis, this is a basic per-instance fallback)
const ipRequestCounts = new Map<string, { count: number, resetTime: number }>();

export async function middleware(request: NextRequest) {
    // 1. Rate Limiting (Pillar 6)
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const rateLimitWindow = 60000; // 1 minute
    const maxRequests = 100; // 100 requests per minute

    let rateData = ipRequestCounts.get(ip);
    if (!rateData || now > rateData.resetTime) {
        rateData = { count: 1, resetTime: now + rateLimitWindow };
    } else {
        rateData.count++;
    }
    ipRequestCounts.set(ip, rateData);

    if (rateData.count > maxRequests) {
        return new NextResponse("Too Many Requests. Please slow down.", { status: 429 });
    }

    // 2. Supabase Auth Session Refresh
    // This is CRITICAL: it syncs the client-side auth cookies so that
    // server actions and server components can read the authenticated session.
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // First, set on the request (for downstream server components)
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    // Re-create the response with the updated request
                    supabaseResponse = NextResponse.next({ request });
                    // Then set on the response (for the browser)
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Do NOT use getSession() here — it reads from cookies without
    // contacting the Supabase Auth server. Use getUser() which validates the
    // token with the server and refreshes expired tokens automatically.
    await supabase.auth.getUser();

    // 3. Maintenance Mode Check (Pillar 6)
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    const isApi = request.nextUrl.pathname.startsWith('/api');
    const isAdmin = request.nextUrl.pathname.startsWith('/admin');
    const isMaintenancePage = request.nextUrl.pathname === '/maintenance';

    if (isMaintenanceMode && !isAdmin && !isApi && !isMaintenancePage) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    if (!isMaintenanceMode && isMaintenancePage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
