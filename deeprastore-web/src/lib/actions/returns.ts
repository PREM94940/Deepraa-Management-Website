"use server";

import { supabaseServer } from '../supabase-server';
import { logAuditAction } from '../audit';
import { captureOperationalError } from '../monitor';

// Normalize phone helper
function normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
}

export async function trackOrderPublicAction(orderIdOrNumber: string, phoneOrEmail: string) {
    if (!orderIdOrNumber || !phoneOrEmail) {
        return { success: false, error: "Order reference and contact information are required." };
    }

    try {
        const query = supabaseServer
            .from('orders')
            .select('*, customers(id, full_name, phone_number, email)');

        // Check if input is UUID-like
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderIdOrNumber);

        let data;
        let error;

        if (isUuid) {
            const res = await query.eq('id', orderIdOrNumber).maybeSingle();
            data = res.data;
            error = res.error;
        } else {
            const res = await query.eq('order_number', orderIdOrNumber.trim()).maybeSingle();
            data = res.data;
            error = res.error;
        }

        if (error) throw error;
        if (!data || !data.customers) {
            return { success: false, error: "Order not found. Please double-check your Order ID / Number." };
        }

        // Verify phone or email ownership
        const orderPhone = normalizePhone(data.customers.phone_number || '');
        const searchPhone = normalizePhone(phoneOrEmail);
        const orderEmail = (data.customers.email || '').toLowerCase().trim();
        const searchEmail = phoneOrEmail.toLowerCase().trim();

        const phoneMatch = searchPhone.length > 0 && orderPhone.includes(searchPhone);
        const emailMatch = searchEmail.length > 0 && orderEmail === searchEmail;

        if (!phoneMatch && !emailMatch) {
            return { success: false, error: "Verification failed. The contact details provided do not match this order." };
        }

        // Also fetch active complaints (returns) if any exist
        const { data: complaints } = await supabaseServer
            .from('complaints')
            .select('*')
            .eq('order_id', data.id)
            .order('created_at', { ascending: false });

        return { 
            success: true, 
            order: data,
            activeReturn: complaints && complaints.length > 0 ? complaints[0] : null
        };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'trackOrderPublicAction',
            metadata: { orderIdOrNumber, phoneOrEmail }
        });
        return { success: false, error: safeMessage };
    }
}

export async function lookupOrdersByPhoneAction(phoneOrEmail: string) {
    if (!phoneOrEmail) {
        return { success: false, error: "Phone number or email is required." };
    }

    try {
        const isEmail = phoneOrEmail.includes('@');
        let customerData;

        if (isEmail) {
            const { data, error } = await supabaseServer
                .from('customers')
                .select('id, full_name, phone_number, email')
                .eq('email', phoneOrEmail.toLowerCase().trim())
                .maybeSingle();
            if (error) throw error;
            customerData = data;
        } else {
            const normalized = normalizePhone(phoneOrEmail);
            const { data, error } = await supabaseServer
                .from('customers')
                .select('id, full_name, phone_number, email')
                .eq('phone_number', normalized)
                .maybeSingle();
            if (error) throw error;
            customerData = data;
        }

        if (!customerData) {
            return { success: false, error: "No customer account found matching those details." };
        }

        const { data: orders, error: ordersErr } = await supabaseServer
            .from('orders')
            .select('*, customers(full_name, phone_number, email)')
            .eq('customer_id', customerData.id)
            .order('created_at', { ascending: false });

        if (ordersErr) throw ordersErr;

        return { success: true, orders: orders || [] };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'lookupOrdersByPhoneAction',
            metadata: { phoneOrEmail }
        });
        return { success: false, error: safeMessage };
    }
}

export async function submitReturnRequestAction(payload: {
    orderId: string;
    phone: string;
    issueType: 'Replacement' | 'Refund' | 'Alteration' | 'Other';
    reason: string;
    resolution: string;
}) {
    const { orderId, phone, issueType, reason, resolution } = payload;
    if (!orderId || !phone || !issueType || !reason || !resolution) {
        return { success: false, error: "All return details are required." };
    }

    try {
        // Fetch order to verify
        const { data: order, error } = await supabaseServer
            .from('orders')
            .select('*, customers(id, phone_number, email)')
            .eq('id', orderId)
            .maybeSingle();

        if (error) throw error;
        if (!order || !order.customers) {
            return { success: false, error: "Order verification failed. Order not found." };
        }

        // Verify ownership
        const orderPhone = normalizePhone(order.customers.phone_number || '');
        const searchPhone = normalizePhone(phone);
        if (!orderPhone.includes(searchPhone)) {
            return { success: false, error: "Verification failed. Contact number does not match this order." };
        }

        // Create complaint (Return request)
        const issueReasonCombined = `[Resolution: ${resolution}] ${reason}`;
        const { data: inserted, error: insertError } = await supabaseServer
            .from('complaints')
            .insert({
                order_id: orderId,
                customer_id: order.customer_id,
                issue_type: issueType,
                issue_reason: issueReasonCombined,
                status: 'Open'
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Log audit
        await logAuditAction({
            tableName: 'complaints',
            recordId: inserted.id,
            action: 'CUSTOMER_RETURN_REQUEST',
            newData: { order_id: orderId, issue_type: issueType, issue_reason: issueReasonCombined }
        });

        return { success: true };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'submitReturnRequestAction',
            metadata: { payload }
        });
        return { success: false, error: safeMessage };
    }
}
