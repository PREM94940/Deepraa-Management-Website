import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const OUT_DIR = 'C:/Users/rodda/.gemini/antigravity/brain/1e99aef6-9d98-4bd5-acce-aefefb6d506c';

async function run() {
    console.log("Starting Data Audit...");
    
    const { data: products } = await supabase.from('products').select('*');
    const { data: collections } = await supabase.from('collections').select('*');
    const { data: product_collections } = await supabase.from('product_collections').select('*');

    // 1. DATABASE HEALTH REPORT
    let dbMd = '# DATABASE HEALTH REPORT\n\n';
    
    // Check duplicates
    const skus = products.map(p => p.sku).filter(Boolean);
    const dupSkus = skus.filter((item, index) => skus.indexOf(item) !== index);
    const slugs = collections.map(c => c.slug).filter(Boolean);
    const dupSlugs = slugs.filter((item, index) => slugs.indexOf(item) !== index);
    
    // Orphan checks
    const productsInCollections = new Set(product_collections.map(pc => pc.product_id));
    const orphanedProducts = products.filter(p => !productsInCollections.has(p.id));
    
    // Check missing fields
    const missingImages = products.filter(p => !p.images || p.images.length === 0);
    const missingPrices = products.filter(p => p.price === null || p.price === undefined);
    
    dbMd += `## Integrity Checks\n`;
    dbMd += `- Orphaned Products: ${orphanedProducts.length}\n`;
    dbMd += `- Duplicate Slugs: ${dupSlugs.length}\n`;
    dbMd += `- Duplicate SKUs: ${dupSkus.length}\n`;
    dbMd += `- Products without images: ${missingImages.length}\n`;
    dbMd += `- Products without prices: ${missingPrices.length}\n`;
    dbMd += `- Products without collections: ${orphanedProducts.length}\n`;
    dbMd += `- Total Products in DB: ${products.length}\n`;
    dbMd += `- Total Collections in DB: ${collections.length}\n`;

    fs.writeFileSync(`${OUT_DIR}/DATABASE_HEALTH_REPORT.md`, dbMd);

    // 2. PRODUCT COVERAGE REPORT
    let prodMd = '# PRODUCT COVERAGE REPORT\n\n';
    prodMd += `- Total products in DB: ${products.length}\n`;
    prodMd += `- Total products tested: ${products.length}\n\n`;
    
    let failedProducts = 0;
    const prodDetails = [];
    
    products.forEach(p => {
        const missImg = !p.images || p.images.length === 0;
        const missPrice = p.price === null || p.price === undefined;
        const missDesc = !p.description || p.description.trim() === '';
        const missTitle = !p.title || p.title.trim() === '';
        
        if (missImg || missPrice || missDesc || missTitle) {
            failedProducts++;
            prodDetails.push(`### Product ID: ${p.id}\n- Missing Image: ${missImg}\n- Missing Price: ${missPrice}\n- Missing Description: ${missDesc}\n- Missing Title: ${missTitle}\n`);
        }
    });
    
    prodMd += `- Failed products: ${failedProducts}\n\n`;
    if (failedProducts > 0) prodMd += `## Failure Details\n${prodDetails.join('\n')}`;
    
    fs.writeFileSync(`${OUT_DIR}/PRODUCT_COVERAGE_REPORT.md`, prodMd);

    // 3. COLLECTION INVENTORY REPORT
    let colMd = '# COLLECTION INVENTORY REPORT\n\n';
    collections.forEach(c => {
        const prodCount = product_collections.filter(pc => pc.collection_id === c.id).length;
        const emptyByDesign = prodCount === 0 && (c.name.includes('New Arrivals') || c.name.includes('Best Sellers') || c.name.includes('Recovered'));
        
        colMd += `### Collection: ${c.name}\n`;
        colMd += `- Product count: ${prodCount}\n`;
        colMd += `- Visible on storefront: ${prodCount > 0}\n`;
        colMd += `- Empty by design? ${emptyByDesign}\n\n`;
    });
    
    fs.writeFileSync(`${OUT_DIR}/COLLECTION_INVENTORY_REPORT.md`, colMd);

    console.log("Data Audit Complete.");
}

run().catch(console.error);
