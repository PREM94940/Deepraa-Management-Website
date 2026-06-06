import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const OUT_DIR = 'C:/Users/rodda/.gemini/antigravity/brain/1e99aef6-9d98-4bd5-acce-aefefb6d506c';

async function run() {
    console.log("Starting Classification Audit...");
    
    const { data: products } = await supabase.from('products').select('id, title, sku');
    const { data: collections } = await supabase.from('collections').select('id, name');
    const { data: product_collections } = await supabase.from('product_collections').select('product_id, collection_id');

    const colMap = {};
    collections.forEach(c => colMap[c.id] = c.name);

    let md = '# COLLECTION CLASSIFICATION AUDIT\n\n';
    let onlyNewArrivalsCount = 0;
    
    md += '| SKU | Product Title | Assigned Collections | Flag: Only New Arrivals? |\n';
    md += '|---|---|---|---|\n';

    products.forEach(p => {
        const assignedIds = product_collections.filter(pc => pc.product_id === p.id).map(pc => pc.collection_id);
        const assignedNames = assignedIds.map(id => colMap[id] || 'Unknown');
        
        const isOnlyNewArrivals = assignedNames.length === 1 && assignedNames[0] === 'New Arrivals';
        if (isOnlyNewArrivals) onlyNewArrivalsCount++;
        
        md += `| ${p.sku || 'N/A'} | ${p.title} | ${assignedNames.join(', ')} | ${isOnlyNewArrivals ? '⚠️ YES' : 'NO'} |\n`;
    });
    
    md += `\n**Total Products Assigned ONLY to "New Arrivals": ${onlyNewArrivalsCount}**\n`;
    
    fs.writeFileSync(`${OUT_DIR}/COLLECTION_CLASSIFICATION_AUDIT.md`, md);
    console.log("Audit complete. Count:", onlyNewArrivalsCount);
}

run().catch(console.error);
