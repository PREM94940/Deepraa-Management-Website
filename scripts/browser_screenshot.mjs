// scripts/browser_screenshot.mjs
// Takes browser screenshots for the collection fix verification report.
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
  // Get a real collection with products for verification
  const { data: cpRows } = await supabase
    .from('collection_products')
    .select('collection_id')
    .limit(20);
  
  // Find which collection has the most products
  const countMap = {};
  cpRows.forEach(r => { countMap[r.collection_id] = (countMap[r.collection_id] || 0) + 1; });
  const topCollectionId = Object.entries(countMap).sort((a,b) => b[1]-a[1])[0]?.[0];

  const { data: coll } = await supabase
    .from('collections')
    .select('id, name, slug')
    .eq('id', topCollectionId)
    .single();

  console.log(`Testing collection: "${coll?.name}" (slug: ${coll?.slug})`);

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const screenshots = [];

  // Screenshot 1: Admin Catalog page (shows collection_products being read)
  console.log('Taking screenshot 1: Admin Catalog...');
  try {
    await page.goto(`${BASE}/admin/catalog`, { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));
    const s1 = path.join(OUT, 'verify_admin_catalog.png');
    await page.screenshot({ path: s1, fullPage: false });
    screenshots.push({ name: 'Admin Catalog', path: s1 });
    console.log('  Saved:', s1);
  } catch (e) {
    console.log('  Screenshot 1 error:', e.message);
  }

  // Screenshot 2: Collection page (storefront reads from collection_products)
  if (coll?.slug) {
    console.log(`Taking screenshot 2: /collections/${coll.slug}...`);
    try {
      await page.goto(`${BASE}/collections/${coll.slug}`, { waitUntil: 'networkidle0', timeout: 20000 });
      await new Promise(r => setTimeout(r, 3000));
      const s2 = path.join(OUT, 'verify_collection_storefront.png');
      await page.screenshot({ path: s2, fullPage: false });
      screenshots.push({ name: `Collection: ${coll.name}`, path: s2 });
      console.log('  Saved:', s2);
    } catch (e) {
      console.log('  Screenshot 2 error:', e.message);
    }
  }

  // Screenshot 3: Database state evidence — query result shown in console
  console.log('\nDatabase state after migration:');
  const { data: finalCount } = await supabase.from('collection_products').select('collection_id, product_id', { count: 'exact', head: false });
  console.log(`  collection_products: ${finalCount?.length} rows`);

  await browser.close();
  
  console.log('\nScreenshot files saved:');
  screenshots.forEach(s => console.log(`  ${s.name}: ${s.path}`));
}

main().catch(console.error);
