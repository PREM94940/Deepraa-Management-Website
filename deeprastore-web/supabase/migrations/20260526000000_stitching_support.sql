-- Tailoring Customization Configurations
CREATE TABLE IF NOT EXISTS public.stitching_customizations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_item_id uuid REFERENCES public.order_items(id) ON DELETE CASCADE,
    blouse_style text, -- 'Round Neck', 'V-Neck', 'Sabyasachi Sweetheart', etc.
    sleeve_length text, -- 'Sleeveless', 'Cap Sleeve', 'Elbow Sleeve', 'Full Sleeve'
    neck_design_front text,
    neck_design_back text,
    measurements jsonb NOT NULL, -- { chest: 34, waist: 28, shoulder: 14, ... }
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Support & Complaint Escalation Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    subject text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'Open', -- 'Open', 'In_Progress', 'Resolved', 'Escalated'
    priority text DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    category text NOT NULL, -- 'Delivery Delay', 'Fit Issue', 'Refund Request', 'General'
    proof_attachments text[], -- URLs of photo/video proofs uploaded by customer
    sla_due_at timestamp with time zone,
    assigned_staff_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ticket Conversation Logs
CREATE TABLE IF NOT EXISTS public.ticket_replies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_type text NOT NULL, -- 'customer', 'staff', 'system'
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.stitching_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

-- Set up basic policy grants for Authenticated (Staff) roles
CREATE POLICY "Allow authenticated users to manage customizations" 
ON public.stitching_customizations FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage tickets" 
ON public.support_tickets FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage replies" 
ON public.ticket_replies FOR ALL 
USING (auth.role() = 'authenticated');

-- Policies for public/anon users to create their own tickets & view them
CREATE POLICY "Allow anon users to create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anon users to add replies"
ON public.ticket_replies FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public users to read their customizations"
ON public.stitching_customizations FOR SELECT
USING (true);
