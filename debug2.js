const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  
  await page.type('input[type="password"]', 'temp_local_audit_key_123!');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.type('input[type="email"]', 'admin@deeprastore.com');
  // There is another password input now
  const pwds = await page.$$('input[type="password"]');
  if (pwds.length > 0) {
      await pwds[pwds.length - 1].type('wrongpassword');
  }
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 3000));
  
  const buttonText = await page.evaluate(() => {
     const btns = document.querySelectorAll('button[type="submit"]');
     return btns.length > 0 ? btns[btns.length - 1].innerText : 'NO BUTTON';
  });
  const errorText = await page.evaluate(() => {
     const errEl = document.querySelector('.text-red-400');
     return errEl ? errEl.innerText : 'NO ERROR MESSAGE';
  });
  
  console.log('Button text:', buttonText);
  console.log('Error text:', errorText);
  await browser.close();
})();
