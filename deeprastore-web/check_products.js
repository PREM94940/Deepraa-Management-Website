const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkProducts() {
  console.log('--- Checking products table ---');
  try {
    const { data, error } = await supabase.from('products').select('id, title, category, status, price').limit(5);
    console.log('Products:', data, error);
  } catch (err) {
    console.error('Error checking products:', err);
  }
}
checkProducts();
