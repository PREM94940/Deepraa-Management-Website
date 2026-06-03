
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: testProductCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_test_data', true);
    const { count: realProductCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_test_data', false);
    const { count: collectionCount } = await supabase.from('collections').select('*', { count: 'exact', head: true });
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    
    console.log(JSON.stringify({
        totalProducts: productCount,
        testProducts: testProductCount,
        realProducts: realProductCount,
        totalCollections: collectionCount,
        totalOrders: orderCount
    }, null, 2));
}
run();

