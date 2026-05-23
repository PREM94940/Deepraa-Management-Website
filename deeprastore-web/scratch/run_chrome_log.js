const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const args = [
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\rodda\\AppData\\Local\\Temp\\chrome-debug-profile-node-temp',
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--remote-allow-origins=*'
];

console.log('Spawning Chrome directly...');
const child = spawn(chromePath, args);

child.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data.toString()}`);
});

child.stderr.on('data', (data) => {
  console.error(`STDERR: ${data.toString()}`);
});

child.on('close', (code) => {
  console.log(`Chrome process exited with code ${code}`);
});

setTimeout(() => {
  console.log('Timeout reached. Checking if Chrome is still running...');
  // Keep alive for 10 seconds to inspect
}, 10000);
