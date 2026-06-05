const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://awyqinnivsvqsohfmmcj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg');

async function generateReport() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, business_category, business_subcategory, fulfillment_model, is_test_data, is_featured, is_best_seller, is_new_arrival, is_hidden, created_at');
      
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

    let missingCategory = 0;
    let missingSubcategory = 0;
    let missingFulfillment = 0;
    let missingCollection = 0;

    const catDist = {};
    const subcatDist = {};
    const fulDist = {};
    const colDist = {};

    let featured = 0, bestSeller = 0, newArrival = 0, hidden = 0;
    
    const recentlyClassified = [];

    validProducts.forEach(p => {
      if (p.is_featured) featured++;
      if (p.is_best_seller) bestSeller++;
      if (p.is_new_arrival) newArrival++;
      if (p.is_hidden) hidden++;

      const hasCat = !!p.business_category;
      const hasSubcat = !!p.business_subcategory;
      const hasFul = !!p.fulfillment_model;
      const cols = pcMap[p.id] || [];
      const hasCol = cols.length > 0;

      if (!hasCat) missingCategory++;
      if (!hasSubcat) missingSubcategory++;
      if (!hasFul) missingFulfillment++;
      if (!hasCol) missingCollection++;

      // In V3, fully classified requires subcategory too
      let isFully = hasCat && hasSubcat && hasFul && hasCol;
      let isUnclassified = !hasCat && !hasSubcat && !hasFul && !hasCol;

      if (isFully) {
        fullyClassified++;
        recentlyClassified.push(p);
      } else if (isUnclassified) {
        unclassified++;
      } else {
        partiallyClassified++;
      }

      if (hasCat) catDist[p.business_category] = (catDist[p.business_category] || 0) + 1;
      if (hasSubcat) subcatDist[p.business_subcategory] = (subcatDist[p.business_subcategory] || 0) + 1;
      if (hasFul) fulDist[p.fulfillment_model] = (fulDist[p.fulfillment_model] || 0) + 1;
      cols.forEach(c => colDist[c] = (colDist[c] || 0) + 1);
    });

    // Fix completion calculation
    let completionPercent = 0;
    if (total > 0) {
      completionPercent = (fullyClassified / total) * 100;
    }
    const completionPercentStr = completionPercent > 0 && completionPercent < 0.1 ? "0.1" : completionPercent.toFixed(1);

    const fullPercent = total > 0 ? ((fullyClassified / total) * 100).toFixed(1) : "0.0";
    const partPercent = total > 0 ? ((partiallyClassified / total) * 100).toFixed(1) : "0.0";
    const unclassPercent = total > 0 ? ((unclassified / total) * 100).toFixed(1) : "0.0";

    const remaining = total - fullyClassified;
    const estHours = (remaining / 60).toFixed(1);

    const formatDist = (dist) => {
      const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
      if (entries.length === 0) return '- *None*';
      return entries.map(([k, v]) => `- **${k}**: ${v}`).join('\n');
    };

    // Top 10 recently classified
    recentlyClassified.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
    const top10 = recentlyClassified.slice(0, 10).map((p, i) => `${i + 1}. ${p.title} (${p.business_category})`).join('\n');
    
    // Inconsistencies check
    const inconsistencies = [];
    if (missingSubcategory < missingCategory) {
      inconsistencies.push('Some products have a subcategory but no category.');
    }
    if (total !== fullyClassified + partiallyClassified + unclassified) {
      inconsistencies.push('Classification sums do not match total active products.');
    }

    if (inconsistencies.length > 0) {
      const warningPath = path.join('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052', 'artifacts', 'DATA_QUALITY_WARNING.md');
      fs.writeFileSync(warningPath, `# Data Quality Warning\n\n**Root Cause Analysis:**\n\n` + inconsistencies.map(i => `- ${i}`).join('\n'));
      console.log('WARNING GENERATED: Inconsistencies found.');
    }

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const reportContent = `# Catalog Operations Dashboard

*Live Database Report - Priority 1 Classification Tracking*
**Last Updated:** ${timestamp}

## 📊 Classification Health Metrics
- **Fully Classified:** ${fullyClassified} (${fullPercent}%)
- **Partially Classified:** ${partiallyClassified} (${partPercent}%)
- **Unclassified:** ${unclassified} (${unclassPercent}%)
- **Total Active Products:** ${total}

## ⏱️ Completion Forecast
- **Current Completion:** ${completionPercentStr}%
- **Remaining Products:** ${remaining}
- **Estimated Time Remaining:** ~${estHours} hours *(assumes 1 min/product)*

---

## ⚠️ Data Quality Metrics
*Products missing required classification data:*
- **Missing Category:** ${missingCategory}
- **Missing Subcategory:** ${missingSubcategory}
- **Missing Fulfillment Model:** ${missingFulfillment}
- **Missing Collection Assignment:** ${missingCollection}

---

## 📁 Collection Health
${formatDist(colDist)}

---

## 📈 Classification Distributions

### Category Distribution
${formatDist(catDist)}

### Subcategory Distribution
${formatDist(subcatDist)}

### Fulfillment Distribution
${formatDist(fulDist)}

---

## 🏷️ Business Controls
- **Featured Products:** ${featured}
- **Best Sellers:** ${bestSeller}
- **New Arrivals:** ${newArrival}
- **Hidden / Draft Products:** ${hidden}

---

## 🕒 Top 10 Recently Classified Products
${top10 || '*No products fully classified yet.*'}

---
*Note: Priority 2 will remain paused until Current Completion reaches 100.0%.*
`;

    const reportPath = path.join('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052', 'artifacts', 'CATALOG_CLASSIFICATION_PROGRESS_REPORT.md');
    fs.writeFileSync(reportPath, reportContent);
    console.log('V3 Report generated successfully.');

  } catch(e) {
    console.error(e);
  }
}
generateReport();
