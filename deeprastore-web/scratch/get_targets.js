async function main() {
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  console.log('Targets in Chrome:', targets);
}
main();
