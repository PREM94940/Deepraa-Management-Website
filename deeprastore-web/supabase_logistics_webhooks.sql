-- Deeprastore Logistics Webhook & Return Tracking Schema

-- 1. Add return tracking fields to existing orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS return_tracking_number VARCHAR,
ADD COLUMN IF NOT EXISTS return_status VARCHAR DEFAULT 'Not Applicable' CHECK (return_status IN ('Not Applicable', 'Pending', 'In Transit', 'Received', 'Exception'));

-- 2. Create Webhook Events Table for Idempotency and Auditability
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR NOT NULL,          -- e.g., 'shiprocket', 'delhivery'
    event_type VARCHAR NOT NULL,        -- e.g., 'return_delivered'
    tracking_number VARCHAR NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure idempotency per provider + event + tracking number
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_idempotency ON public.webhook_events (provider, event_type, tracking_number);

-- Enable RLS on webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for service role" ON public.webhook_events FOR ALL USING (true);
