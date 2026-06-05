const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://awyqinnivsvqsohfmmcj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg');

function tokenize(text) {
  if (!text) return new Set();
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const stopWords = new Set(['the', 'and', 'with', 'for', 'in', 'of', 'a', 'to']);
  return new Set(words.filter(w => w.length > 2 && !stopWords.has(w)));
}

function jaccardSimilarity(setA, setB) {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function extractSKUPrefix(sku) {
  if (!sku) return null;
  const match = sku.match(/^([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

function generateRecommendation(targetProduct, classifiedProducts) {
  let bestScore = 0;
  let bestMatch = null;
  const targetTokens = tokenize(targetProduct.title);
  const targetPrefix = extractSKUPrefix(targetProduct.sku);

  let fallbackCategory = '';
  const t = (targetProduct.title || '').toLowerCase();
  if (t.includes('half saree') || t.includes('voni')) fallbackCategory = 'Half Sarees';
  else if (t.includes('lehenga') || t.includes('choli')) fallbackCategory = 'Lehengas';
  else if (t.includes('saree') || t.includes('pattu') || t.includes('silk') || t.includes('sari')) fallbackCategory = 'Sarees';
  else if (t.includes('dress') || t.includes('gown') || t.includes('suit') || t.includes('kurti')) fallbackCategory = 'Dresses';
  else if (t.includes('fabric') || t.includes('unstitched') || t.includes('material')) fallbackCategory = 'Fabric';

  for (const cp of classifiedProducts) {
    if (cp.id === targetProduct.id) continue;
    let score = 0;
    const cpPrefix = extractSKUPrefix(cp.sku);
    if (targetPrefix && cpPrefix && targetPrefix === cpPrefix) {
      score += 0.55;
    }
    const cpTokens = tokenize(cp.title);
    const jaccard = jaccardSimilarity(targetTokens, cpTokens);
    score += (jaccard * 0.35);

    if (fallbackCategory && cp.business_category === fallbackCategory) {
      score += 0.10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = cp;
    }
  }

  if (bestMatch && bestScore > 0.3) {
    return {
      category: bestMatch.business_category || fallbackCategory,
      subcategory: bestMatch.business_subcategory || '',
      fulfillment: bestMatch.fulfillment_model || ''
    };
  } else if (fallbackCategory) {
    return { category: fallbackCategory, subcategory: '', fulfillment: '' };
  }
  return null;
}

async function runReport() {
  const { data: products } = await supabase.from('products').select('*').eq('is_test_data', false);
  const classified = products.filter(p => p.business_category && p.business_subcategory && p.fulfillment_model);
  
  let totalEvaluated = 0;
  let accepted = 0;
  let modified = 0;
  let rejected = 0;

  // Cross-validation (leave-one-out)
  for (const p of classified) {
    const trainingSet = classified.filter(c => c.id !== p.id);
    const rec = generateRecommendation(p, trainingSet);
    
    totalEvaluated++;
    if (rec) {
      const catMatch = rec.category === p.business_category;
      const subMatch = rec.subcategory === p.business_subcategory;
      const fulMatch = rec.fulfillment === p.fulfillment_model;
      
      if (catMatch && subMatch && fulMatch) accepted++;
      else if (catMatch || subMatch || fulMatch) modified++;
      else rejected++;
    } else {
      rejected++;
    }
  }

  const accPercent = totalEvaluated > 0 ? ((accepted / totalEvaluated) * 100).toFixed(1) : 0;
  const modPercent = totalEvaluated > 0 ? ((modified / totalEvaluated) * 100).toFixed(1) : 0;
  const rejPercent = totalEvaluated > 0 ? ((rejected / totalEvaluated) * 100).toFixed(1) : 0;
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const content = `# 🤖 AI Classification Accuracy Report
*Generated via Cross-Validation on Live Database*
**Last Updated:** ${timestamp}

## Performance Metrics
- **Recommendation Accuracy (Exact Match):** ${accPercent}%
- **Accepted Recommendations:** ${accPercent}%
- **Modified Recommendations:** ${modPercent}%
- **Rejected Recommendations:** ${rejPercent}%

## Training Data
- **Classified Products in Engine Memory:** ${classified.length}

*Note: The Hybrid Recommendation Engine uses exact SKU family matching (Priority 1), Token Jaccard Similarity (Priority 2), and Keyword heuristics (Priority 3). Accuracy will improve asymptotically as the human operator classifies more edge cases.*
`;

  const reportPath = path.join('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052', 'artifacts', 'AI_CLASSIFICATION_REPORT.md');
  fs.writeFileSync(reportPath, content);
  console.log('AI Report generated successfully.');
}
runReport();
