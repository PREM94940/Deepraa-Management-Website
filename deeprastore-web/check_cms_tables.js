const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkCMS() {
  console.log('--- Checking CMS tables ---');
  try {
    const { data: themes, error: themeErr } = await supabase.from('storefront_themes').select('*').limit(5);
    console.log('storefront_themes:', themes, themeErr);
    
    const { data: pages, error: pageErr } = await supabase.from('storefront_pages').select('*').limit(5);
    console.log('storefront_pages:', pages, pageErr);

    const { data: media, error: mediaErr } = await supabase.from('media_library').select('*').limit(5);
    console.log('media_library:', media, mediaErr);

    const { data: pageLogs, error: logErr } = await supabase.from('page_audit_logs').select('*').limit(5);
    console.log('page_audit_logs:', pageLogs, logErr);
  } catch (err) {
    console.error('Exception during CMS tables check:', err);
  }
}
checkCMS();
