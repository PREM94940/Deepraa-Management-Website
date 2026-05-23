const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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
  console.log('Fetching active Chrome targets...');
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  const pageTarget = targets.find(t => t.url.includes('/admin/editor'));
  
  if (!pageTarget) {
    console.error('❌ Active Theme Editor tab not found in Chrome! Please keep http://localhost:3000/admin/editor open.');
    process.exit(1);
  }

  console.log(`✓ Found Editor target: ${pageTarget.url}`);
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
      
      console.log('Retrieving logged-in user ID from browser Supabase context...');
      const evalResult = await send('Runtime.evaluate', {
        expression: `
          (async () => {
            try {
              const res = await supabase.auth.getUser();
              return res?.data?.user?.id || null;
            } catch (err) {
              return "Error: " + err.message;
            }
          })()
        `,
        awaitPromise: true,
        returnByValue: true
      });

      const userId = evalResult.result.value;
      if (!userId || userId.startsWith('Error')) {
        console.error('❌ Failed to retrieve user ID from browser:', userId);
        ws.close();
        return;
      }

      console.log(`✓ Retrieved User ID: ${userId}`);

      console.log('Inserting Manager role into staff_roles table in database...');
      const { data, error } = await supabase
        .from('staff_roles')
        .upsert({
          id: userId,
          email: 'admin@deeprastore.com',
          role: 'Manager'
        })
        .select();

      if (error) {
        console.error('❌ Database insertion failed:', error);
      } else {
        console.log('🎉 SUCCESSFULLY INSERTED MANAGER ROLE:', data);
        
        console.log('Swapping active session role in browser to Manager immediately...');
        await send('Runtime.evaluate', {
          expression: `
            if (window.__cms_store && typeof window.__cms_store.setUserRole === 'function') {
              window.__cms_store.setUserRole('Manager');
              console.log('Role swapped successfully in active editor!');
            }
          `
        });
      }

    } catch (e) {
      console.error('❌ Error executing insertion:', e);
    } finally {
      ws.close();
    }
  });
}

main();
