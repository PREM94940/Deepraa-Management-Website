import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { captureOperationalError } from '@/lib/monitor';

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'PLACEHOLDER_VERIFY_TOKEN';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    const value = change.value;

                    // 1. Handle Status Updates (Sent, Delivered, Read, Failed)
                    if (value.statuses && value.statuses.length > 0) {
                        for (const status of value.statuses) {
                            const metaMessageId = status.id;
                            const newStatus = status.status.toUpperCase(); // SENT, DELIVERED, READ, FAILED
                            
                            // Update our audit log
                            await supabaseServer
                                .from('whatsapp_communications')
                                .update({ 
                                    status: newStatus,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('meta_message_id', metaMessageId);
                        }
                    }

                    // 2. Handle Incoming Messages (Customer Replies)
                    if (value.messages && value.messages.length > 0) {
                        for (const message of value.messages) {
                            // In a full CRM, we would route this to a unified inbox or WhatsApp Chat table.
                            // For now, we log it to audit logs with type INBOUND.
                            await supabaseServer
                                .from('whatsapp_communications')
                                .insert({
                                    customer_phone: message.from,
                                    message_type: 'INBOUND',
                                    status: 'RECEIVED',
                                    meta_message_id: message.id,
                                    payload: message,
                                    trigger_source: 'CUSTOMER'
                                });
                        }
                    }
                }
            }
            return new NextResponse('EVENT_RECEIVED', { status: 200 });
        } else {
            return new NextResponse('Not Found', { status: 404 });
        }
    } catch (error: any) {
        const safeMessage = captureOperationalError(error, {
            classification: 'WEBHOOK_FAILURE',
            actionName: 'whatsappWebhook'
        });
        return new NextResponse(safeMessage, { status: 500 });
    }
}
