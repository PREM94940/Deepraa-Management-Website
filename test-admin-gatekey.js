const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://deepraa-management-website.vercel.app';
const ARTIFACTS_DIR = 'C:\\Users\\rodda\\.gemini\\antigravity\\brain\\b37fd918-e1b1-42d9-a027-344efe510399';

async function runTests() {
    console.log('Starting Deeprastore Admin Gatekey and Access browser tests...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    
    const consoleLogs = [];
    const consoleErrors = [];
    const consoleWarnings = [];

    const page = await context.newPage();

    // Listen to console events
    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();
        if (type === 'error') {
            consoleErrors.push(text);
        } else if (type === 'warning' || type === 'warn') {
            consoleWarnings.push(text);
        } else {
            consoleLogs.push(text);
        }
    });

    // Helper for taking screenshots
    const takeScreenshot = async (name) => {
        const filePath = path.join(ARTIFACTS_DIR, name);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved screenshot: ${filePath}`);
    };

    try {
        // ─── 1. Navigating to Homepage ───
        console.log('\n--- Step 1: Navigating to Homepage ---');
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        console.log(`Loaded URL: ${page.url()}`);
        await takeScreenshot('homepage.png');

        // ─── 2. Verify that Admin button is NOT present in the header ───
        console.log('\n--- Step 2: Verifying Admin is NOT in the Header ---');
        const header = page.locator('header');
        const headerText = await header.innerText().catch(() => '');
        console.log(`Header Text content snippet: "${headerText.substring(0, 100)}..."`);
        
        const hasAdminInHeader = headerText.toLowerCase().includes('admin');
        if (hasAdminInHeader) {
            console.error('❌ FAIL: Header contains references to "Admin"');
        } else {
            console.log('✅ PASS: Header does not contain "Admin" button/references.');
        }

        // ─── 3. Scroll to the bottom and click "Admin Access" link ───
        console.log('\n--- Step 3: Scrolling to bottom and finding "Admin Access" in footer ---');
        // Scroll to the bottom of the page
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        await takeScreenshot('footer.png');

        // Find Admin Access link/button
        const adminAccessLink = page.locator('text="Admin Access"');
        const isVisible = await adminAccessLink.isVisible();
        if (!isVisible) {
            console.error('❌ FAIL: "Admin Access" link in footer is not visible.');
            // Try fallback selectors
            const allLinks = await page.$$eval('a', el => el.map(a => ({ text: a.innerText, href: a.getAttribute('href') })));
            console.log('All links found on page:', allLinks);
        } else {
            console.log('✅ PASS: "Admin Access" link in footer is visible.');
            console.log('Clicking "Admin Access" link...');
            await adminAccessLink.click();
        }

        // ─── 4. Verify security modal and input gatekey ───
        console.log('\n--- Step 4: Interacting with security modal ---');
        await page.waitForTimeout(1000);
        await takeScreenshot('gatekey-modal.png');

        // Check if modal or modal-input is present
        const inputLocator = page.locator('input[placeholder*="gatekey" i], input[type="password"], input[type="text"]');
        const count = await inputLocator.count();
        console.log(`Found ${count} possible input fields inside the modal`);
        
        if (count > 0) {
            console.log('Typing gatekey "deeprastaff2026"...');
            await inputLocator.first().fill('deeprastaff2026');
            
            console.log('Pressing Enter key to verify...');
            await inputLocator.first().press('Enter');
        } else {
            console.error('❌ FAIL: Could not locate gatekey input field in the modal.');
        }

        // ─── 5. Verify redirection to /admin/login ───
        console.log('\n--- Step 5: Checking redirection to /admin/login ---');
        await page.waitForURL('**/admin/login', { timeout: 10000 }).catch(err => {
            console.error('Redirection timeout or error:', err.message);
        });
        
        const finalUrl = page.url();
        console.log(`Final URL after Gatekey submission: ${finalUrl}`);
        if (finalUrl.includes('/admin/login')) {
            console.log('✅ PASS: Successfully redirected to /admin/login');
        } else {
            console.error('❌ FAIL: Redirection to /admin/login failed. Current URL:', finalUrl);
        }

        // Wait for page to fully load and settle
        await page.waitForTimeout(2000);
        await takeScreenshot('admin-login.png');

        // ─── 6. Analyze Layout of /admin/login ───
        console.log('\n--- Step 6: Checking page layout and crashes ---');
        const bodyText = await page.innerText('body');
        if (bodyText.includes('Internal Server Error') || bodyText.includes('Application error') || bodyText.includes('404') || bodyText.includes('500')) {
            console.error('❌ FAIL: Admin login page appears to have crashed or returned an error page.');
        } else {
            console.log('✅ PASS: Admin login page loaded without route crash/layout crash.');
        }

        // Output results
        console.log('\n--- SUMMARY OF CONSOLE ERRORS & WARNINGS ---');
        console.log(`Console Errors count: ${consoleErrors.length}`);
        consoleErrors.forEach((err, idx) => console.log(`  [Error ${idx + 1}]: ${err}`));
        console.log(`Console Warnings count: ${consoleWarnings.length}`);
        consoleWarnings.forEach((warn, idx) => console.log(`  [Warning ${idx + 1}]: ${warn}`));

        // Write summary report to file
        const report = {
            url: finalUrl,
            status: finalUrl.includes('/admin/login') ? 'PASS' : 'FAIL',
            errors: consoleErrors,
            warnings: consoleWarnings,
            bodySnippet: bodyText.substring(0, 300)
        };
        fs.writeFileSync(path.join(ARTIFACTS_DIR, 'test_report.json'), JSON.stringify(report, null, 2));

    } catch (err) {
        console.error('❌ Test execution encountered an unhandled error:', err);
    } finally {
        await browser.close();
        console.log('\nBrowser testing completed.');
    }
}

runTests();
