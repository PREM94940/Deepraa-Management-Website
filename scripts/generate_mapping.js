const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: products } = await supabase.from('products').select('title, tags, category, sub_category, category_id').eq('is_test_data', false);
    
    const categoryValues = new Set();
    const tagValues = new Set();
    
    products.forEach(p => {
        if (p.category) categoryValues.add(p.category);
        if (p.sub_category) categoryValues.add(p.sub_category);
        if (p.tags && Array.isArray(p.tags)) p.tags.forEach(t => tagValues.add(t));
        else if (p.tags && typeof p.tags === 'string') p.tags.split(',').forEach(t => tagValues.add(t.trim()));
    });

    console.log('Categories found in DB:', Array.from(categoryValues));
    console.log('Tags found in DB:', Array.from(tagValues));

    let mappingTable = '| Existing Tags/Title Keywords | New Category | New Model (Fulfillment) | Collection(s) |\n';
    mappingTable += '|---|---|---|---|\n';
    mappingTable += '| `half-saree` | Half Sarees | Made To Order | - |\n';
    mappingTable += '| `saree` (or title match) | Sarees | Made To Order | - |\n';
    mappingTable += '| `lehenga` (or title match) | Lehengas | Made To Order | - |\n';
    mappingTable += '| `dress` (or title match) | Dresses | Made To Order | - |\n';
    mappingTable += '| `fabric` (or title match) | Fabric | Ready To Ship | - |\n';
    mappingTable += '| `ready-wear` | *Keep Category* | Ready To Ship | Ready To Ship Collection |\n';
    mappingTable += '| `custom-made` | *Keep Category* | Custom Made | - |\n';
    mappingTable += '| `bridal` (in title) | *Keep Category* | *Keep Model* | Bridal Collection |\n';
    mappingTable += '| `wedding` (in title) | *Keep Category* | *Keep Model* | Wedding Collection |\n';
    mappingTable += '| `pattu` (in title/tag) | *Keep Category* | *Keep Model* | Pattu Collection |\n';

    const md = `
# Catalog Mapping Report

## 1. Existing Catalog State
- **Total Products Analyzed:** ${products.length}
- **Existing Categories Field:** ${Array.from(categoryValues).length > 0 ? Array.from(categoryValues).join(', ') : 'None (NULL / Empty)'}
- **Existing Product Types Field:** None (Column does not exist in schema)
- **Existing Tags:** ${Array.from(tagValues).join(', ')}

## 2. Current Storefront Filtering Logic
I have reviewed the codebase. Currently, filtering in \`src/app/collections/page.tsx\` operates via **mixed logic (title & tag matching)**. 
- Example: The storefront filters for "Half Sarees" by checking \`(p.tags && p.tags.includes('half-saree')) || p.title.toLowerCase().includes('half saree')\`.
- The \`category_id\` and \`collection_id\` relational columns are **currently ignored** by the frontend logic.

## 3. Proposed Mapping Table
Based on your business rules, we will backfill the database columns natively rather than relying on string matching.

${mappingTable}

> [!IMPORTANT]
> **Awaiting Approval**
> This is a non-destructive analysis. The 195 products remain untouched. Please review the proposed mapping above. If approved, I will build a migration script to map the data based on this logic.
`;

    fs.writeFileSync('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052/artifacts/implementation_plan.md', md);
    console.log('Artifact updated.');
}
run();
