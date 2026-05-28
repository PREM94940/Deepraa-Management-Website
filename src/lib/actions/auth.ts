"use server";

import { supabaseServer } from '../supabase-server';
import { logAuditAction } from '../audit';
import { createClient } from '../supabase-server-ssr';
import { StaffRole, PERMISSIONS } from '../auth';

export async function verifyAdminAccess(allowedRoles: StaffRole[], actionName: string) {
    const simulatedRole = process.env.NEXT_PUBLIC_SIMULATE_ROLE as StaffRole | undefined;
    if (simulatedRole) {
        const isAllowed = allowedRoles.includes(simulatedRole);
        if (!isAllowed) {
            throw new Error(`Unauthorized: Simulated Role '${simulatedRole}' cannot perform '${actionName}'. Required: ${allowedRoles.join(', ')}`);
        }
        return { allowed: true, role: simulatedRole, userId: "simulated-user-id" };
    }

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
        
        // If there is no active user logged in, check for local dev simulation
        if (userError || !user) {
            const simulatedRole = process.env.NEXT_PUBLIC_SIMULATE_ROLE as StaffRole | undefined;
            if (simulatedRole) {
                return { success: true, role: simulatedRole, email: 'simulated-admin@deeprastore.com' };
            }
            return { success: false, role: 'anonymous' as const, email: null };
        }

        // Look up verified user role in Supabase database
        const { data: roleData } = await supabaseServer
            .from('staff_roles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (roleData?.role) {
            return { success: true, role: roleData.role as StaffRole, email: user.email || '' };
        }

        // Fallback for developers if they are logged in but lack database roles
        const simulatedRole = process.env.NEXT_PUBLIC_SIMULATE_ROLE as StaffRole | undefined;
        if (simulatedRole) {
            return { success: true, role: simulatedRole, email: user.email || '' };
        }

        return { success: false, role: 'anonymous' as const, email: null };
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

export async function logSuspiciousLoginAction(email: string) {
    try {
        console.log("[PRODUCTION-LOG] logSuspiciousLoginAction:", email);
        await logAuditAction({
            tableName: 'auth_security',
            recordId: email || 'unknown',
            action: 'LOG_SUSPICIOUS_LOGIN',
            newData: { email, timestamp: new Date().toISOString() }
        });
        return { success: true };
    } catch (err: any) {
        console.error("[PRODUCTION-LOG] logSuspiciousLoginAction Failed:", err);
        return { success: false, error: err.message };
    }
}

export async function verifyGatekeyAction(gatekey: string) {
    try {
        const payload = {
            receivedLength: gatekey?.length,
            envHasGatekey: !!process.env.ADMIN_GATEKEY,
            envGatekeyLength: process.env.ADMIN_GATEKEY?.length
        };
        console.log("[PRODUCTION-LOG] verifyGatekeyAction START:", JSON.stringify(payload));
        
        const validGatekey = process.env.ADMIN_GATEKEY;
        
        if (!validGatekey) {
            console.log("[PRODUCTION-LOG] No ADMIN_GATEKEY in env, bypassing for safety fallback.");
            return { success: true, debug: payload };
        }
        
        if (gatekey === validGatekey) {
            console.log("[PRODUCTION-LOG] Match successful.");
            return { success: true, debug: payload };
        }
        
        console.log("[PRODUCTION-LOG] Match failed.");
        return { success: false, error: "Invalid Admin Gatekey", debug: payload };
    } catch (err: any) {
        console.error("[PRODUCTION-LOG] Exception caught:", err);
        return { success: false, error: `Server Exception: ${err.message}`, debug: { errorType: err.name, errorMessage: err.message } };
    }
}
