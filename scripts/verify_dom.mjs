// scripts/verify_dom.mjs
import puppeteer from 'puppeteer';

async function main() {
  console.log('=== CHECKING BROWSER DOM ===');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/collections/designer-collection', { waitUntil: 'networkidle0' });
  
  const html = await page.content();
  console.log('HTML Length:', html.length);
  
  // Extract all text content in main
  const text = await page.$eval('main', el => el.innerText);
  console.log('Main text snippet:', text.substring(0, 500));
  
  await browser.close();
}

main().catch(console.error);
