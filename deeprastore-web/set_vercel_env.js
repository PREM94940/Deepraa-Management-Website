const { spawn } = require('child_process');

function addEnv(key, value) {
  return new Promise((resolve) => {
    console.log(`Removing ${key}...`);
    const p = spawn('npx', ['vercel', 'env', 'rm', key, 'production', '-y'], { shell: true });
    p.on('close', () => {
      console.log(`Adding ${key}...`);
      const p2 = spawn('npx', ['vercel', 'env', 'add', key, 'production'], { shell: true });
      p2.stdin.write(value);
      p2.stdin.end();
      p2.stdout.on('data', d => process.stdout.write(d));
      p2.stderr.on('data', d => process.stderr.write(d));
      p2.on('close', () => {
        console.log(`Done adding ${key}`);
        resolve();
      });
    });
  });
}

async function run() {
  await addEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://awyqinnivsvqsohfmmcj.supabase.co');
  await addEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'sb_publishable_5nXXqL13Cd_RGDOA9NCwSA_y4vfer4K');
  console.log('Finished updating Vercel env vars!');
}

run();
