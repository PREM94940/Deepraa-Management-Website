const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: cData, error: cErr } = await supabase.from('customers').select('*').limit(1);
  console.log('Customers:', cData, cErr);
  const { data: oData, error: oErr } = await supabase.from('orders').select('*').limit(1);
  console.log('Orders:', oData, oErr);
}
check();
