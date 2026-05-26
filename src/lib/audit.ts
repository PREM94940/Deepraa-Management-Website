import { supabaseServer } from './supabase-server';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'APPROVAL' | 'LOGISTICS_UPDATE' | 'UNAUTHORIZED_ACCESS_ATTEMPT' | 'MANUAL_REFUND_OVERRIDE' | 'CUSTOMER_RETURN_REQUEST';

export async function logAuditAction({
    tableName,
    recordId,
    action,
    oldData = null,
    newData = null,
    adminId = 'system' // In a real app with Auth, extract from session
}: {
    tableName: string;
    recordId: string;
    action: AuditAction;
    oldData?: any;
    newData?: any;
    adminId?: string;
}) {
    try {
        const { error } = await supabaseServer
            .from('audit_logs')
            .insert({
                table_name: tableName,
                record_id: recordId,
                action: action,
                old_data: oldData,
                new_data: newData,
                admin_id: adminId
            });

        if (error) {
            console.error('Failed to write audit log:', error);
            // We intentionally do not throw here to prevent breaking the main transaction
            // just because logging failed, but in a strict financial environment we might.
        }
    } catch (err) {
        console.error('Audit logging exception:', err);
    }
}
