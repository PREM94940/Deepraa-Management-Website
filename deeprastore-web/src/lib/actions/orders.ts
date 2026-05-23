"use server";

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../supabase-server';
import { OrderStatusUpdateSchema, DeleteItemsSchema } from '../validations';
import { logAuditAction } from '../audit';
import { sendWhatsAppTemplateMessage } from '../whatsapp';
import { verifyAdminAccess } from './auth';
import { PERMISSIONS } from '../auth';
import { captureOperationalError } from '../monitor';

export async function approveOrderAction(id: string) {
    // 1. Validate inputs
    const parsed = OrderStatusUpdateSchema.safeParse({ id, status: 'Confirmed', approval_status: 'Approved' });
    if (!parsed.success) return { success: false, error: parsed.error.message };

    try {
        await verifyAdminAccess(PERMISSIONS.CAN_APPROVE_ORDER, 'approveOrder');
        // Fetch old data for audit and WhatsApp notification
        const { data: oldData } = await supabaseServer.from('orders').select('*, customers(full_name, phone_number)').eq('id', id).single();

        const { error } = await supabaseServer
            .from('orders')
            .update({ approval_status: 'Approved', status: 'confirmed' })
            .eq('id', id);

        if (error) throw error;

        // Log audit
        await logAuditAction({
            tableName: 'orders',
            recordId: id,
            action: 'APPROVAL',
            oldData,
            newData: { approval_status: 'Approved', status: 'confirmed' }
        });

        // Trigger WhatsApp Notification
        if (oldData?.customers?.phone_number) {
            await sendWhatsAppTemplateMessage({
                to: oldData.customers.phone_number,
                template: {
                    templateName: 'order_confirmed',
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: oldData.customers.full_name.split(' ')[0] },
                                { type: 'text', text: oldData.order_number || id.substring(0,8) }
                            ]
                        }
                    ]
                },
                orderId: id,
                triggerSource: 'SYSTEM_AUTO'
            });
        }

        revalidatePath('/admin/orders');
        return { success: true };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'approveOrderAction',
            recordId: id
        });
        return { success: false, error: safeMessage };
    }
}

export async function deleteOrdersAction(ids: string[]) {
    const parsed = DeleteItemsSchema.safeParse({ ids });
    if (!parsed.success) return { success: false, error: parsed.error.message };

    try {
        await verifyAdminAccess(['Manager'], 'deleteOrders');
        for (const id of ids) {
            const { data: oldData } = await supabaseServer.from('orders').select('*').eq('id', id).single();
            await logAuditAction({
                tableName: 'orders',
                recordId: id,
                action: 'DELETE',
                oldData
            });
        }

        const { error } = await supabaseServer.from('orders').delete().in('id', ids);
        if (error) throw error;

        revalidatePath('/admin/orders');
        return { success: true };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'deleteOrdersAction',
            metadata: { ids }
        });
        return { success: false, error: safeMessage };
    }
}
