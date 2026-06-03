import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Verification for Meta API webhook setup
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse('Forbidden', { status: 403 });
}

// Handling inbound messages or status updates from WhatsApp
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Check if this is a WhatsApp API event
        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = body.entry[0].changes[0].value.messages[0].from; 
                const msgBody = body.entry[0].changes[0].value.messages[0].text.body;

                // TODO: Pipe to Deeprastore internal ticket/support system based on DATA_DICTIONARY.md
                console.log(`Received WhatsApp message from ${from}: ${msgBody}`);
            }
            
            return new NextResponse('EVENT_RECEIVED', { status: 200 });
        } else {
            return new NextResponse('Not Found', { status: 404 });
        }
    } catch (error) {
        console.error("WhatsApp Webhook Error:", error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
