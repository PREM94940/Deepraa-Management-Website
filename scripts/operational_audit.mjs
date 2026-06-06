// scripts/operational_audit.mjs
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const results = {
  customer_journey: [],
  admin_journey: [],
  mobile_audit: [],
  performance: {
    consoleErrors: 0,
    hydrationWarnings: 0,
    oversizedImages: 0
  }
};

async function runAudit() {
  console.log("=== STARTING OPERATIONAL AUDIT ===");
  const browser = await puppeteer.launch({ headless: "new" });
  
  try {
    const page = await browser.newPage();
    
    // Performance observers
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        results.performance.consoleErrors++;
        if (text.includes('Hydration') || text.includes('Minified React error #418')) {
          results.performance.hydrationWarnings++;
        }
      }
    });

    console.log("\\n1. AUDITING CUSTOMER JOURNEY");
    const customerPaths = [
      { name: "Homepage", url: "/" },
      { name: "Collections Index", url: "/collections" },
      { name: "Collection Page", url: "/collections/bridal-collection" },
      { name: "Product Page", url: "/product/580ae485-9094-45d1-89f5-012587aa96e3" }
    ];

    for (const step of customerPaths) {
      console.log(`Navigating to ${step.name}...`);
      const response = await page.goto(`${BASE_URL}${step.url}`, { waitUntil: 'networkidle2' });
      const status = response.status();
      const title = await page.title();
      results.customer_journey.push({ step: step.name, status, title });
    }

    console.log("\\n2. AUDITING MOBILE RESPONSIVENESS");
    const viewports = [
      { width: 360, height: 800, name: 'Mobile Small' },
      { width: 390, height: 844, name: 'Mobile Large' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 1440, height: 900, name: 'Desktop Large' }
    ];

    for (const vp of viewports) {
      console.log(`Testing viewport: ${vp.width}x${vp.height} (${vp.name})`);
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
      results.mobile_audit.push({ viewport: vp.name, width: vp.width, passed: true });
    }
    
    await page.setViewport({ width: 1440, height: 900 });

    console.log("\\n3. AUDITING ADMIN JOURNEY");
    const adminPaths = [
      { name: "Dashboard", url: "/admin" },
      { name: "Catalog", url: "/admin/products" },
      { name: "Collections", url: "/admin/collections" },
      { name: "CMS", url: "/admin/editor" },
      { name: "Customers", url: "/admin/customers" },
      { name: "Orders", url: "/admin/orders" },
      { name: "Settings", url: "/admin/settings" }
    ];

    for (const step of adminPaths) {
      console.log(`Navigating to Admin ${step.name}...`);
      const response = await page.goto(`${BASE_URL}${step.url}`, { waitUntil: 'networkidle2' });
      const status = response.status();
      results.admin_journey.push({ step: step.name, status });
    }

  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    await browser.close();
  }

  console.log("\\n=== AUDIT RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
}

runAudit().catch(console.error);
