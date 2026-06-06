// scripts/schema_check.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("Checking constraint existence using Supabase RPC or querying...");
  
  // Try querying a dummy relation to see if the error indicates anything.
  // Actually, we can test the join directly:
  const { data: testJoin, error: joinError } = await supabase
    .from('collection_products')
    .select('product_id, products(id, title)')
    .limit(5);

  if (joinError) {
    console.error("Join Error:", joinError.message);
  } else {
    console.log("Join test result:", JSON.stringify(testJoin, null, 2));
  }

  // To get column types without information_schema access via anon key, 
  // we can look at the type of product_id in the result.
  if (testJoin && testJoin.length > 0) {
    console.log("Type of product_id:", typeof testJoin[0].product_id);
  }
}

main().catch(console.error);
