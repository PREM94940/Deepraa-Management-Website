const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('--- EVIDENCE PACKAGE A & B ---');
    const { count: testCount, error: errA } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_test_data', true);
    if(errA) console.error(errA);
    const { count: allCount, error: errB } = await supabase.from('products').select('*', { count: 'exact', head: true });
    
    console.log(`Test Products (is_test_data = true): ${testCount}`);
    console.log(`Total Products in DB: ${allCount}`);
    console.log(`Expected Delta: +10`);
    
    console.log('\n--- FETCHING MOCK PRODUCT FOR CHECKOUT ---');
    const { data: prods } = await supabase.from('products').select('*').eq('is_test_data', true).limit(1);
    if (prods && prods.length > 0) {
        console.log(`MOCK PRODUCT ID: ${prods[0].id}`);
        console.log(`MOCK PRODUCT NAME: ${prods[0].title}`);
    } else {
        console.log('NO MOCK PRODUCTS FOUND');
    }
}
run();
