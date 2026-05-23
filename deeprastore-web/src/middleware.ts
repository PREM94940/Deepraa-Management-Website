import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

    // 2. Maintenance Mode Check (Pillar 6)
    // We check an environment variable here for instant global kill-switch.
    // In production, this can be linked to Vercel Edge Config for zero-latency dynamic toggles.
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

    return NextResponse.next();
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
