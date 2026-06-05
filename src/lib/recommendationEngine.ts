type Product = any; // Will match page.tsx Product type
type Collection = any; // Will match page.tsx Collection type

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const stopWords = new Set(['the', 'and', 'with', 'for', 'in', 'of', 'a', 'to']);
  return new Set(words.filter(w => w.length > 2 && !stopWords.has(w)));
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function extractSKUPrefix(sku: string | null): string | null {
  if (!sku) return null;
  // e.g., DP210-RED -> DP210, or just extract first continuous alphanumeric block
  const match = sku.match(/^([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

export function generateRecommendation(
  targetProduct: Product, 
  classifiedProducts: Product[],
  allCollections: Collection[],
  productCollections: Record<string, Set<string>>
) {
  let bestScore = 0;
  let bestMatch: Product | null = null;
  let skuMatchCount = 0;
  let similarProductsCount = 0;
  let reasoning = [];

  const targetTokens = tokenize(targetProduct.title);
  const targetPrefix = extractSKUPrefix(targetProduct.sku);

  // Fallback heuristics
  let fallbackCategory = '';
  const t = targetProduct.title.toLowerCase();
  if (t.includes('half saree') || t.includes('voni')) fallbackCategory = 'Half Sarees';
  else if (t.includes('lehenga') || t.includes('choli')) fallbackCategory = 'Lehengas';
  else if (t.includes('saree') || t.includes('pattu') || t.includes('silk') || t.includes('sari')) fallbackCategory = 'Sarees';
  else if (t.includes('dress') || t.includes('gown') || t.includes('suit') || t.includes('kurti')) fallbackCategory = 'Dresses';
  else if (t.includes('fabric') || t.includes('unstitched') || t.includes('material')) fallbackCategory = 'Fabric';

  // Compare against training set
  for (const cp of classifiedProducts) {
    if (cp.id === targetProduct.id) continue;
    
    let score = 0;
    
    // 1. Exact SKU Family Match (Highest Weight - 55%)
    const cpPrefix = extractSKUPrefix(cp.sku);
    let hasSkuMatch = false;
    if (targetPrefix && cpPrefix && targetPrefix === cpPrefix) {
      score += 0.55;
      hasSkuMatch = true;
      skuMatchCount++;
    }

    // 2. Title Similarity Jaccard (Weight - 35%)
    const cpTokens = tokenize(cp.title);
    const jaccard = jaccardSimilarity(targetTokens, cpTokens);
    score += (jaccard * 0.35);

    // 3. Keyword Heuristic Match (Weight - 10%)
    if (fallbackCategory && cp.business_category === fallbackCategory) {
      score += 0.10;
    }

    if (score > 0.4) {
      similarProductsCount++;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = cp;
    }
  }

  let recommended = {
    category: '',
    subcategory: '',
    fulfillment: '',
    collections: new Set<string>(),
    confidence: 0,
    reasoning: [] as string[]
  };

  if (bestMatch && bestScore > 0.3) {
    // We have a solid match
    recommended.category = bestMatch.business_category || fallbackCategory;
    recommended.subcategory = bestMatch.business_subcategory || '';
    recommended.fulfillment = bestMatch.fulfillment_model || '';
    recommended.collections = productCollections[bestMatch.id] ? new Set(productCollections[bestMatch.id]) : new Set<string>();
    
    // Calculate final confidence 0-100
    recommended.confidence = Math.min(Math.round(bestScore * 100), 100);

    recommended.reasoning.push(`✓ Similar to ${similarProductsCount} classified products`);
    if (skuMatchCount > 0) {
      recommended.reasoning.push(`✓ SKU Family Match (${targetPrefix})`);
    }
    const bestJaccard = jaccardSimilarity(targetTokens, tokenize(bestMatch.title));
    if (bestJaccard > 0.2) {
      recommended.reasoning.push(`✓ Title Similarity ${Math.round(bestJaccard * 100)}%`);
    }
  } else if (fallbackCategory) {
    // Only keyword fallback available
    recommended.category = fallbackCategory;
    recommended.confidence = 45; // Low confidence
    recommended.reasoning.push(`✓ Keyword Heuristic Match (${fallbackCategory})`);
  } else {
    // Complete failure to recommend
    return null;
  }

  return recommended;
}
