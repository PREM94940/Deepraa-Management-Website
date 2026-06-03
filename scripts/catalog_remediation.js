
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Remediating catalog...');
    
    // Fix DP034 missing image
    await supabase.from('products').update({ images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'] }).eq('sku', 'DP034');
    
    // Get distinct category_ids from products
    const { data: products } = await supabase.from('products').select('category_id').not('category_id', 'is', null);
    const uniqueIds = [...new Set(products.map(p => p.category_id))];
    
    for (let i = 0; i < uniqueIds.length; i++) {
        const id = uniqueIds[i];
        // Ensure it exists in collections table
        const { data: col } = await supabase.from('collections').select('id').eq('id', id).single();
        if (!col) {
            console.log('Creating missing collection ID:', id);
            await supabase.from('collections').insert({
                id: id,
                name: 'Recovered Collection ' + i,
                slug: 'recovered-collection-' + i,
                description: 'Recovered from orphaned product data'
            });
        }
    }
    console.log('Remediation complete.');
}
run();

