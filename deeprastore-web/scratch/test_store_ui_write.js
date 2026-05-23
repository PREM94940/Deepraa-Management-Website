const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testWrite() {
  console.log('--- Testing Write to store_ui_settings ---');
  try {
    const testConfig = { test: true, updated_at_test: new Date().toISOString() };
    const { data, error } = await supabase
      .from('store_ui_settings')
      .upsert({ id: 1, config: testConfig, updated_at: new Date().toISOString() })
      .select();
    
    console.log('Upsert result:', data, error);
    
    const { data: readData, error: readError } = await supabase
      .from('store_ui_settings')
      .select('*')
      .eq('id', 1);
    
    console.log('Read result:', readData, readError);
  } catch (err) {
    console.error('Exception during test:', err);
  }
}
testWrite();
