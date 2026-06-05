const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://awyqinnivsvqsohfmmcj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg');

async function generateReport() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, business_category, business_subcategory, fulfillment_model, is_test_data, is_featured, is_best_seller, is_new_arrival, is_hidden');
      
    if (error) throw error;
    
    const { data: pcData } = await supabase.from('product_collections').select('product_id, collection_id');
    const { data: colData } = await supabase.from('collections').select('id, title');

    const colMap = {};
    if (colData) colData.forEach(c => colMap[c.id] = c.title);

    const pcMap = {};
    if (pcData) {
      pcData.forEach(pc => {
        if (!pcMap[pc.product_id]) pcMap[pc.product_id] = [];
        if (colMap[pc.collection_id]) pcMap[pc.product_id].push(colMap[pc.collection_id]);
      });
    }

    const validProducts = products.filter(p => !p.is_test_data);
    const total = validProducts.length;

    let fullyClassified = 0;
    let partiallyClassified = 0;
    let unclassified = 0;

    const catDist = {};
    const subcatDist = {};
    const fulDist = {};
    const colDist = {};

    let featured = 0, bestSeller = 0, newArrival = 0, hidden = 0;

    validProducts.forEach(p => {
      if (p.is_featured) featured++;
      if (p.is_best_seller) bestSeller++;
      if (p.is_new_arrival) newArrival++;
      if (p.is_hidden) hidden++;

      const hasCat = !!p.business_category;
      const hasFul = !!p.fulfillment_model;
      const cols = pcMap[p.id] || [];
      const hasCol = cols.length > 0;

      let score = 0;
      if (hasCat) score++;
      if (hasFul) score++;
      if (hasCol) score++;

      if (score === 3) fullyClassified++;
      else if (score > 0) partiallyClassified++;
      else unclassified++;

      if (hasCat) catDist[p.business_category] = (catDist[p.business_category] || 0) + 1;
      if (p.business_subcategory) subcatDist[p.business_subcategory] = (subcatDist[p.business_subcategory] || 0) + 1;
      if (hasFul) fulDist[p.fulfillment_model] = (fulDist[p.fulfillment_model] || 0) + 1;
      cols.forEach(c => colDist[c] = (colDist[c] || 0) + 1);
    });

    const completionPercent = total > 0 ? ((fullyClassified / total) * 100).toFixed(1) : 0;
    const remaining = total - fullyClassified;
    const estHours = (remaining / 60).toFixed(1);

    const formatDist = (dist) => {
      const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
      if (entries.length === 0) return '- *None*';
      return entries.map(([k, v]) => `- **${k}:** ${v}`).join('\n');
    };

    const reportContent = `# Catalog Operations Dashboard

*Live Database Report - Priority 1 Classification Tracking*

## 📊 Progress Metrics
- **Total Products:** ${total}
- **Fully Classified:** ${fullyClassified}
- **Partially Classified:** ${partiallyClassified}
- **Unclassified:** ${unclassified}

## ⏱️ Completion Forecast
- **Current Completion:** ${completionPercent}%
- **Remaining Products:** ${remaining}
- **Estimated Time Remaining:** ~${estHours} hours *(assumes 1 min/product)*

---

## 📈 Distributions

### 1. Category Distribution
${formatDist(catDist)}

### 2. Subcategory Distribution
${formatDist(subcatDist)}

### 3. Fulfillment Distribution
${formatDist(fulDist)}

### 4. Collection Distribution
${formatDist(colDist)}

---

## 🏷️ Business Controls
- **Featured Products:** ${featured}
- **Best Sellers:** ${bestSeller}
- **New Arrivals:** ${newArrival}
- **Hidden / Draft Products:** ${hidden}

---
*Note: Priority 2 will remain paused until Current Completion reaches 100.0%.*
`;

    const reportPath = path.join('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052', 'artifacts', 'CATALOG_CLASSIFICATION_PROGRESS_REPORT.md');
    fs.writeFileSync(reportPath, reportContent);
    console.log('Report generated at:', reportPath);

  } catch(e) {
    console.error(e);
  }
}
generateReport();
