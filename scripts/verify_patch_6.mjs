import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';

async function verify() {
  console.log("=== STARTING BROWSER VERIFICATION: PATCH 6 ===");
  const browser = await puppeteer.launch({ headless: "new" });
  
  try {
    const page = await browser.newPage();
    
    console.log("Navigating to /collections/bridal-collection...");
    await page.goto(`${BASE_URL}/collections/bridal-collection`, { waitUntil: 'networkidle2' });
    
    const canonical = await page.evaluate(() => {
        const link = document.querySelector('link[rel="canonical"]');
        return link ? link.getAttribute('href') : 'NOT FOUND';
    });
    
    console.log(`Canonical URL found: "${canonical}"`);
    
    if (canonical === 'https://deeprastore.com/collections/bridal-collection') {
        console.log("SUCCESS: Canonical URL correctly generated.");
    } else {
        console.error("FAIL: Canonical URL incorrect or missing.");
    }

    await page.screenshot({ path: 'public/screenshots/verify_patch_6.png' });
    
  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    await browser.close();
  }
}

verify().catch(console.error);
