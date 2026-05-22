import crypto from 'crypto';

export type LogisticsProvider = 'shiprocket' | 'delhivery' | 'generic';
export type InternalReturnStatus = 'Pending' | 'In Transit' | 'Received' | 'Exception';

export interface ParsedLogisticsWebhook {
    provider: LogisticsProvider;
    trackingNumber: string;
    internalStatus: InternalReturnStatus;
    rawStatus: string;
    timestamp: string;
}

// Map provider-specific status codes to our internal normalized statuses
const STATUS_MAPS: Record<LogisticsProvider, Record<string, InternalReturnStatus>> = {
    shiprocket: {
        'AWB ASSIGNED': 'Pending',
        'OUT FOR PICKUP': 'In Transit',
        'IN TRANSIT': 'In Transit',
        'DELIVERED': 'Received',
        'RETURNED': 'Received',
        'EXCEPTION': 'Exception'
    },
    delhivery: {
        'Manifested': 'Pending',
        'In Transit': 'In Transit',
        'Delivered': 'Received',
        'RTO': 'Received'
    },
    generic: {}
};

/**
 * Validates the cryptographic signature of the webhook if the provider supports it.
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!secret) return false;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Parses an incoming webhook payload based on the provider format.
 */
export function parseLogisticsPayload(provider: LogisticsProvider, payload: any): ParsedLogisticsWebhook {
    if (provider === 'shiprocket') {
        // Example Shiprocket structure
        const rawStatus = payload.current_status || 'UNKNOWN';
        const internalStatus = STATUS_MAPS.shiprocket[rawStatus] || 'Exception';
        return {
            provider,
            trackingNumber: payload.awb || '',
            internalStatus,
            rawStatus,
            timestamp: new Date().toISOString()
        };
    }
    
    // Add additional providers here in the future
    throw new Error(`Unsupported logistics provider: ${provider}`);
}
