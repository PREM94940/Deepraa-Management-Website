const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  
  await page.type('input[type="password"]', 'temp_local_audit_key_123!');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.type('input[type="email"]', 'admin@deeprastore.com');
  const pwds = await page.$$('input[type="password"]');
  if (pwds.length > 0) {
      await pwds[pwds.length - 1].type('Prem@6494028218');
  }
  
  await page.click('button[type="submit"]');
  
  // Wait up to 10 seconds to see what happens
  await new Promise(r => setTimeout(r, 10000));
  
  // Check the current URL and button text
  const currentUrl = page.url();
  const buttonText = await page.evaluate(() => {
     const btns = document.querySelectorAll('button[type="submit"]');
     return btns.length > 0 ? btns[btns.length - 1].innerText : 'NO BUTTON';
  });
  const errorText = await page.evaluate(() => {
     const errEl = document.querySelector('.text-red-400');
     return errEl ? errEl.innerText : 'NO ERROR MESSAGE';
  });
  
  console.log('Current URL:', currentUrl);
  console.log('Button text:', buttonText);
  console.log('Error text:', errorText);
  
  const screenshotPath = path.join('C:/Users/rodda/.gemini/antigravity/brain/0aac562d-e1f5-40ab-a6fe-aeca34b92052', 'artifacts', 'login-debug-correct.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  await browser.close();
})();
