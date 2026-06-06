// scripts/db_full_backup_query.mjs
// Full backup query — read-only. Exports all production data.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  // Full dump of product_collections (169 records of real production data)
  const { data: pc, error: pcErr } = await supabase
    .from('product_collections')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (pcErr) {
    console.error('Failed to read product_collections:', pcErr.message);
    process.exit(1);
  }

  console.log(JSON.stringify({
    exported_at: new Date().toISOString(),
    table: 'product_collections',
    row_count: pc.length,
    data: pc
  }, null, 2));
}

main().catch(console.error);
