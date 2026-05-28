import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const HAS_AI = !!process.env.OPENAI_API_KEY;

export async function generateTicketSummary(ticketHistory: any[]) {
    if (!HAS_AI) {
        // Fallback simulated AI response for development without API keys
        return {
            summary: "AI SUMMARIZER MOCK:\n- Customer is frustrated about delivery delay.\n- Mentioned they need it before the 24th.\n- Has been waiting for 3 days for an update.",
            suggestedPriority: "High" as const
        };
    }

    const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
            summary: z.string().describe("A concise 3-bullet point summary of the customer issue."),
            suggestedPriority: z.enum(['Low', 'Medium', 'High']).describe("Suggested priority based on customer urgency and emotion.")
        }),
        prompt: `Summarize the following support ticket history:\n\n${JSON.stringify(ticketHistory)}`
    });

    return object;
}

export async function generateConciergeDraft(customerName: string, orderDetails: any, issueType: string) {
    if (!HAS_AI) {
        return `Dear ${customerName}, I wanted to personally reach out regarding your order (${orderDetails.id}). We are currently investigating the issue with your ${issueType} and our Master Tailor will provide an update shortly. Please let me know if you need immediate assistance. - Deeprastore Concierge`;
    }

    const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `You are the Deeprastore Luxury Concierge. Draft a highly empathetic, premium WhatsApp message for a customer named ${customerName}. 
        Order details: ${JSON.stringify(orderDetails)}. 
        Issue: ${issueType}.
        Keep it under 3 sentences. Assure them we are handling it. Do not invent facts.`
    });

    return text;
}
