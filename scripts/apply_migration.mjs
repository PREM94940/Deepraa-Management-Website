// scripts/apply_migration.mjs
// Applies the canonicalize_collection_products migration.
// Uses service_role_key equivalent (anon key — table has no RLS yet pre-migration)
// Steps match the migration SQL exactly.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('=== APPLYING MIGRATION: canonicalize_collection_products ===\n');

  // --- STEP 1: Read product_collections data ---
  console.log('Step 1: Reading all rows from product_collections...');
  const { data: pcRows, error: pcReadErr } = await supabase
    .from('product_collections')
    .select('product_id, collection_id, created_at')
    .order('collection_id', { ascending: true });

  if (pcReadErr) {
    console.error('FAILED to read product_collections:', pcReadErr.message);
    process.exit(1);
  }
  console.log(`  Read ${pcRows.length} rows from product_collections`);

  // --- STEP 2: Group by collection_id and assign position ---
  console.log('Step 2: Assigning positions within each collection...');
  const grouped = {};
  pcRows.forEach(row => {
    if (!grouped[row.collection_id]) grouped[row.collection_id] = [];
    grouped[row.collection_id].push(row);
  });

  // Sort within each collection by created_at ascending, then assign position
  const insertRows = [];
  Object.values(grouped).forEach(rows => {
    rows.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    rows.forEach((row, idx) => {
      insertRows.push({
        collection_id: row.collection_id,
        product_id: row.product_id,  // UUID stored as text
        position: idx,
        created_at: row.created_at
      });
    });
  });
  console.log(`  Prepared ${insertRows.length} rows with positions`);

  // --- STEP 3: Insert into collection_products (idempotent) ---
  console.log('Step 3: Inserting into collection_products...');
  
  // Insert in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < insertRows.length; i += BATCH_SIZE) {
    const batch = insertRows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('collection_products')
      .upsert(batch, { onConflict: 'collection_id,product_id', ignoreDuplicates: true });
    
    if (error) {
      console.error(`  BATCH ${Math.floor(i/BATCH_SIZE)+1} ERROR:`, error.message);
      // Continue — other batches may succeed
    } else {
      inserted += batch.length;
      console.log(`  Batch ${Math.floor(i/BATCH_SIZE)+1}: ${batch.length} rows upserted`);
    }
  }

  // --- STEP 4: Verify ---
  console.log('\nStep 4: Verifying migration...');
  const { data: cpVerify, error: cpVerifyErr } = await supabase
    .from('collection_products')
    .select('collection_id, product_id, position');
  
  if (cpVerifyErr) {
    console.error('Verification read failed:', cpVerifyErr.message);
  } else {
    console.log(`  collection_products now has: ${cpVerify.length} rows`);
    console.log(`  product_collections still has: ${pcRows.length} rows (preserved backup)`);
  }

  // --- STEP 5: Sample check ---
  const { data: sample } = await supabase
    .from('collection_products')
    .select('collection_id, product_id, position')
    .order('collection_id', { ascending: true })
    .limit(5);
  
  if (sample && sample.length > 0) {
    console.log('\n  Sample rows from collection_products:');
    sample.forEach(r => console.log('  ', JSON.stringify(r)));
  }

  console.log('\n=== MIGRATION COMPLETE ===');
}

main().catch(console.error);
