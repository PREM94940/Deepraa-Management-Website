import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

async function verify() {
  console.log("=== STARTING BROWSER VERIFICATION: PATCH 1 ===");
  const browser = await puppeteer.launch({ headless: "new" });
  
  try {
    const page = await browser.newPage();
    let errors = 0;
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors++;
        console.log("Console Error:", msg.text());
      }
    });

    console.log("Navigating to /admin/settings...");
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle2' });
    
    console.log("Clicking Save Changes button...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const save = btns.find(b => b.innerText.includes('Save Changes'));
        if(save) save.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({ path: 'public/screenshots/verify_patch_1.png' });
    
    console.log(`Verification Complete. Console errors during save: ${errors}`);
  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    await browser.close();
  }
}

verify().catch(console.error);
