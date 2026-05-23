const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function listTables() {
  console.log('--- Listing all tables in public schema ---');
  try {
    const { data, error } = await supabase.rpc('get_tables'); // if rpc exists, or let's try direct postgres query via API
    // If RPC doesn't exist, we can try to do a select on common tables or query pg_tables.
    // Wait, let's execute SQL or try fetching schemas.
    // An easy way to test if table exists is to query a known name. Let's run a select on information_schema if allowed.
    // Since RLS is enabled, maybe we cannot query information_schema. Let's try.
    const { data: tables, error: tablesErr } = await supabase
      .from('pg_tables') // probably won't work because of RLS/PostgREST exposure
      .select('*');
    console.log('pg_tables:', tables, tablesErr);
  } catch (err) {
    console.error('Exception listing tables:', err);
  }
}
listTables();
