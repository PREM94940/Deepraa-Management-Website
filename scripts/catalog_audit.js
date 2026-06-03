const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
    console.log('--- CATALOG QUALITY AUDIT ---');
    const { data: products } = await supabase.from('products').select('id, title, sku, images, category_id').eq('is_test_data', false);
    const { data: collections } = await supabase.from('collections').select('id, name, slug');

    let missingImages = 0;
    let singleImage = 0;
    let orphanedProducts = 0;

    const collectionMap = new Map();
    if (collections) {
        collections.forEach(c => collectionMap.set(c.id, c.name));
    }

    products.forEach(p => {
        if (!p.images || p.images.length === 0 || p.images[0] === '') {
            missingImages++;
            console.log(`[WARN] Missing images for SKU: ${p.sku} | Title: ${p.title}`);
        } else if (p.images.length === 1) {
            singleImage++;
        }

        if (!p.category_id && !p.categories) {
            orphanedProducts++;
            console.log(`[WARN] Orphaned product SKU: ${p.sku} (No category ID)`);
        } else if (p.category_id && !collectionMap.has(p.category_id)) {
            orphanedProducts++;
            console.log(`[WARN] Orphaned product SKU: ${p.sku} (Category ID ${p.category_id} not found)`);
        }
    });

    console.log(`\nTotal Real Products: ${products.length}`);
    console.log(`Products Missing Images: ${missingImages}`);
    console.log(`Products with Only 1 Image: ${singleImage}`);
    console.log(`Orphaned Products: ${orphanedProducts}`);
    console.log(`Total Collections: ${collections ? collections.length : 0}`);
}

runAudit();
