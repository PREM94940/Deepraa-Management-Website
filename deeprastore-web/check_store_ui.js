const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkStoreUI() {
  console.log('--- Checking Store UI and other tables ---');
  try {
    const { data: ui, error: uiErr } = await supabase.from('store_ui_settings').select('*').limit(5);
    console.log('store_ui_settings:', ui, uiErr);
    
    const { data: wa, error: waErr } = await supabase.from('whatsapp_communications').select('*').limit(5);
    console.log('whatsapp_communications:', wa, waErr);

    const { data: audit, error: auditErr } = await supabase.from('audit_logs').select('*').limit(5);
    console.log('audit_logs:', audit, auditErr);

    const { data: comp, error: compErr } = await supabase.from('complaints').select('*').limit(5);
    console.log('complaints:', comp, compErr);

    const { data: staff, error: staffErr } = await supabase.from('staff_roles').select('*').limit(5);
    console.log('staff_roles:', staff, staffErr);
  } catch (err) {
    console.error('Exception checkStoreUI:', err);
  }
}
checkStoreUI();
