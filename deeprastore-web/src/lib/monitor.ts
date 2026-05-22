import * as Sentry from '@sentry/nextjs';

export type ErrorClassification = 
    | 'VALIDATION_FAILURE'
    | 'INFRASTRUCTURE_FAILURE'
    | 'WEBHOOK_FAILURE'
    | 'PERMISSION_FAILURE'
    | 'REFUND_PIPELINE_FAILURE'
    | 'CRON_EXECUTION_FAILURE'
    | 'UNKNOWN_FAILURE';

export interface OperationalErrorContext {
    classification: ErrorClassification;
    actionName: string;
    recordId?: string;
    metadata?: Record<string, any>;
}

/**
 * Aggressively sanitizes payloads to prevent PII exposure in logs.
 * Redacts emails, phones, payment IDs, passwords, and tracking numbers.
 */
function sanitizeData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'string') {
        // Redact email
        if (data.includes('@')) return '[REDACTED_EMAIL]';
        // Redact phone numbers (basic heuristic: 10+ digits or starting with +)
        if (/^\+?[0-9\s-]{10,20}$/.test(data)) return '[REDACTED_PHONE]';
        // Redact Razorpay/Payment IDs
        if (data.startsWith('pay_') || data.startsWith('order_')) return '[REDACTED_PAYMENT_ID]';
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    if (typeof data === 'object') {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            if (
                lowerKey.includes('email') ||
                lowerKey.includes('phone') ||
                lowerKey.includes('password') ||
                lowerKey.includes('token') ||
                lowerKey.includes('secret') ||
                lowerKey.includes('address') ||
                lowerKey.includes('tracking')
            ) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = sanitizeData(value);
            }
        }
        return sanitized;
    }

    return data;
}

/**
 * Captures an operational error, sanitizes its context, and sends it to Sentry.
 * Returns a safe error message for the client.
 */
export function captureOperationalError(error: unknown, context: OperationalErrorContext): string {
    const sanitizedMetadata = sanitizeData(context.metadata || {});
    
    let errorMessage = 'An unknown operational error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    console.error(`[${context.classification}] ${context.actionName} - ${errorMessage}`, sanitizedMetadata);

    Sentry.withScope((scope) => {
        scope.setTag('classification', context.classification);
        scope.setTag('action', context.actionName);
        if (context.recordId) scope.setTag('record_id', context.recordId);
        
        scope.setContext('operational_data', sanitizedMetadata);
        
        Sentry.captureException(error instanceof Error ? error : new Error(errorMessage));
    });

    // We do NOT return the raw error trace to the user to prevent data leakage.
    // However, if it's a known validation or permission error, it's safe to return.
    if (context.classification === 'VALIDATION_FAILURE' || context.classification === 'PERMISSION_FAILURE' || context.classification === 'REFUND_PIPELINE_FAILURE') {
        return errorMessage;
    }

    return 'An internal operational error occurred and has been reported to engineering.';
}
