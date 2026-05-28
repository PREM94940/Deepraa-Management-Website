"use server";

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../supabase-server';
import { verifyAdminAccess } from './auth';
import { PERMISSIONS } from '../auth';
import { logAuditAction } from '../audit';
import { captureOperationalError } from '../monitor';
import { generateTicketSummary, generateConciergeDraft } from '../ai-assistant';

export async function createTicketSummaryAction(ticketId: string) {
    try {
        const { userId } = await verifyAdminAccess(PERMISSIONS.CAN_ADD_NOTES, 'createTicketSummary');
        
        // Fetch ticket data
        const { data: ticket } = await supabaseServer
            .from('support_tickets')
            .select('*, customers(full_name)')
            .eq('id', ticketId)
            .single();
            
        if (!ticket) throw new Error("Ticket not found");
        
        // Mocking ticket history based on description for the summary
        const history = [
            { role: 'customer', text: ticket.description },
            { role: 'system', text: `Category: ${ticket.category}, Status: ${ticket.status}` }
        ];
        
        const aiResponse = await generateTicketSummary(history);
        
        // Log to ai_suggestions
        const { data: suggestion, error } = await supabaseServer
            .from('ai_suggestions')
            .insert({
                context_type: 'Ticket_Summary',
                context_id: ticketId,
                generated_content: aiResponse,
                status: 'Pending',
                model_used: 'gpt-4o-mini' // Assuming it from ai-assistant
            })
            .select()
            .single();
            
        if (error) throw error;
        
        await logAuditAction({
            tableName: 'ai_suggestions',
            recordId: suggestion.id,
            action: 'INSERT',
            newData: suggestion,
            adminId: userId
        });
        
        revalidatePath('/admin/support');
        return { success: true, suggestion };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'createTicketSummaryAction',
            recordId: ticketId
        });
        return { success: false, error: safeMessage };
    }
}

export async function createConciergeDraftAction(complaintId: string, orderId: string, customerName: string, issueType: string) {
    try {
        const { userId } = await verifyAdminAccess(PERMISSIONS.CAN_ADD_NOTES, 'createConciergeDraft');
        
        // Minimal order details fetch for context
        const { data: order } = await supabaseServer.from('orders').select('id, status, return_status').eq('id', orderId).single();
        
        const draftText = await generateConciergeDraft(customerName, order || { id: orderId }, issueType);
        
        const { data: suggestion, error } = await supabaseServer
            .from('ai_suggestions')
            .insert({
                context_type: 'WhatsApp_Draft',
                context_id: complaintId,
                generated_content: { text: draftText },
                status: 'Pending',
                model_used: 'gpt-4o-mini'
            })
            .select()
            .single();
            
        if (error) throw error;
        
        await logAuditAction({
            tableName: 'ai_suggestions',
            recordId: suggestion.id,
            action: 'INSERT',
            newData: suggestion,
            adminId: userId
        });
        
        revalidatePath('/admin/complaints');
        return { success: true, suggestion };
    } catch (err: any) {
        const safeMessage = captureOperationalError(err, {
            classification: 'INFRASTRUCTURE_FAILURE',
            actionName: 'createConciergeDraftAction',
            recordId: complaintId
        });
        return { success: false, error: safeMessage };
    }
}

export async function reviewAiSuggestionAction(suggestionId: string, newStatus: 'Approved' | 'Rejected', finalContent?: any, rejectedReason?: string) {
    try {
        const { userId } = await verifyAdminAccess(PERMISSIONS.CAN_ADD_NOTES, 'reviewAiSuggestion');
        
        const { data: oldData } = await supabaseServer.from('ai_suggestions').select('*').eq('id', suggestionId).single();
        if (!oldData) throw new Error("Suggestion not found");
        
        let edited = false;
        if (finalContent && JSON.stringify(finalContent) !== JSON.stringify(oldData.generated_content)) {
            edited = true;
        }

        const updatePayload: any = { 
            status: newStatus,
            updated_at: new Date().toISOString(),
            reviewed_by: userId
        };

        if (newStatus === 'Approved') {
            updatePayload.approved_at = new Date().toISOString();
        } else if (newStatus === 'Rejected') {
            updatePayload.rejected_reason = rejectedReason || 'Manually rejected by staff';
        }
        
        if (finalContent) {
            updatePayload.human_modified_content = finalContent;
            updatePayload.edited_before_send = edited;
        }
        
        const { error } = await supabaseServer
            .from('ai_suggestions')
            .update(updatePayload)
            .eq('id', suggestionId);
            
        if (error) throw error;
        
        // Governance Audit Log for AI Action!
        await logAuditAction({
            tableName: 'ai_suggestions',
            recordId: suggestionId,
            action: newStatus === 'Approved' ? 'UPDATE' : 'DELETE',
            oldData,
            newData: { ...updatePayload, review_event: true, edited_before_send: edited },
            adminId: userId
        });
        
        revalidatePath('/admin/support');
        revalidatePath('/admin/complaints');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
