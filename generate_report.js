const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://awyqinnivsvqsohfmmcj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg');

async function getStats() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, business_category, business_subcategory, fulfillment_model, is_test_data');
      
    if (error) throw error;
    
    const validProducts = products.filter(p => !p.is_test_data);
    const total = validProducts.length;
    
    let classifiedCount = 0;
    let unclassifiedCount = 0;
    let catCovered = 0;
    let fulCovered = 0;
    
    const { data: pcData, error: pcError } = await supabase
      .from('product_collections')
      .select('product_id');
      
    const productsWithCollections = new Set(pcData ? pcData.map(pc => pc.product_id) : []);
    let colCovered = 0;

    for (const p of validProducts) {
      const hasCat = !!p.business_category;
      const hasFul = !!p.fulfillment_model;
      const hasCol = productsWithCollections.has(p.id);
      
      if (hasCat) catCovered++;
      if (hasFul) fulCovered++;
      if (hasCol) colCovered++;
      
      if (hasCat && hasFul && hasCol) {
        classifiedCount++;
      } else {
        unclassifiedCount++;
      }
    }

    const reportContent = `# Catalog Classification Progress Report

**Total Products (Active):** ${total}
**Fully Classified Products:** ${classifiedCount}
**Unclassified Products:** ${unclassifiedCount}

## Coverage Breakdown
- **Category Coverage:** ${((catCovered / total) * 100).toFixed(1)}% (${catCovered}/${total})
- **Fulfillment Coverage:** ${((fulCovered / total) * 100).toFixed(1)}% (${fulCovered}/${total})
- **Collection Coverage:** ${((colCovered / total) * 100).toFixed(1)}% (${colCovered}/${total})

*Tracking progress until all ${total} products are fully classified.*
`;

    const reportPath = path.join('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052', 'artifacts', 'CATALOG_CLASSIFICATION_PROGRESS_REPORT.md');
    fs.writeFileSync(reportPath, reportContent);
    console.log('Report generated at:', reportPath);
    console.log('Classified:', classifiedCount, 'Unclassified:', unclassifiedCount);

  } catch(e) {
    console.error(e);
  }
}
getStats();
