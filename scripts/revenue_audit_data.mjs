// scripts/revenue_audit_data.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("=== is_test_data AUDIT ===");
  const { data: allProds, error } = await supabase.from('products').select('id, is_test_data');
  if (error) {
    console.error("Error fetching products:", error);
  } else {
    let nullCount = 0;
    let trueCount = 0;
    let falseCount = 0;
    
    allProds.forEach(p => {
      if (p.is_test_data === null) nullCount++;
      else if (p.is_test_data === true) trueCount++;
      else if (p.is_test_data === false) falseCount++;
    });
    
    console.log(`Total Products: ${allProds.length}`);
    console.log(`NULL values: ${nullCount}`);
    console.log(`TRUE values: ${trueCount}`);
    console.log(`FALSE values: ${falseCount}`);
  }

  console.log("\n=== WHATSAPP CMS AUDIT ===");
  const { data: cmsSettings, error: cmsError } = await supabase.from('storefront_settings').select('settings_json').eq('setting_key', 'global').maybeSingle();
  if (cmsError) {
    console.error("Error fetching CMS settings:", cmsError);
  } else {
    console.log("Global Settings:", JSON.stringify(cmsSettings?.settings_json, null, 2));
  }
}

main().catch(console.error);
