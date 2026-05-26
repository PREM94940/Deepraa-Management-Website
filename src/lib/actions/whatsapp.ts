"use server";

import { sendWhatsAppTemplateMessage } from '../whatsapp';
import { supabaseServer } from '../supabase-server';

export async function sendManualFollowUpAction(orderId: string) {
    try {
        // Fetch order and customer details
        const { data: order, error } = await supabaseServer
            .from('orders')
            .select('*, customers(full_name, phone_number)')
            .eq('id', orderId)
            .single();

        if (error || !order || !order.customers?.phone_number) {
            return { success: false, error: 'Could not fetch valid customer phone number.' };
        }

        // Send template message
        const result = await sendWhatsAppTemplateMessage({
            to: order.customers.phone_number,
            template: {
                templateName: 'order_follow_up',
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: order.customers.full_name.split(' ')[0] },
                            { type: 'text', text: order.order_number || order.id.substring(0,8) }
                        ]
                    }
                ]
            },
            orderId: order.id,
            triggerSource: 'MANUAL_ADMIN'
        });

        return result;
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
