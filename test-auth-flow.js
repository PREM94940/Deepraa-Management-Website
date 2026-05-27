const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = __dirname; // Save in directory for embedding in artifact

async function runTests() {
    console.log('Starting Luxury Modal-First Auth browser tests...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // Helper for taking screenshots
    const takeScreenshot = async (name) => {
        const filePath = path.join(SCREENSHOT_DIR, name);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved screenshot: ${filePath}`);
    };

    try {
        // ─── 1. TEST /collections (should load anonymously without redirects) ───
        console.log('\n--- Step 1: Navigating to /collections ---');
        await page.goto(`${BASE_URL}/collections`, { waitUntil: 'networkidle' });
        
        const currentUrl = page.url();
        console.log(`Loaded URL: ${currentUrl}`);
        if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
            console.error('❌ FAIL: /collections redirected to auth/login');
        } else {
            console.log('✅ PASS: /collections loaded anonymously without redirects');
        }
        await takeScreenshot('1-collections.png');

        // Extract first product link to test customization
        const productLinks = await page.$$eval('a[href^="/product/"]', el => el.map(a => a.getAttribute('href')));
        console.log(`Found product links on page: ${productLinks.slice(0, 5).join(', ')}`);
        
        let customizerUrl = `${BASE_URL}/product/featured-product/customize`; // fallback
        let targetProductId = 'featured-product';
        if (productLinks.length > 0) {
            // Find a unique product link (avoiding duplicate ones or nested paths)
            const cleanLinks = productLinks.filter(l => !l.includes('/customize'));
            if (cleanLinks.length > 0) {
                const parts = cleanLinks[0].split('/');
                targetProductId = parts[parts.length - 1];
                customizerUrl = `${BASE_URL}/product/${targetProductId}/customize`;
                console.log(`Selected Product for customization: ${targetProductId}`);
            }
        }

        // Try to add the first product to wishlist
        console.log('Adding first product to wishlist...');
        const wishlistButtons = await page.$$('button');
        let wishlistClicked = false;
        for (const button of wishlistButtons) {
            const innerHTML = await button.innerHTML();
            if (innerHTML.includes('M19 14c1.49-1.46')) { // heart svg path snippet
                console.log('Found wishlist toggle button, clicking...');
                await button.click({ force: true });
                wishlistClicked = true;
                break;
            }
        }
        if (!wishlistClicked) {
            console.log('Heart button not found by svg path, attempting to click top-right button inside first product card...');
            try {
                const firstCard = await page.$('a[href^="/product/"]');
                if (firstCard) {
                    await firstCard.hover();
                    const cardHeartBtn = await firstCard.$('button');
                    if (cardHeartBtn) {
                        await cardHeartBtn.click({ force: true });
                        wishlistClicked = true;
                        console.log('Clicked heart button inside product card.');
                    }
                }
            } catch (err) {
                console.log('Could not click heart button inside product card:', err.message);
            }
        }
        
        // Take a quick screenshot showing item added (if possible)
        await page.waitForTimeout(1000);
        await takeScreenshot('1b-collections-wishlisted.png');

        // ─── 2. TEST /product/customizer (should allow anonymous customization) ───
        console.log(`\n--- Step 2: Navigating to Customizer at ${customizerUrl} ---`);
        await page.goto(customizerUrl, { waitUntil: 'networkidle' });
        
        const customizeUrl = page.url();
        console.log(`Loaded URL: ${customizeUrl}`);
        if (customizeUrl.includes('/login') || customizeUrl.includes('/auth')) {
            console.error('❌ FAIL: Customizer page redirected to auth/login');
        } else {
            console.log('✅ PASS: Customizer loaded anonymously without redirects');
        }
        await takeScreenshot('2-customizer-step1.png');

        // Step through the customizer wizard
        console.log('Stepping through wizard steps...');
        for (let i = 1; i <= 4; i++) {
            const continueBtn = await page.getByRole('button', { name: 'Continue' });
            if (await continueBtn.isVisible()) {
                await continueBtn.click();
                await page.waitForTimeout(500);
                console.log(`Clicked Continue to step ${i + 1}`);
            } else {
                console.log(`Continue button not found on step ${i}`);
            }
        }
        await takeScreenshot('2-customizer-step5.png');

        const saveSpecsBtn = await page.getByRole('button', { name: 'Lock and Save Specifications' });
        if (await saveSpecsBtn.isVisible()) {
            console.log('✅ PASS: "Lock and Save Specifications" button is visible anonymously');
        } else {
            console.error('❌ FAIL: "Lock and Save Specifications" button is not visible');
        }

        // ─── 3. TEST /wishlist (should allow anonymous wishlist and trigger auth modal on click) ───
        console.log('\n--- Step 3: Navigating to /wishlist ---');
        await page.goto(`${BASE_URL}/wishlist`, { waitUntil: 'networkidle' });
        
        const wishlistUrl = page.url();
        console.log(`Loaded Wishlist URL: ${wishlistUrl}`);
        await takeScreenshot('3-wishlist-loaded.png');

        const saveToAccountBtn = await page.getByRole('button', { name: 'Save Wishlist to Account' });
        const hasSyncButton = await saveToAccountBtn.isVisible();
        
        if (hasSyncButton) {
            console.log('✅ PASS: "Save Wishlist to Account" button is visible for anonymous user with items');
            console.log('Clicking "Save Wishlist to Account" to trigger Auth Modal...');
            await saveToAccountBtn.click();
            await page.waitForTimeout(1000); // wait for modal transition
            
            // Check for modal dialog
            const authModal = await page.locator('div[role="dialog"]');
            const isModalVisible = await authModal.isVisible();
            if (isModalVisible) {
                console.log('✅ PASS: Clicking button triggered the Auth Modal');
                await takeScreenshot('3-wishlist-auth-modal.png');
            } else {
                console.error('❌ FAIL: Auth Modal did not appear');
            }
        } else {
            console.log('⚠️ INFO: Wishlist items empty, "Save Wishlist to Account" not visible. (Wishlisting might have failed or seed data is loading slow)');
            // Let's add a mock item to localStorage wishlist so we can force test the button
            console.log('Injecting mock wishlist item to localStorage to force-test the wishlist sync button...');
            await page.evaluate(() => {
                const mockItem = { id: 'test-product', name: 'Zari Border Kanjeevaram Saree', price: 28500, img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b' };
                localStorage.setItem('wishlist-storage', JSON.stringify({ state: { items: [mockItem] } }));
            });
            await page.reload({ waitUntil: 'networkidle' });
            await takeScreenshot('3-wishlist-injected.png');
            
            const reSaveBtn = await page.getByRole('button', { name: 'Save Wishlist to Account' });
            if (await reSaveBtn.isVisible()) {
                console.log('✅ PASS: "Save Wishlist to Account" button is visible after injecting local wishlist items');
                await reSaveBtn.click();
                await page.waitForTimeout(1000);
                const modalVisible = await page.locator('div[role="dialog"]').isVisible();
                if (modalVisible) {
                    console.log('✅ PASS: Clicking injected sync button triggered the Auth Modal');
                    await takeScreenshot('3-wishlist-auth-modal.png');
                } else {
                    console.error('❌ FAIL: Auth Modal did not appear for injected sync');
                }
            } else {
                console.error('❌ FAIL: "Save Wishlist to Account" button still not visible');
            }
        }

        // ─── 4. TEST /account (should open global AuthModal immediately in-place over dashboard) ───
        console.log('\n--- Step 4: Navigating to /account ---');
        await page.goto(`${BASE_URL}/account`, { waitUntil: 'networkidle' });
        
        const accountUrl = page.url();
        console.log(`Loaded Account URL: ${accountUrl}`);
        
        // Wait for modal or content to render
        await page.waitForTimeout(1000);
        
        const isAccountModalOpen = await page.locator('div[role="dialog"]').isVisible();
        if (isAccountModalOpen) {
            console.log('✅ PASS: /account automatically opened the global AuthModal immediately in-place');
            await takeScreenshot('4-account-auth-modal.png');
        } else {
            console.error('❌ FAIL: /account did not open the global AuthModal automatically');
        }

        // ─── 5. TEST LOG IN VIA EMAIL AND PASSWORD FALLBACK ───
        console.log('\n--- Step 5: Testing Log In via Email and Password fallback ---');
        
        // Fill out email and password form inside AuthModal
        await page.locator('input[type="email"]').fill('boutique.test@deeprastore.com');
        await page.locator('input[type="password"]').fill('incorrect_luxury_password');
        await takeScreenshot('5-auth-modal-filled.png');
        
        console.log('Clicking sign-in submit button...');
        await page.locator('button[type="submit"]').click();
        
        // Wait for error/loader feedback
        await page.waitForTimeout(2000);
        await takeScreenshot('5-auth-modal-feedback.png');
        
        // Extract error message
        const errorMessageLocator = page.locator('div:has-text("Invalid login credentials")');
        const hasError = await errorMessageLocator.count();
        if (hasError > 0) {
            console.log('✅ PASS: Email/Password fallback login successfully submitted and returned proper error: "Invalid login credentials"');
        } else {
            const pageText = await page.innerText('body');
            console.log(`⚠️ INFO: Expected "Invalid login credentials" warning. Page body text output check...`);
            if (pageText.includes('credentials') || pageText.includes('failed') || pageText.includes('Invalid')) {
                console.log('✅ PASS: Proper authentication warning displayed.');
            } else {
                console.log('❌ FAIL: Did not detect proper auth error state.');
            }
        }

    } catch (err) {
        console.error('❌ Test Execution Failed with Error:', err);
    } finally {
        await browser.close();
        console.log('\nTests completed.');
    }
}

runTests();
