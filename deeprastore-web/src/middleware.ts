import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Simple check to ensure we only protect admin routes
    if (pathname.startsWith('/admin')) {
        // Check if there is an auth token in cookies.
        // Supabase stores cookies in chunks like sb-xxxx-auth-token.0 or sb-xxxx-auth-token
        const hasSession = request.cookies.getAll().some(cookie => cookie.name.includes('-auth-token'));
        
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
