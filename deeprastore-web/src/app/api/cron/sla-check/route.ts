import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logAuditAction } from '@/lib/audit';
import { captureOperationalError } from '@/lib/monitor';

const CRON_SECRET = process.env.CRON_SECRET || 'PLACEHOLDER_CRON_SECRET';

export async function GET(request: Request) {
    // 1. Verify Vercel Cron Auth
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 2. Calculate 48 hours ago
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        // 3. Find all Open/In Progress complaints older than 48 hours
        const { data: breachedComplaints, error: fetchError } = await supabaseServer
            .from('complaints')
            .select('id, status, created_at')
            .in('status', ['Open', 'In Progress'])
            .lt('created_at', fortyEightHoursAgo);

        if (fetchError) throw fetchError;

        if (!breachedComplaints || breachedComplaints.length === 0) {
            return NextResponse.json({ success: true, escalated: 0, message: 'No SLA breaches found.' });
        }

        // 4. Escalate them to URGENT
        const escalatedIds = [];
        for (const complaint of breachedComplaints) {
            const { error: updateError } = await supabaseServer
                .from('complaints')
                .update({ status: 'URGENT' })
                .eq('id', complaint.id);

            if (!updateError) {
                escalatedIds.push(complaint.id);
                // 5. Audit log the escalation
                await logAuditAction({
                    tableName: 'complaints',
                    recordId: complaint.id,
                    action: 'UPDATE',
                    oldData: { status: complaint.status },
                    newData: { status: 'URGENT', note: 'SLA Auto-Escalation (48h breach)' },
                    adminId: 'system-cron'
                });
            }
        }

        // Optional VIP logic: If VIP customer, escalate immediately even if < 48h.
        // We can add that by querying customers with LTV > threshold and joining.

        return NextResponse.json({ 
            success: true, 
            escalated: escalatedIds.length,
            ids: escalatedIds
        });

    } catch (error: any) {
        const safeMessage = captureOperationalError(error, {
            classification: 'CRON_EXECUTION_FAILURE',
            actionName: 'slaCheckCron'
        });
        return new NextResponse(safeMessage, { status: 500 });
    }
}
