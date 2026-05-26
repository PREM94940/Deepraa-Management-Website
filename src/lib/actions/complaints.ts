"use server";

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../supabase-server';
import { ComplaintInsertSchema, ComplaintUpdateSchema } from '../validations';
import { logAuditAction } from '../audit';
import { verifyAdminAccess } from './auth';
import { PERMISSIONS } from '../auth';
import { captureOperationalError } from '../monitor';
import { z } from 'zod';

export async function createComplaintAction(data: z.infer<typeof ComplaintInsertSchema>) {
    const parsed = ComplaintInsertSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.message };

    try {
        await verifyAdminAccess(PERMISSIONS.CAN_ADD_NOTES, 'createComplaint');
        const { data: insertedData, error } = await supabaseServer
            .from('complaints')
            .insert([parsed.data])
            .select('id')
            .single();
            
        if (error) throw error;

        await logAuditAction({
            tableName: 'complaints',
            recordId: insertedData.id,
            action: 'INSERT',
            newData: parsed.data
        });

        revalidatePath('/admin/complaints');
        return { success: true };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'createComplaintAction',
            metadata: { data }
        });
        return { success: false, error: safeMessage };
    }
}

export async function updateComplaintStatusAction(id: string, status: string, resolution_notes?: string, forceOverride: boolean = false) {
    const parsed = ComplaintUpdateSchema.safeParse({ id, status, resolution_notes });
    if (!parsed.success) return { success: false, error: parsed.error.message };

    try {
        const { data: oldData } = await supabaseServer.from('complaints').select('*, orders(return_status)').eq('id', id).single();
        
        // Advanced RBAC & Logistics Gatekeeper: Only Managers can resolve Refunds
        if (oldData?.issue_type === 'Refund' && (status === 'Resolved' || status === 'Closed')) {
            await verifyAdminAccess(PERMISSIONS.CAN_RESOLVE_REFUND_COMPLAINT, 'resolveRefundComplaint');
            
            // Logistics Verification
            const returnStatus = oldData?.orders?.return_status || 'Not Applicable';
            if (returnStatus !== 'Received' && !forceOverride) {
                throw new Error(`Refund Blocked: Physical return has not been received. Current logistics status: ${returnStatus}. To proceed anyway, use the manual override.`);
            }
            
            if (forceOverride) {
                // Log the override specifically
                await logAuditAction({
                    tableName: 'complaints',
                    recordId: id,
                    action: 'MANUAL_REFUND_OVERRIDE',
                    oldData: { return_status: returnStatus },
                    newData: { override_applied_by_role: 'Manager' }
                });
            }
        } else {
            await verifyAdminAccess(PERMISSIONS.CAN_ESCALATE_COMPLAINT, 'updateComplaint');
        }
        
        const updatePayload: any = { status };
        if (resolution_notes) updatePayload.resolution_notes = resolution_notes;

        const { error } = await supabaseServer
            .from('complaints')
            .update(updatePayload)
            .eq('id', id);

        if (error) throw error;

        await logAuditAction({
            tableName: 'complaints',
            recordId: id,
            action: 'UPDATE',
            oldData,
            newData: updatePayload
        });

        revalidatePath('/admin/complaints');
        return { success: true };
    } catch (err: any) {
        // If it was our explicit refund block, classify it accordingly
        const isRefundBlock = err.message && err.message.includes('Refund Blocked');
        const safeMessage = captureOperationalError(err, {
            classification: isRefundBlock ? 'REFUND_PIPELINE_FAILURE' : 'INFRASTRUCTURE_FAILURE',
            actionName: 'updateComplaintStatusAction',
            recordId: id,
            metadata: { status, resolution_notes, forceOverride }
        });
        return { success: false, error: safeMessage };
    }
}
