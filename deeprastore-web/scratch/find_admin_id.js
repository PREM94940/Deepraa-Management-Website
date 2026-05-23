const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  // Let's check if there are any audit logs that might reveal the admin's user ID
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('admin_id')
    .limit(10);
  
  console.log('Audit logs admin IDs:', logs, error);

  // Let's also check if we can query the active user by looking at user profiles
  // or check if there is a way to query other tables that store user references
}

main();
