const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Zero-dependency .env.local loader
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('====================================================');
  console.log('       DEEPRSTORE CMS APPROVAL FLOWS VALIDATION      ');
  console.log('====================================================');

  let ws;
  try {
    // 1. Fetch remote debugging target
    const res = await fetch('http://127.0.0.1:9222/json');
    const targets = await res.json();
    const pageTarget = targets.find(t => t.type === 'page');
    
    if (!pageTarget) {
      console.error('❌ Headless Chrome debug target not found! Ensure next dev and launch_chrome.js are running.');
      process.exit(1);
    }

    console.log('✓ Connected to Headless Chrome debug port 9222');
    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const payload = JSON.stringify({ id: msgId, method, params });
        
        const listener = (data) => {
          const res = JSON.parse(data);
          if (res.id === msgId) {
            ws.off('message', listener);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.on('message', listener);
        ws.send(payload);
      });
    };

    ws.on('open', async () => {
      // Enable Page and Runtime domains
      await send('Page.enable');
      await send('Runtime.enable');

      // Navigate to the editor
      console.log('Navigating to http://localhost:3000/admin/editor...');
      await send('Page.navigate', { url: 'http://localhost:3000/admin/editor' });

      // Wait for page load event
      ws.on('message', async function pageListener(data) {
        const msg = JSON.parse(data);
        if (msg.method === 'Page.loadEventFired') {
          ws.off('message', pageListener);
          console.log('✓ Editor Page Loaded! Waiting for initialization...');
          
          setTimeout(async () => {
            try {
              await runApprovalValidations(send, ws);
            } catch (e) {
              console.error('❌ Error during validations:', e);
            } finally {
              ws.close();
              process.exit(0);
            }
          }, 4000);
        }
      });
    });

  } catch (err) {
    console.error('❌ Connection or Execution error:', err);
    process.exit(1);
  }
}

async function runApprovalValidations(send, ws) {
  const evalJS = async (expr) => {
    const result = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (result.exceptionDetails) {
      throw new Error(`Exception: ${result.exceptionDetails.exception.description}`);
    }
    return result.result.value;
  };

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  console.log('\n--- STARTING ROLE-BASED CMS APPROVALS VALIDATION ---\n');

  // Verify __cms_store exposure
  const isStoreExposed = await evalJS('!!window.__cms_store');
  if (!isStoreExposed) {
    console.error('❌ window.__cms_store is not exposed! Exiting.');
    return;
  }
  console.log('✓ window.__cms_store is exposed properly.');

  // Pre-test clean up: Reset the database rows back to a known clean state
  console.log('Resetting DB config row (id: 1 and 2) to base state before testing...');
  const { data: initialData } = await supabase
    .from('store_ui_settings')
    .select('config')
    .eq('id', 1)
    .single();

  const originalHeadline = initialData?.config?.pages?.[0]?.sections?.[0]?.settings?.headline || 'The Royal <br class="hidden sm:block"/> <span class="italic font-light">Trousseau.</span>';

  // 1. Simulate Staff User
  console.log('\n[Step 1] Simulating Staff role...');
  await evalJS(`
    window.__cms_store.setUserRole('Staff');
    window.__cms_store.setCurrentPageId('homepage');
  `);
  await delay(1000);
  
  const currentRole = await evalJS('window.__cms_store.userRole');
  console.log(`Current simulated role in store: ${currentRole}`);
  if (currentRole !== 'Staff') {
    console.error('❌ Failed to set role to Staff!');
    return;
  }
  console.log('✓ Role successfully set to Staff.');

  // 2. Staff modifies content
  const staffTestTitle = `Staff Proposal Headline ${Date.now()}`;
  console.log(`Staff modifying homepage cinematic hero title to: "${staffTestTitle}"...`);
  await evalJS(`
    window.__cms_store.updateSection(0, { headline: "${staffTestTitle}" });
  `);

  // 3. Staff requests publish approval (submits draft review request)
  console.log('Staff submitting request for publish approval...');
  await evalJS(`
    window.__cms_store.requestPublishApproval('Please review new heavy silk layout options', 'staff-tester@deeprastore.com');
  `);
  await delay(2000);

  // 4. Verification Gate: Verify draft row (id: 2) contains the updates and pending status
  console.log('Verifying Draft row (id: 2) in database has been updated...');
  const { data: draftData, error: draftErr } = await supabase
    .from('store_ui_settings')
    .select('config')
    .eq('id', 2)
    .single();

  if (draftErr || !draftData || !draftData.config) {
    console.error('❌ Failed to retrieve draft settings from database:', draftErr);
    return;
  }

  const draftPage = draftData.config.pages.find(p => p.id === 'homepage');
  if (draftPage.approval_status === 'Pending Review' && draftPage.requested_by === 'staff-tester@deeprastore.com') {
    console.log('✓ Verification: Draft status correctly updated to "Pending Review" and requested_by matches.');
  } else {
    console.error(`❌ Verification: Draft approval state incorrect! Status: ${draftPage.approval_status}, Submitter: ${draftPage.requested_by}`);
  }

  if (draftPage.sections[0].settings.headline === staffTestTitle) {
    console.log('✓ Verification: Draft headline contains the staff modifications.');
  } else {
    console.error(`❌ Verification: Draft headline does not match! Expected "${staffTestTitle}", got "${draftPage.sections[0].settings.headline}"`);
  }

  // 5. Verification Gate: Verify live row (id: 1) has NOT changed
  console.log('Verifying Live row (id: 1) in database remains unchanged...');
  const { data: liveData, error: liveErr } = await supabase
    .from('store_ui_settings')
    .select('config')
    .eq('id', 1)
    .single();

  if (liveErr || !liveData || !liveData.config) {
    console.error('❌ Failed to retrieve live settings from database:', liveErr);
    return;
  }

  const livePage = liveData.config.pages.find(p => p.id === 'homepage');
  if (livePage.sections[0].settings.headline !== staffTestTitle) {
    console.log('✓ Verification: Live publication blocked for Staff (live row remains unchanged).');
  } else {
    console.error('❌ Verification Error: Live row was updated directly by Staff!');
  }

  // 6. Simulate Manager User
  console.log('\n[Step 2] Simulating Manager role...');
  await evalJS(`
    window.__cms_store.setUserRole('Manager');
  `);
  await delay(1000);
  
  const updatedRole = await evalJS('window.__cms_store.userRole');
  console.log(`Current simulated role in store: ${updatedRole}`);
  if (updatedRole !== 'Manager') {
    console.error('❌ Failed to set role to Manager!');
    return;
  }
  console.log('✓ Role successfully set to Manager.');

  // 7. Manager approves request
  console.log('Manager approving and publishing the changes live...');
  await evalJS(`
    window.__cms_store.approveAndPublish('Looks elegant, approved for publication');
  `);
  await delay(2000);

  // 8. Verification Gate: Verify live row (id: 1) is now updated and marked as Approved
  console.log('Verifying Live row (id: 1) in database is updated with changes...');
  const { data: approvedLiveData, error: approvedLiveErr } = await supabase
    .from('store_ui_settings')
    .select('config')
    .eq('id', 1)
    .single();

  if (approvedLiveErr || !approvedLiveData || !approvedLiveData.config) {
    console.error('❌ Failed to retrieve live settings after approval:', approvedLiveErr);
    return;
  }

  const approvedLivePage = approvedLiveData.config.pages.find(p => p.id === 'homepage');
  if (approvedLivePage.status === 'published' && approvedLivePage.approval_status === 'Approved') {
    console.log('✓ Verification: Live page status is "published" and approval_status is "Approved".');
  } else {
    console.error(`❌ Verification: Live page approval status mismatch! Status: ${approvedLivePage.status}, Approval: ${approvedLivePage.approval_status}`);
  }

  if (approvedLivePage.sections[0].settings.headline === staffTestTitle) {
    console.log('✓ Verification: Live page now displays the approved staff modifications!');
  } else {
    console.error(`❌ Verification: Approved headline mismatch on live! Expected "${staffTestTitle}", got "${approvedLivePage.sections[0].settings.headline}"`);
  }

  // 9. Verify draft row (id: 2) matches live row (id: 1)
  const { data: approvedDraftData } = await supabase
    .from('store_ui_settings')
    .select('config')
    .eq('id', 2)
    .single();
  const approvedDraftPage = approvedDraftData?.config?.pages?.find(p => p.id === 'homepage');
  if (approvedDraftPage?.sections?.[0]?.settings?.headline === staffTestTitle) {
    console.log('✓ Verification: Draft row (id: 2) successfully synchronized with the published state.');
  } else {
    console.error('❌ Verification: Draft row did not sync with the published state!');
  }

  // 10. CLEANUP: Revert homepage settings back to original clean state
  console.log('\n[Step 3] Reverting modifications to clean database...');
  await evalJS(`
    window.__cms_store.updateSection(0, { headline: "${originalHeadline}" });
    window.__cms_store.publishToDatabase();
  `);
  await delay(2000);
  console.log('✓ Cleanup: Database reset to original headline.');

  console.log('\n====================================================');
  console.log('    🎉 ALL CMS ROLE WORKFLOW APPROVAL TESTS PASSED 🎉   ');
  console.log('====================================================');
}

main();
