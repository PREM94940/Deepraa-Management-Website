/**
 * Deeprastore Full Route QA Test
 * Tests all critical routes on both local dev and Vercel live deployment
 */

const https = require('https');
const http = require('http');

const BASE_VERCEL = 'https://deepraa-management-website.vercel.app';
const BASE_LOCAL  = 'http://localhost:3000';

const routes = [
  // Customer Pages
  { path: '/',                        name: 'Homepage',               group: 'Storefront' },
  { path: '/collections',             name: 'Collections',            group: 'Storefront' },
  { path: '/custom-stitching',        name: 'Custom Stitching',       group: 'Storefront' },
  { path: '/lookbook',                name: 'Lookbook',               group: 'Storefront' },
  { path: '/track',                   name: 'Track Order',            group: 'Storefront' },
  { path: '/support',                 name: 'Support',                group: 'Storefront' },
  { path: '/whatsapp-form',           name: 'WhatsApp Form',          group: 'Storefront' },
  { path: '/wishlist',                name: 'Wishlist',               group: 'Storefront' },
  { path: '/login',                   name: 'Login',                  group: 'Auth' },
  { path: '/account',                 name: 'Account Dashboard',      group: 'Auth' },
  { path: '/account/replacement',     name: 'Replacement Form',       group: 'Auth' },
  // Admin Pages
  { path: '/admin/login',             name: 'Admin Login',            group: 'Admin' },
  { path: '/admin',                   name: 'Admin Dashboard',        group: 'Admin' },
  { path: '/admin/complaints',        name: 'Admin Complaints',       group: 'Admin' },
  { path: '/admin/alterations',       name: 'Admin Alterations ⭐',   group: 'Admin' },
  { path: '/admin/tailoring',         name: 'Admin Tailoring',        group: 'Admin' },
  { path: '/admin/orders',            name: 'Admin Orders',           group: 'Admin' },
  { path: '/admin/customers',         name: 'Admin Customers',        group: 'Admin' },
  { path: '/admin/analytics',         name: 'Admin Analytics',        group: 'Admin' },
  { path: '/admin/editor',            name: 'Admin Editor',           group: 'Admin' },
  { path: '/admin/workflow',          name: 'Admin Workflow',         group: 'Admin' },
  // API Routes
  { path: '/api/health',              name: 'API Health',             group: 'API' },
];

function checkRoute(base, path) {
  return new Promise((resolve) => {
    const url = base + path;
    const lib = base.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = lib.get(url, { headers: { 'User-Agent': 'Deeprastore-QA/1.0' } }, (res) => {
      const elapsed = Date.now() - startTime;
      const status = res.statusCode;
      // Consume response to avoid hanging
      res.resume();
      resolve({ url, status, elapsed });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT', elapsed: 10000 });
    });
    
    req.on('error', (err) => {
      resolve({ url, status: 'ERROR: ' + err.message, elapsed: Date.now() - startTime });
    });
  });
}

function statusIcon(status) {
  if (status === 200) return '✅';
  if (status === 307 || status === 302 || status === 301) return '↪️ '; // redirect (expected for auth pages)
  if (status === 404) return '❌';
  if (status === 500) return '💥';
  if (typeof status === 'string') return '⚠️ ';
  return '❓';
}

function statusLabel(status) {
  if (status === 200) return 'OK';
  if (status === 307) return 'REDIRECT (auth - expected)';
  if (status === 302) return 'REDIRECT';
  if (status === 301) return 'MOVED';
  if (status === 404) return 'NOT FOUND';
  if (status === 500) return 'SERVER ERROR';
  return String(status);
}

async function runQA(baseUrl, envName) {
  console.log(`\n${'='.repeat(65)}`);
  console.log(`🧪 DEEPRASTORE FULL ROUTE QA — ${envName}`);
  console.log(`🌐 Base: ${baseUrl}`);
  console.log(`${'='.repeat(65)}\n`);

  const results = [];
  let passCount = 0, failCount = 0, redirectCount = 0;

  for (const route of routes) {
    const result = await checkRoute(baseUrl, route.path);
    const icon = statusIcon(result.status);
    const label = statusLabel(result.status);
    
    const isPass = result.status === 200 || result.status === 307 || result.status === 302 || result.status === 301;
    const isFail = result.status === 404 || result.status === 500 || typeof result.status === 'string';
    const isRedirect = result.status === 307 || result.status === 302 || result.status === 301;

    if (isFail) failCount++;
    else if (isRedirect) { redirectCount++; passCount++; }
    else passCount++;

    const line = `${icon} [${route.group.padEnd(9)}] ${route.name.padEnd(25)} → ${label} (${result.elapsed}ms)`;
    console.log(line);
    results.push({ ...route, ...result, pass: isPass });
  }

  console.log(`\n${'─'.repeat(65)}`);
  console.log(`📊 SUMMARY: ${passCount}/${routes.length} routes healthy | ${failCount} failed | ${redirectCount} auth redirects`);
  
  const failed = results.filter(r => !r.pass);
  if (failed.length > 0) {
    console.log(`\n❌ FAILED ROUTES:`);
    failed.forEach(r => console.log(`   • ${r.path} — ${statusLabel(r.status)}`));
  }

  const verdict = failCount === 0 ? '✅ ALL ROUTES OPERATIONAL' : `⚠️  ${failCount} ROUTES FAILING`;
  console.log(`\n🏁 VERDICT: ${verdict}`);
  console.log(`${'='.repeat(65)}`);
  
  return { passCount, failCount, results };
}

async function main() {
  console.log('\n🚀 DEEPRASTORE QA ENGINE STARTING...\n');
  console.log(`📅 Test Time: ${new Date().toISOString()}`);
  console.log(`🔬 Routes to test: ${routes.length}`);

  // Test Vercel live first
  const vercelResults = await runQA(BASE_VERCEL, 'VERCEL LIVE PRODUCTION');
  
  // Then test local
  const localResults = await runQA(BASE_LOCAL, 'LOCAL DEV SERVER (localhost:3000)');

  // Final comparison
  console.log('\n' + '='.repeat(65));
  console.log('📋 ENVIRONMENT COMPARISON REPORT');
  console.log('='.repeat(65));
  console.log(`VERCEL LIVE: ${vercelResults.passCount}/${routes.length} ✅  ${vercelResults.failCount} ❌`);
  console.log(`LOCAL DEV:   ${localResults.passCount}/${routes.length} ✅  ${localResults.failCount} ❌`);
  
  const overallVerdict = (vercelResults.failCount === 0 && localResults.failCount === 0)
    ? '🎉 FULL QA: PASS — ALL SYSTEMS OPERATIONAL'
    : `⚠️  QA: PARTIAL — Check failed routes above`;
  
  console.log(`\n${overallVerdict}`);
  console.log('='.repeat(65));
}

main().catch(console.error);
