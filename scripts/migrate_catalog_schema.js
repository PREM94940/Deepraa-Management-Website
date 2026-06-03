const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Running schema migrations via Supabase REST API...');
    const sql = `
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS business_category TEXT,
        ADD COLUMN IF NOT EXISTS business_subcategory TEXT,
        ADD COLUMN IF NOT EXISTS fulfillment_model TEXT,
        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS seo_title TEXT,
        ADD COLUMN IF NOT EXISTS seo_description TEXT,
        ADD COLUMN IF NOT EXISTS canonical_url TEXT;

        CREATE TABLE IF NOT EXISTS product_collections (
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (product_id, collection_id)
        );
    `;

    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
        console.error('RPC failed:', error);
        console.log('Please run the following SQL manually in the Supabase Studio SQL Editor:\n');
        console.log(sql);
    } else {
        console.log('Migration succeeded!', data);
    }
}
run();
