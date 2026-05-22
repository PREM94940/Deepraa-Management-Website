-- Deeprastore Audit Logs Table

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR NOT NULL,
    record_id VARCHAR NOT NULL,
    action VARCHAR NOT NULL, -- e.g., 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    admin_id VARCHAR NOT NULL, -- Identifier of the staff member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Set RLS policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins (service role) can insert/select
CREATE POLICY "Enable read access for service role" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for service role" ON public.audit_logs FOR INSERT WITH CHECK (true);
