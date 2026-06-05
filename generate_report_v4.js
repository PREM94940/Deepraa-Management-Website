const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://awyqinnivsvqsohfmmcj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg');

function guessCategory(title) {
  if (!title) return 'Unknown';
  const t = title.toLowerCase();
  if (t.includes('half saree') || t.includes('voni')) return 'Half Sarees';
  if (t.includes('lehenga') || t.includes('choli')) return 'Lehengas';
  if (t.includes('saree') || t.includes('pattu') || t.includes('silk') || t.includes('sari')) return 'Sarees';
  if (t.includes('dress') || t.includes('gown') || t.includes('suit') || t.includes('kurti')) return 'Dresses';
  if (t.includes('fabric') || t.includes('unstitched') || t.includes('material')) return 'Fabric';
  return 'Other / Unknown';
}

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

    const queueCounts = {
      'Half Sarees': 0,
      'Sarees': 0,
      'Lehengas': 0,
      'Dresses': 0,
      'Fabric': 0,
      'Other / Unknown': 0
    };

    validProducts.forEach(p => {
      const hasCat = !!p.business_category;
      const hasSubcat = !!p.business_subcategory;
      const hasFul = !!p.fulfillment_model;
      const cols = pcMap[p.id] || [];
      const hasCol = cols.length > 0;

      if (!hasCat) missingCategory++;
      if (!hasSubcat) missingSubcategory++;
      if (!hasFul) missingFulfillment++;
      if (!hasCol) missingCollection++;

      let isFully = hasCat && hasSubcat && hasFul && hasCol;
      let isUnclassified = !hasCat && !hasSubcat && !hasFul && !hasCol;

      if (isFully) {
        fullyClassified++;
      } else if (isUnclassified) {
        unclassified++;
      } else {
        partiallyClassified++;
      }

      // Add to queue if not fully classified
      if (!isFully) {
        let cat = p.business_category || guessCategory(p.title);
        if (queueCounts[cat] !== undefined) {
          queueCounts[cat]++;
        } else {
          queueCounts['Other / Unknown']++;
        }
      }
    });

    const completionPercent = total > 0 ? ((fullyClassified / total) * 100).toFixed(1) : "0.0";
    const classificationPercent = total > 0 ? (((fullyClassified + partiallyClassified) / total) * 100).toFixed(1) : "0.0";

    const remaining = total - fullyClassified;
    
    // Forecast
    const estHours1 = (remaining / 60).toFixed(1);
    const estHours5 = (remaining / (5 * 60)).toFixed(1);
    const estHours10 = (remaining / (10 * 60)).toFixed(1);
    const dailyTarget = Math.ceil(remaining / 7);

    // Bottleneck logic
    const bottlenecks = [
      { name: 'Category Selection', count: missingCategory },
      { name: 'Subcategory Selection', count: missingSubcategory },
      { name: 'Fulfillment Model', count: missingFulfillment },
      { name: 'Collection Assignment', count: missingCollection }
    ];
    bottlenecks.sort((a, b) => b.count - a.count);
    const topBottleneck = bottlenecks[0];

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const reportContent = `# 🚀 CATALOG OPERATIONS CONTROL CENTER

*Live Priority 1 Command Center | Auto-updates from DB*
**Last Updated:** ${timestamp}

---

## 🎯 MACRO PROGRESS

- **Classification Progress (Touched):** ${classificationPercent}%
- **Completion Progress (100% Fully Classified):** ${completionPercent}%
- **Total Catalog Size:** ${total}

---

## 🛑 TOP BOTTLENECK

> **${topBottleneck.name.toUpperCase()}** is currently slowing completion the most.
> **${topBottleneck.count}** products are missing this field.

---

## ⚡ NEXT ACTION REQUIRED
*Direct your operational focus here to clear the queue rapidly:*

- **${missingCategory}** Products Missing Category
- **${missingSubcategory}** Products Missing Subcategory
- **${missingFulfillment}** Products Missing Fulfillment Model
- **${missingCollection}** Products Missing Collection Assignment

---

## 📥 CLASSIFICATION QUEUE
*Estimated grouping of remaining ${remaining} products based on AI title analysis:*

- **Half Sarees Remaining:** ${queueCounts['Half Sarees']}
- **Sarees Remaining:** ${queueCounts['Sarees']}
- **Lehengas Remaining:** ${queueCounts['Lehengas']}
- **Fabric Remaining:** ${queueCounts['Fabric']}
- **Dresses Remaining:** ${queueCounts['Dresses']}
- **Other/Unknown Remaining:** ${queueCounts['Other / Unknown']}

---

## ⏱️ PRODUCTIVITY FORECAST

**Time to 100% Completion based on operator speed:**
- At **1 product/minute**: ${estHours1} hours
- At **5 products/minute**: ${estHours5} hours
- At **10 products/minute**: ${estHours10} hours

**Daily Target (7-Day Completion Goal):**
- **${dailyTarget}** products per day required.

---

*Control Center is actively monitoring. All non-essential (Priority 2+) tasks remain locked until 100% Completion is achieved.*
`;

    const reportPath = path.join('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052', 'artifacts', 'CATALOG_CLASSIFICATION_PROGRESS_REPORT.md');
    fs.writeFileSync(reportPath, reportContent);
    console.log('V4 Control Center generated successfully.');

  } catch(e) {
    console.error(e);
  }
}
generateReport();
