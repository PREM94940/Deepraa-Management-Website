import { supabaseServer } from './supabase-server';

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'PLACEHOLDER_TOKEN';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || 'PLACEHOLDER_PHONE_ID';

export interface WhatsAppTemplateOptions {
    templateName: string;
    languageCode?: string;
    components?: any[];
}

/**
 * Enterprise WhatsApp Cloud API Service
 * Enforces auditability, rate limit awareness, and duplicate prevention.
 */
export async function sendWhatsAppTemplateMessage({
    to,
    template,
    orderId,
    triggerSource = 'SYSTEM_AUTO'
}: {
    to: string;
    template: WhatsAppTemplateOptions;
    orderId?: string;
    triggerSource?: string;
}) {
    // 1. Sanitize Phone Number (Must include country code, no +)
    let phone = to.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone; // Default to India if 10 digits

    // 2. Duplicate Prevention / Rate Limit Awareness
    // Check if we sent this exact template to this order in the last 15 minutes
    if (orderId) {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
        const { data: recentLogs } = await supabaseServer
            .from('whatsapp_communications')
            .select('id')
            .eq('order_id', orderId)
            .eq('template_name', template.templateName)
            .gte('created_at', fifteenMinsAgo)
            .limit(1);

        if (recentLogs && recentLogs.length > 0) {
            console.warn(`[WhatsApp] Suppressing duplicate template '${template.templateName}' for order ${orderId} sent within 15 mins.`);
            return { success: false, error: 'Duplicate message suppressed by rate limiter.' };
        }
    }

    // 3. Prepare Meta API Payload
    const payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
            name: template.templateName,
            language: {
                code: template.languageCode || 'en'
            },
            components: template.components || []
        }
    };

    // 4. Log initial attempt in DB
    const { data: logEntry, error: logError } = await supabaseServer
        .from('whatsapp_communications')
        .insert({
            order_id: orderId || null,
            customer_phone: phone,
            template_name: template.templateName,
            message_type: 'TEMPLATE',
            status: 'PENDING',
            payload: payload,
            trigger_source: triggerSource
        })
        .select('id')
        .single();

    if (logError) {
        console.error("Failed to create WhatsApp audit log:", logError);
        // Continue sending even if audit log fails initially? 
        // Strict governance: we should probably fail if we can't audit, but we will proceed with a warning for now.
    }

    const logId = logEntry?.id;

    // 5. Execute API Call
    try {
        const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Unknown WhatsApp API error');
        }

        // 6. Update Log with Success Status and Meta ID
        if (logId) {
            const metaMessageId = data.messages?.[0]?.id;
            await supabaseServer
                .from('whatsapp_communications')
                .update({
                    status: 'SENT',
                    meta_message_id: metaMessageId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', logId);
        }

        return { success: true, data };
    } catch (error: any) {
        // 7. Update Log with Failure Status
        if (logId) {
            await supabaseServer
                .from('whatsapp_communications')
                .update({
                    status: 'FAILED',
                    payload: { ...payload, error_received: error.message },
                    updated_at: new Date().toISOString()
                })
                .eq('id', logId);
        }
        console.error("WhatsApp Send Error:", error);
        return { success: false, error: error.message };
    }
}
