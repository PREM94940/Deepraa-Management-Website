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
      
      // Evaluate localStorage keys
      const keysResult = await send('Runtime.evaluate', {
        expression: 'JSON.stringify(Object.keys(localStorage))',
        returnByValue: true
      });
      console.log('localStorage keys:', keysResult.result.value);

      // Evaluate localStorage items containing auth token
      const authResult = await send('Runtime.evaluate', {
        expression: `
          (() => {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k.includes('auth-token')) {
                return localStorage.getItem(k);
              }
            }
            return null;
          })()
        `,
        returnByValue: true
      });
      
      if (authResult.result.value) {
        const tokenData = JSON.parse(authResult.result.value);
        console.log('Found Auth Token:', {
          id: tokenData.user?.id,
          email: tokenData.user?.email,
          role: tokenData.user?.role
        });
      } else {
        console.log('No auth token found in localStorage.');
      }

    } catch (e) {
      console.error(e);
    } finally {
      ws.close();
    }
  });
}

main();
