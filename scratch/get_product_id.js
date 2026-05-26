const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .limit(5);

  if (error) {
    console.error("Error fetching products:", error.message);
  } else {
    console.log("Active Products in Database:");
    console.log(JSON.stringify(data, null, 2));
  }
}

findProduct();
