import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { parseLogisticsPayload, verifyWebhookSignature, LogisticsProvider } from '@/lib/logistics';
import { logAuditAction } from '@/lib/audit';
import { captureOperationalError } from '@/lib/monitor';

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-shiprocket-signature') || '';
        const providerStr = req.nextUrl.searchParams.get('provider') || 'shiprocket';
        const provider = providerStr as LogisticsProvider;

        // Security: Verify payload authenticity (strict enforcement)
        const secret = process.env.LOGISTICS_WEBHOOK_SECRET;
        
        if (!secret) {
            await logAuditAction({
                tableName: 'webhook_events',
                recordId: 'SYSTEM',
                action: 'WEBHOOK_FAILURE',
                newData: { error: 'Missing LOGISTICS_WEBHOOK_SECRET configuration' }
            });
            return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
        }

        if (!verifyWebhookSignature(rawBody, signature, secret)) {
            await logAuditAction({
                tableName: 'webhook_events',
                recordId: 'SYSTEM',
                action: 'WEBHOOK_UNAUTHORIZED',
                newData: { error: 'Invalid logistics webhook signature provided', provider }
            });
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const parsed = parseLogisticsPayload(provider, payload);

        if (!parsed.trackingNumber) {
            return NextResponse.json({ error: 'Missing tracking number' }, { status: 400 });
        }

        // Idempotency check
        const { data: existingEvent } = await supabaseServer
            .from('webhook_events')
            .select('id')
            .eq('provider', provider)
            .eq('event_type', parsed.rawStatus)
            .eq('tracking_number', parsed.trackingNumber)
            .single();

        if (existingEvent) {
            return NextResponse.json({ message: 'Webhook already processed' }, { status: 200 });
        }

        // Log the webhook event
        await supabaseServer.from('webhook_events').insert({
            provider,
            event_type: parsed.rawStatus,
            tracking_number: parsed.trackingNumber,
            payload,
            processed: true
        });

        // Map it to the specific order
        // In a real ERP, tracking numbers might be mapped to shipments which belong to orders.
        // For Deeprastore, we added `return_tracking_number` to `orders`.
        const { data: orderData } = await supabaseServer
            .from('orders')
            .select('id, return_status')
            .eq('return_tracking_number', parsed.trackingNumber)
            .single();

        if (orderData) {
            await supabaseServer
                .from('orders')
                .update({ return_status: parsed.internalStatus })
                .eq('id', orderData.id);

            await logAuditAction({
                tableName: 'orders',
                recordId: orderData.id,
                action: 'LOGISTICS_UPDATE',
                oldData: { return_status: orderData.return_status },
                newData: { return_status: parsed.internalStatus, trackingNumber: parsed.trackingNumber, provider }
            });
        }

        return NextResponse.json({ success: true, status: parsed.internalStatus });

    } catch (error: any) {
        const providerStr = req.nextUrl.searchParams.get('provider') || 'unknown';
        const safeMessage = captureOperationalError(error, {
            classification: 'WEBHOOK_FAILURE',
            actionName: 'logisticsWebhook',
            metadata: { provider: providerStr }
        });
        return NextResponse.json({ error: safeMessage }, { status: 500 });
    }
}
