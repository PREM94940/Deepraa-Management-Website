// scripts/db_evidence_query.mjs
// Evidence query — read-only. No writes.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('=== COLLECTION PIPELINE EVIDENCE QUERY ===\n');
  
  // 1. Count product_collections
  const { data: pc, error: pcErr, count: pcCount } = await supabase
    .from('product_collections')
    .select('*', { count: 'exact', head: false });
  
  console.log('--- product_collections ---');
  if (pcErr) {
    console.log('ERROR:', pcErr.code, pcErr.message);
  } else {
    console.log('Row count:', pc?.length ?? 0);
    if (pc && pc.length > 0) {
      console.log('Sample rows (first 5):');
      pc.slice(0, 5).forEach(r => console.log(' ', JSON.stringify(r)));
      console.log('Columns (from first row):', Object.keys(pc[0]));
    } else {
      console.log('Table is empty or does not exist');
    }
  }
  
  console.log('');
  
  // 2. Count collection_products
  const { data: cp, error: cpErr } = await supabase
    .from('collection_products')
    .select('*', { count: 'exact', head: false });
  
  console.log('--- collection_products ---');
  if (cpErr) {
    console.log('ERROR:', cpErr.code, cpErr.message);
  } else {
    console.log('Row count:', cp?.length ?? 0);
    if (cp && cp.length > 0) {
      console.log('Sample rows (first 5):');
      cp.slice(0, 5).forEach(r => console.log(' ', JSON.stringify(r)));
      console.log('Columns (from first row):', Object.keys(cp[0]));
    } else {
      console.log('Table is empty or does not exist');
    }
  }

  console.log('');

  // 3. Count total products and collections for reference
  const { data: prods } = await supabase.from('products').select('id', { count: 'exact', head: false });
  const { data: colls } = await supabase.from('collections').select('id, name, collection_type', { count: 'exact', head: false });

  console.log('--- products ---');
  console.log('Row count:', prods?.length ?? 'error');

  console.log('');
  console.log('--- collections ---');
  console.log('Row count:', colls?.length ?? 'error');
  if (colls && colls.length > 0) {
    colls.forEach(c => console.log(' ', JSON.stringify(c)));
  }

  console.log('\n=== END EVIDENCE QUERY ===');
}

main().catch(console.error);
