const WebSocket = require('ws');

async function main() {
  try {
    // 1. Fetch target list
    const res = await fetch('http://127.0.0.1:9222/json');
    const targets = await res.json();
    console.log('Targets:', targets);

    // Find the page target (or use the first one)
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) {
      console.error('No page target found!');
      return;
    }

    console.log('Connecting to Page target WS:', pageTarget.webSocketDebuggerUrl);
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

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
      console.log('Connected to DevTools WebSocket!');
      
      // Enable Page and Runtime
      await send('Page.enable');
      await send('Runtime.enable');

      // Navigate to admin editor
      console.log('Navigating to http://localhost:3000/admin/editor...');
      await send('Page.navigate', { url: 'http://localhost:3000/admin/editor' });

      // Wait for page load event
      ws.on('message', async function pageListener(data) {
        const msg = JSON.parse(data);
        if (msg.method === 'Page.loadEventFired') {
          ws.off('message', pageListener);
          console.log('Page loaded! Waiting 3 seconds for client-side render...');
          
          setTimeout(async () => {
            // Evaluate page state
            const evalResult = await send('Runtime.evaluate', {
              expression: 'document.title'
            });
            console.log('Document title:', evalResult.result.value);

            const bodyText = await send('Runtime.evaluate', {
              expression: 'document.body.innerText.substring(0, 300)'
            });
            console.log('Body Text Snippet:', bodyText.result.value);

            ws.close();
          }, 3000);
        }
      });
    });

  } catch (err) {
    console.error('Error in main:', err);
  }
}

main();
