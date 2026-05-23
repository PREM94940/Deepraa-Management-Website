async function main() {
  try {
    const versionRes = await fetch('http://127.0.0.1:9222/json/version');
    const versionData = await versionRes.json();
    console.log('--- JSON VERSION ---');
    console.log(JSON.stringify(versionData, null, 2));

    const targetsRes = await fetch('http://127.0.0.1:9222/json');
    const targetsData = await targetsRes.json();
    console.log('--- JSON TARGETS ---');
    console.log(JSON.stringify(targetsData, null, 2));
  } catch (err) {
    console.error('Error fetching Chrome info:', err.message);
  }
}
main();
