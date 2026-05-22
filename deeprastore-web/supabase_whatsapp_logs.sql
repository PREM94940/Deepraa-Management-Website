-- Deeprastore WhatsApp Communications Log

CREATE TABLE IF NOT EXISTS public.whatsapp_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_phone VARCHAR NOT NULL,
    template_name VARCHAR,
    message_type VARCHAR NOT NULL, -- e.g., 'TEMPLATE', 'TEXT'
    status VARCHAR NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, DELIVERED, READ, FAILED
    meta_message_id VARCHAR, -- The Message ID returned by Meta Cloud API
    payload JSONB, -- The exact payload sent or error received
    trigger_source VARCHAR NOT NULL, -- e.g., 'SYSTEM_AUTO', 'MANUAL_ADMIN'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying history by customer or order
CREATE INDEX IF NOT EXISTS idx_wa_comms_phone ON public.whatsapp_communications(customer_phone);
CREATE INDEX IF NOT EXISTS idx_wa_comms_order ON public.whatsapp_communications(order_id);
CREATE INDEX IF NOT EXISTS idx_wa_comms_meta_id ON public.whatsapp_communications(meta_message_id);

-- Set RLS policies
ALTER TABLE public.whatsapp_communications ENABLE ROW LEVEL SECURITY;

-- Only admins (service role) can insert/select/update
CREATE POLICY "Enable read access for service role on wa logs" ON public.whatsapp_communications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for service role on wa logs" ON public.whatsapp_communications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for service role on wa logs" ON public.whatsapp_communications FOR UPDATE USING (true);
