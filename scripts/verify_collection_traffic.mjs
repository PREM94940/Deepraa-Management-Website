// scripts/verify_collection_traffic.mjs
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'public', 'screenshots');

async function main() {
  console.log('=== COLLECTION TRAFFIC VERIFICATION ===\n');

  const targetCollections = ['Bridal Collection', 'Designer Collection', 'Pattu Collection'];
  
  // 1. Get collections
  const { data: collections } = await supabase
    .from('collections')
    .select('id, name, slug')
    .in('name', targetCollections);
    
  if (!collections || collections.length === 0) {
    console.error('Target collections not found');
    process.exit(1);
  }

  // 2. For each collection, get exactly 1 product to track
  const trackingData = [];
  
  for (const coll of collections) {
    const { data: cpRows } = await supabase
      .from('collection_products')
      .select('product_id')
      .eq('collection_id', coll.id)
      .limit(1);
      
    if (cpRows && cpRows.length > 0) {
      const pid = cpRows[0].product_id;
      const { data: prod } = await supabase
        .from('products')
        .select('id, title, slug')
        .eq('id', pid)
        .single();
        
      if (prod) {
        trackingData.push({
          collectionName: coll.name,
          collectionSlug: coll.slug,
          productId: prod.id,
          productTitle: prod.title,
          productSlug: prod.slug
        });
      }
    }
  }

  console.log('Tracking Products:');
  console.log(JSON.stringify(trackingData, null, 2));
  console.log('\nStarting browser verification...\n');

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = [];

  for (const target of trackingData) {
    console.log(`\nVerifying: ${target.collectionName}`);
    const collUrl = `${BASE}/collections/${target.collectionSlug}`;
    console.log(`  Navigating to: ${collUrl}`);
    
    await page.goto(collUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if product is rendered (look for its title or a link containing its slug)
    const pageHtml = await page.content();
    const isRendered = pageHtml.includes(target.productSlug) || pageHtml.includes(target.productTitle.substring(0, 10));
    console.log(`  Product renders visually: ${isRendered ? '✅ YES' : '❌ NO'}`);
    
    // Check if customer can click to reach product page
    // We'll verify there's an <a> tag pointing to /products/[slug] or /[slug]
    const productLinks = await page.$$eval('a', (anchors, checkStr) => {
      return anchors.map(a => a.href).filter(h => h.includes(checkStr));
    }, target.productId);
    
    const canReachProduct = productLinks.length > 0;
    console.log(`  Customer can reach product page: ${canReachProduct ? '✅ YES' : '❌ NO'} (${productLinks.length} valid links found)`);

    const screenshotPath = path.join(OUT, `traffic_verify_${target.collectionSlug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  Screenshot saved: ${screenshotPath}`);

    results.push({
      ...target,
      isRendered,
      canReachProduct,
      screenshotPath
    });
  }

  await browser.close();

  console.log('\n=== JSON OUTPUT FOR AGENT ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
