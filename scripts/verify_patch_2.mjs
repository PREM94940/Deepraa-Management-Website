import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';

async function verify() {
  console.log("=== STARTING BROWSER VERIFICATION: PATCH 2 ===");
  const browser = await puppeteer.launch({ headless: "new" });
  
  try {
    const page = await browser.newPage();
    let errors = 0;
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors++;
      }
    });

    console.log("Navigating to /collections/bridal-collection...");
    await page.goto(`${BASE_URL}/collections/bridal-collection`, { waitUntil: 'networkidle2' });
    
    const title = await page.title();
    
    const desc = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="description"]');
        return meta ? meta.getAttribute('content') : 'NOT FOUND';
    });
    
    console.log(`Title found: "${title}"`);
    console.log(`Description found: "${desc}"`);
    
    if (title === 'Deeprastore | Premium Indian Fashion') {
        console.error("FAIL: Title is still the layout default.");
    } else {
        console.log("SUCCESS: Dynamic Collection SEO Title verified.");
    }

    await page.screenshot({ path: 'public/screenshots/verify_patch_2.png' });
    
    console.log(`Verification Complete. Console errors: ${errors}`);
  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    await browser.close();
  }
}

verify().catch(console.error);
