const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const versionRes = await fetch('http://127.0.0.1:9222/json/version');
    const versionData = await versionRes.json();
    console.log('--- JSON VERSION ---');
    console.log(JSON.stringify(versionData, null, 2));

    const webSocketDebuggerUrl = versionData.webSocketDebuggerUrl;
    if (!webSocketDebuggerUrl) {
      throw new Error('webSocketDebuggerUrl is missing in the version response!');
    }

    const url = new URL(webSocketDebuggerUrl);
    const wsPath = url.pathname;
    console.log('WebSocket path extracted:', wsPath);

    const devToolsActivePortPath = 'C:\\Users\\rodda\\AppData\\Local\\Google\\Chrome\\User Data\\DevToolsActivePort';
    
    // Ensure parent directories exist
    fs.mkdirSync(path.dirname(devToolsActivePortPath), { recursive: true });
    
    // Write active port details
    const fileContent = `9222\n${wsPath}\n`;
    fs.writeFileSync(devToolsActivePortPath, fileContent, 'utf-8');
    console.log(`Successfully wrote DevToolsActivePort to ${devToolsActivePortPath}`);

  } catch (err) {
    console.error('Error:', err.message);
  }
}
main();
