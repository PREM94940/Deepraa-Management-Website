const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: products } = await supabase.from('products').select('sku, title, tags').eq('is_test_data', false);
    
    let table = '| SKU | Title | Existing Tags | Suggested Category | Suggested Fulfillment Model | Suggested Collection(s) |\n';
    table += '|---|---|---|---|---|---|\n';

    products.forEach(p => {
        let title = p.title || '';
        let tagsStr = '';
        if (p.tags && Array.isArray(p.tags)) {
            tagsStr = p.tags.join(', ');
        } else if (p.tags && typeof p.tags === 'string') {
            tagsStr = p.tags;
        }

        const lowerTitle = title.toLowerCase();
        const lowerTags = tagsStr.toLowerCase();

        // 1. Category logic
        let cat = 'Unknown';
        if (lowerTags.includes('half-saree') || lowerTitle.includes('half saree')) cat = 'Half Sarees';
        else if (lowerTitle.includes('lehenga') || lowerTags.includes('lehenga')) cat = 'Lehengas';
        else if (lowerTitle.includes('dress') || lowerTags.includes('dress')) cat = 'Dresses';
        else if (lowerTitle.includes('fabric') || lowerTags.includes('fabric')) cat = 'Fabric';
        else if (lowerTitle.includes('saree') || lowerTags.includes('saree')) cat = 'Sarees';

        // 2. Fulfillment Model logic
        let model = 'Made To Order'; // Default
        if (lowerTags.includes('ready-wear') || lowerTags.includes('ready to ship')) model = 'Ready To Ship';
        else if (lowerTags.includes('custom-made')) model = 'Custom Made';

        // 3. Collection logic
        let collections = [];
        if (lowerTitle.includes('bridal') || lowerTags.includes('bridal')) collections.push('Bridal Collection');
        if (lowerTitle.includes('wedding') || lowerTags.includes('wedding')) collections.push('Wedding Collection');
        if (lowerTitle.includes('pattu') || lowerTags.includes('pattu')) collections.push('Pattu Collection');
        if (lowerTags.includes('festival') || lowerTitle.includes('festival')) collections.push('Festival Collection');
        if (lowerTags.includes('designer') || lowerTitle.includes('designer')) collections.push('Designer Collection');
        if (model === 'Ready To Ship') collections.push('Ready To Ship Collection');
        
        let colStr = collections.length > 0 ? collections.join(', ') : 'None';

        // Escape pipes for markdown
        title = title.replace(/\|/g, '-');
        tagsStr = tagsStr.replace(/\|/g, '-');

        table += `| ${p.sku || 'N/A'} | ${title} | ${tagsStr} | **${cat}** | **${model}** | ${colStr} |\n`;
    });

    const md = `
# Catalog Classification Report

This report analyzes all ${products.length} active products against the approved business rules. No database records have been modified.

## Frontend Migration Audit Plan

When migrating the storefront from string-matching to relational filtering, the following changes must be implemented:

1. **Database Schema Update**:
   - Add \`category_id\` (uuid, FK to Categories).
   - Add \`fulfillment_model\` (enum: 'Ready To Ship', 'Custom Made', 'Made To Order').
   - Create a join table \`product_collections\` (product_id, collection_id) to support the many-to-many marketing layer.

2. **Frontend Queries (\`src/app/collections/page.tsx\`)**:
   - **Current Logic**: \`(p.tags && p.tags.includes(category)) || p.title.includes(category)\`.
   - **New Logic**: Query the database using \`.eq('category_id', selectedCategoryId)\`.
   - Update URL routing to map slugs directly to Category/Collection UUIDs.

3. **Collection Discovery**:
   - To query collections, we will join through \`product_collections\` rather than regex matching the title for "Bridal" or "Wedding".

## Proposed Classifications

${table}

> [!IMPORTANT]
> **User Review Required**
> Please review the classification table above. Note any products that may have been miscategorized by the automated ruleset. Once you approve this classification map, I will generate the required schema changes and execute the data migration script.
`;

    fs.writeFileSync('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052/artifacts/implementation_plan.md', md);
    console.log('Artifact written.');
}
run();
