const WebSocket = require('ws');

async function main() {
  console.log('Connecting to Chrome Theme Editor tab...');
  try {
    const res = await fetch('http://127.0.0.1:9222/json');
    const targets = await res.json();
    const pageTarget = targets.find(t => t.url.includes('/admin/editor'));
    
    if (!pageTarget) {
      console.error('❌ Active Theme Editor tab not found in Chrome! Make sure http://localhost:3000/admin/editor is open.');
      process.exit(1);
    }

    console.log(`✓ Found target page: ${pageTarget.url}`);
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const msgId = Math.floor(Math.random() * 100000);
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

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    ws.on('open', async () => {
      try {
        await send('Page.enable');
        await send('Runtime.enable');
        
        console.log('Performing hard reload on Theme Editor tab to clear browser cache...');
        await send('Page.reload', { ignoreCache: true });
        
        console.log('Waiting 6 seconds for page compilation and load...');
        await delay(6000);
        
        console.log('Triggering grantManagerRole server action in browser context...');
        const actionResult = await send('Runtime.evaluate', {
          expression: `
            (async () => {
              try {
                if (!window.__cms_store || !window.__cms_store.grantManagerRole) {
                  return { success: false, error: "__cms_store.grantManagerRole not exposed yet! Try refreshing the page." };
                }
                const res = await window.__cms_store.grantManagerRole();
                return res;
              } catch (err) {
                return { success: false, error: err.message };
              }
            })()
          `,
          awaitPromise: true,
          returnByValue: true
        });

        const result = actionResult.result.value;
        console.log('Result from server action:', result);

        if (result && result.success) {
          console.log('🎉 MANAGER ROLE SUCCESSFULLY GRANTED IN DATABASE!');
          
          console.log('Refreshing browser page to apply the Manager role...');
          await send('Runtime.evaluate', {
            expression: 'location.reload()'
          });
          console.log('✓ Browser refreshed successfully.');
        } else {
          console.error('❌ Role insertion failed:', result?.error || 'Unknown error');
        }

      } catch (e) {
        console.error('❌ Error executing:', e);
      } finally {
        ws.close();
      }
    });

  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

main();
