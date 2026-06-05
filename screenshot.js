const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  console.log('Navigating...');
  // Increase timeout to 60s for first compile
  await page.goto('http://localhost:3000/admin/catalog', { waitUntil: 'networkidle2', timeout: 60000 });
  
  console.log('Waiting for table...');
  try {
      await page.waitForSelector('table', { timeout: 20000 });
      await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
      console.log('Timeout waiting for table, taking screenshot anyway.');
  }
  
  console.log('Selecting first product to reveal bulk bar...');
  try {
      await page.click('tbody tr input[type="checkbox"]');
      await new Promise(r => setTimeout(r, 1000));
  } catch (e) { console.log('Could not click checkbox', e.message); }
  
  const screenshotPath = path.join('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052', 'artifacts', 'catalog-collections-verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved: ' + screenshotPath);
  await browser.close();
})();
