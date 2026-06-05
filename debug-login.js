const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.setViewport({ width: 1440, height: 900 });
  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2', timeout: 60000 });
  
  console.log('Entering gatekey...');
  await page.type('input[type="password"]', 'temp_local_audit_key_123!');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Entering credentials...');
  await page.type('input[type="email"]', 'admin@deeprastore.com');
  // the second password input
  await page.type('input[type="password"]', 'Prem@6494028218');
  await page.click('button[type="submit"]');
  
  console.log('Waiting after clicking login...');
  await new Promise(r => setTimeout(r, 5000));
  
  const screenshotPath = path.join('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052', 'artifacts', 'login-debug.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved screenshot: ' + screenshotPath);
  await browser.close();
})();
