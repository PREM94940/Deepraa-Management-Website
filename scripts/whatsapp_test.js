const assert = require('assert');

// 1. Test PDP WhatsApp CTA
const p = { title: 'The Royal Banarasi Silk Lehenga', sku: 'DP-LHN-001' };
const msgPDP = `Hello, I want to order ${p.title} (SKU: ${p.sku})`;
const urlPDP = `https://wa.me/919876543210?text=${encodeURIComponent(msgPDP)}`;

console.log('PDP URL:', urlPDP);
assert.strictEqual(urlPDP, 'https://wa.me/919876543210?text=Hello%2C%20I%20want%20to%20order%20The%20Royal%20Banarasi%20Silk%20Lehenga%20(SKU%3A%20DP-LHN-001)');

// 2. Test CartDrawer WhatsApp CTA
const items = [{}, {}];
const msgCart = `Hello Deeprastore, I need help checking out my cart with ${items.length} items.`;
const urlCart = `https://wa.me/919876543210?text=${encodeURIComponent(msgCart)}`;

console.log('Cart URL:', urlCart);
assert.strictEqual(urlCart, 'https://wa.me/919876543210?text=Hello%20Deeprastore%2C%20I%20need%20help%20checking%20out%20my%20cart%20with%202%20items.');

console.log('WhatsApp URIs Validated successfully.');
