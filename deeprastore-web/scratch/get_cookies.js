const WebSocket = require('ws');

async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  const pageTarget = targets.find(t => t.type === 'page');
  
  if (!pageTarget) {
    console.error('❌ Headless Chrome debug target not found!');
    process.exit(1);
  }

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

  ws.on('open', async () => {
    try {
      await send('Runtime.enable');
      
      // Get document.cookie
      const cookieResult = await send('Runtime.evaluate', {
        expression: 'document.cookie',
        returnByValue: true
      });
      console.log('document.cookie:', cookieResult.result.value);

      // Check if there is an exposed supabase client or check __cms_store
      const storeResult = await send('Runtime.evaluate', {
        expression: '!!window.__cms_store',
        returnByValue: true
      });
      console.log('__cms_store exposed:', storeResult.result.value);

      if (storeResult.result.value) {
        const emailResult = await send('Runtime.evaluate', {
          expression: 'window.__cms_store.userRole',
          returnByValue: true
        });
        console.log('Current store userRole:', emailResult.result.value);
      }

      // Check current user via Supabase auth if we can import or access it
      const userResult = await send('Runtime.evaluate', {
        expression: `
          (async () => {
            try {
              // If there's a next/dist or similar or if we can evaluate the auth cookies:
              return document.cookie;
            } catch(e) {
              return e.message;
            }
          })()
        `,
        awaitPromise: true,
        returnByValue: true
      });
      console.log('User evaluation:', userResult.result.value);

    } catch (e) {
      console.error(e);
    } finally {
      ws.close();
    }
  });
}

main();
