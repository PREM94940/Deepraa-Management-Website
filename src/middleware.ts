import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Basic in-memory rate limiting for Edge (sliding window would require Redis, this is a basic per-instance fallback)
const ipRequestCounts = new Map<string, { count: number, resetTime: number }>();

export async function middleware(request: NextRequest) {
    // 1. Rate Limiting (Pillar 6)
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const isAdminLogin = request.nextUrl.pathname === '/admin/login';
    const rateLimitWindow = isAdminLogin ? 15 * 60 * 1000 : 60000; // 15 mins for login, 1 min otherwise
    const maxRequests = isAdminLogin ? 50 : 100; // Increased to 50 to prevent Server Action crash loops during dev

    // Use a composite key for specific rate limiting buckets
    const rateKey = `${ip}_${isAdminLogin ? 'admin_login' : 'global'}`;
    let rateData = ipRequestCounts.get(rateKey);
    if (!rateData || now > rateData.resetTime) {
        rateData = { count: 1, resetTime: now + rateLimitWindow };
    } else {
        rateData.count++;
    }
    ipRequestCounts.set(rateKey, rateData);

    if (rateData.count > maxRequests) {
        console.warn(`[MIDDLEWARE-DEBUG] Rate limit exceeded for IP: ${ip} on path: ${request.nextUrl.pathname}`);
        return new NextResponse("Too Many Requests. Please slow down.", { status: 429 });
    }
    
    // Add debug log for admin login hits
    if (isAdminLogin) {
        console.log(`[MIDDLEWARE-DEBUG] Admin login hit. IP: ${ip}, Count: ${rateData.count}`);
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
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Admin Route Protection
    const isApi = request.nextUrl.pathname.startsWith('/api');
    const isAdmin = request.nextUrl.pathname.startsWith('/admin');
    const isMaintenancePage = request.nextUrl.pathname === '/maintenance';

    if (isAdmin && request.nextUrl.pathname !== '/admin/login') {
        let isAuthorized = false;

        if (user) {
            const { data: roleData } = await supabase
                .from('staff_roles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();
            
            if (roleData && ['Staff', 'Manager'].includes(roleData.role)) {
                isAuthorized = true;
            }
            
            // Allow simulated role ONLY if the user is authenticated (developer logging in with real account but simulated role)
            const simulatedRole = process.env.NEXT_PUBLIC_SIMULATE_ROLE;
            if (!isAuthorized && simulatedRole && ['Staff', 'Manager'].includes(simulatedRole) && process.env.NODE_ENV === 'development') {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            // Redirect unauthorized users
            return NextResponse.redirect(new URL(user ? '/' : '/admin/login', request.url));
        }
    }

    // 4. Maintenance Mode Check (Pillar 6)
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

    if (isMaintenanceMode && !isAdmin && !isApi && !isMaintenancePage) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }

    if (!isMaintenanceMode && isMaintenancePage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Force allow framing for the same origin (fixes Vercel Next.js default DENY on dynamic routes)
    supabaseResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
    supabaseResponse.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://deepraa-management-website.vercel.app http://localhost:3000;");

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
