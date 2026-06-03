
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://awyqinnivsvqsohfmmcj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg');
async function run() {
    const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
    console.log(orders || error);
}
run();

