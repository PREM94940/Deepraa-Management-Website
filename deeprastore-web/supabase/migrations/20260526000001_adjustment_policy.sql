-- Alter orders table to support adjustment-first and replacement-first workflows
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_eligible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_eligible_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS replacement_status text DEFAULT 'Idle'; -- 'Idle', 'Requested', 'Approved', 'Shipped', 'Completed'
