"use server";

import { supabaseServer } from '../supabase-server';
import { logAuditAction } from '../audit';
import { createClient } from '../supabase-server-ssr';
import { StaffRole, PERMISSIONS } from '../auth';

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

export async function getCurrentUserRoleAction() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, role: 'anonymous' as const, email: null };
        }

        const { data: roleData } = await supabaseServer
            .from('staff_roles')
            .select('role')
            .eq('id', user.id)
            .single();

        const userRole = (roleData?.role as StaffRole) || 'Staff';
        return { success: true, role: userRole, email: user.email || '' };
    } catch (err) {
        return { success: false, role: 'anonymous' as const, email: null };
    }
}

export async function grantManagerRoleAction() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { success: false, error: "No active user session found" };
        }

        const { data, error } = await supabaseServer
            .from('staff_roles')
            .upsert({
                id: user.id,
                email: user.email || 'admin@deeprastore.com',
                role: 'Manager'
            })
            .select();

        if (error) throw error;
        return { success: true, role: 'Manager' };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
