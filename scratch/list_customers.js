const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('customers')
    .select('id, email, full_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching customers:", error.message);
  } else {
    console.log("Registered Customers:");
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
