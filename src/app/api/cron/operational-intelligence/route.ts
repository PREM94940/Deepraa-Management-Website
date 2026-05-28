import { NextResponse } from 'next/server';
import { generateOperationalIntelligenceReport } from '@/lib/actions/cron';
import { captureOperationalError } from '@/lib/monitor';

const CRON_SECRET = process.env.CRON_SECRET || 'PLACEHOLDER_CRON_SECRET';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const result = await generateOperationalIntelligenceReport();
        return NextResponse.json(result);
    } catch (error: any) {
        const safeMessage = captureOperationalError(error, {
            classification: 'CRON_EXECUTION_FAILURE',
            actionName: 'operationalIntelligenceReport'
        });
        return new NextResponse(safeMessage, { status: 500 });
    }
}
