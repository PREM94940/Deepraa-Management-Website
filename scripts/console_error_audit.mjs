// scripts/console_error_audit.mjs
import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const consoleErrors = [];

async function runAudit() {
  console.log("=== STARTING CONSOLE ERROR AUDIT ===");
  const browser = await puppeteer.launch({ headless: "new" });
  
  try {
    const page = await browser.newPage();
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()?.url || 'unknown',
          lineNumber: msg.location()?.lineNumber || 'unknown'
        });
      }
    });

    const paths = [
      "/",
      "/collections",
      "/collections/bridal-collection",
      "/product/580ae485-9094-45d1-89f5-012587aa96e3",
      "/admin",
      "/admin/products",
      "/admin/collections",
      "/admin/editor",
      "/admin/customers",
      "/admin/orders",
      "/admin/settings"
    ];

    for (const p of paths) {
      console.log(`Navigating to ${p}...`);
      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'networkidle2' });
    }

  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    await browser.close();
  }

  fs.writeFileSync('console_errors_log.json', JSON.stringify(consoleErrors, null, 2));
  console.log(`Captured ${consoleErrors.length} console messages.`);
  console.log("=== AUDIT COMPLETE ===");
}

runAudit().catch(console.error);
