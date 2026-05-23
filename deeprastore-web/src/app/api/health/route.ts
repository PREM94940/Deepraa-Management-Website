import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const startTime = Date.now();
        
        // Check Database Connectivity
        const { error } = await supabase.from('store_ui_settings').select('id').limit(1);
        
        const latency = Date.now() - startTime;
        
        if (error) {
            return NextResponse.json({
                status: 'degraded',
                error: error.message,
                latency: `${latency}ms`,
                timestamp: new Date().toISOString()
            }, { status: 503 });
        }

        return NextResponse.json({
            status: 'healthy',
            services: {
                database: 'connected',
                cms: 'operational'
            },
            latency: `${latency}ms`,
            timestamp: new Date().toISOString()
        }, { status: 200 });

    } catch (e: any) {
        return NextResponse.json({
            status: 'down',
            error: e.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
