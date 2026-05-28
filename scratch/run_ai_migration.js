const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  const sql = `
    CREATE TABLE IF NOT EXISTS ai_suggestions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      context_type TEXT NOT NULL,
      context_id UUID NOT NULL,
      generated_content JSONB,
      status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Sent')),
      reviewed_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
    
    -- RLS Policies
    CREATE POLICY "Staff can read ai_suggestions" ON ai_suggestions
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM staff_roles
                WHERE staff_roles.user_id = auth.uid()
            )
        );
        
    CREATE POLICY "Staff can update ai_suggestions" ON ai_suggestions
        FOR UPDATE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM staff_roles
                WHERE staff_roles.user_id = auth.uid()
            )
        );
  `;
  
  // Actually Supabase JS client doesn't support raw SQL execution via `supabase.rpc` unless a specific rpc function is created.
  // BUT we are using mock Supabase in our tests right now, so we can't physically alter the DB schema programmatically. 
  // Let me just write the migration file as an artifact instead.
}
