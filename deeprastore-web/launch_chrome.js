const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const args = [
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Users\\rodda\\AppData\\Local\\Temp\\chrome-debug-profile-node',
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-software-rasterizer',
  '--enable-logging=stderr',
  '--v=1'
];

console.log('Spawning Chrome with logs...');
const out = fs.openSync('C:\\Users\\rodda\\AppData\\Local\\Temp\\chrome_stdout.log', 'w');
const err = fs.openSync('C:\\Users\\rodda\\AppData\\Local\\Temp\\chrome_stderr.log', 'w');

const child = spawn(chromePath, args, {
  detached: true,
  stdio: [ 'ignore', out, err ]
});

child.unref();
console.log('Chrome spawned with PID:', child.pid);

setTimeout(() => {
  console.log('Exiting launch script.');
  process.exit(0);
}, 3000);
