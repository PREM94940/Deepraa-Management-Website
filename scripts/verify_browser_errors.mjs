// scripts/verify_browser_errors.mjs
import puppeteer from 'puppeteer';

async function main() {
  console.log('=== CHECKING BROWSER CONSOLE ERRORS ===');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  await page.goto('http://localhost:3000/collections/designer-collection', { waitUntil: 'networkidle0' });
  
  await browser.close();
}

main().catch(console.error);
