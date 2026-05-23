import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Simple check to ensure we only protect admin routes
    if (pathname.startsWith('/admin')) {
        // Check if there is an auth token in cookies.
        // Note: For a true Supabase SSR setup, use @supabase/ssr.
        // Since we are migrating to ERP, we will block unauthenticated users.
        const hasSession = request.cookies.has('sb-access-token') || request.cookies.has('supabase-auth-token');
        
        // Enforce authentication for admin routes.
        if (!hasSession) {
             return NextResponse.redirect(new URL('/account', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
