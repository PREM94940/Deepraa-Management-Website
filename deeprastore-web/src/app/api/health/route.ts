import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { env } from '@/lib/env'; // Ensures env is loaded
import { captureOperationalError } from '@/lib/monitor';

export async function GET() {
    try {
        // 1. Check Database Connectivity (Lightweight query)
        // We query the limit of 1 from a core table to verify read access and DB uptime.
        const { error: dbError } = await supabaseServer.from('products').select('id').limit(1);
        
        if (dbError) {
            throw new Error(`Database connectivity failure: ${dbError.message}`);
        }

        // 2. Environment Verification
        // If we reach here, `env` is successfully validated.
        const isProductionReady = process.env.NODE_ENV === 'production' 
            ? Boolean(env.CRON_SECRET && env.SUPABASE_SERVICE_ROLE_KEY)
            : true;

        if (!isProductionReady) {
            throw new Error("Environment is marked production but missing strict secrets.");
        }

        // Return sanitized health state
        return NextResponse.json({
            status: 'healthy',
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            checks: {
                database: 'ok',
                environmentVariables: 'ok'
            }
        }, { status: 200 });

    } catch (error: any) {
        // We do NOT leak the exact error message to the public endpoint.
        // We log it internally via Sentry.
        captureOperationalError(error, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'healthCheck'
        });

        return NextResponse.json({
            status: 'degraded',
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        }, { status: 503 }); // 503 Service Unavailable triggers monitoring alerts
    }
}
