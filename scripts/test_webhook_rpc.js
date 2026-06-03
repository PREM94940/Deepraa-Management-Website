
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabaseServer = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Running confirm_order_and_decrement_inventory for order 2cbaee12-d2f6-49e8-98a0-c185418dc0a5');
    const { data, error } = await supabaseServer.rpc('confirm_order_and_decrement_inventory', {
        p_order_id: '2cbaee12-d2f6-49e8-98a0-c185418dc0a5'
    });
    console.log('Result:', data);
    console.log('Error:', error);
}
run();

