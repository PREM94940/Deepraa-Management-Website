import { supabaseServer } from './supabase-server';
import { logAuditAction } from './audit';
import { createClient } from './supabase-server-ssr';
export type StaffRole = 'Manager' | 'Staff';

// Centralized Permission Governance
export const PERMISSIONS = {
    // Products
    CAN_EDIT_PRICE: ['Manager'] as StaffRole[],
    CAN_EDIT_INVENTORY: ['Manager', 'Staff'] as StaffRole[],
    CAN_BULK_IMPORT: ['Manager'] as StaffRole[],
    
    // Orders
    CAN_APPROVE_ORDER: ['Manager', 'Staff'] as StaffRole[],
    CAN_PROCESS_REFUND: ['Manager'] as StaffRole[],
    CAN_UPDATE_SHIPPING: ['Manager', 'Staff'] as StaffRole[],
    
    // Complaints
    CAN_ADD_NOTES: ['Manager', 'Staff'] as StaffRole[],
    CAN_RESOLVE_REFUND_COMPLAINT: ['Manager'] as StaffRole[],
    CAN_ESCALATE_COMPLAINT: ['Manager', 'Staff'] as StaffRole[],
};

export async function verifyAdminAccess(allowedRoles: StaffRole[], actionName: string) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        throw new Error("Unauthorized: Invalid or missing session");
    }

    const { data: roleData } = await supabaseServer
        .from('staff_roles')
        .select('role')
        .eq('id', user.id)
        .single();
        
    const userRole = (roleData?.role as StaffRole) || 'Staff';
    const userId = user.id;

    const isAllowed = allowedRoles.includes(userRole);

    if (!isAllowed) {
        // Record the unauthorized access attempt safely before throwing.
        await logAuditAction({
            tableName: 'auth_security',
            recordId: userId,
            action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            newData: { attemptedAction: actionName, userRole, requiredRoles: allowedRoles }
        });
        throw new Error(`Unauthorized: Role '${userRole}' cannot perform '${actionName}'. Required: ${allowedRoles.join(', ')}`);
    }

    return { allowed: true, role: userRole, userId };
}
