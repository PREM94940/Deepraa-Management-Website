const fs = require('fs');
const { parse } = require('csv-parse/sync');

const inputFilePath = 'C:\\Users\\rodda\\Downloads\\Shopify_Products_Active.csv';
const outputFilePath = 'seed_products.sql';

const csvData = fs.readFileSync(inputFilePath, 'utf8');
const records = parse(csvData, { columns: true, skip_empty_lines: true });

const products = new Map();

for (const row of records) {
  const handle = row['Handle'];
  if (!handle) continue;

  if (!products.has(handle)) {
    products.set(handle, {
      sku: row['Variant SKU'] || handle,
      title: row['Title'] ? row['Title'].replace(/'/g, "''") : 'Unknown Title',
      description: row['Body (HTML)'] ? row['Body (HTML)'].replace(/'/g, "''") : '',
      category: row['Product Category'] ? row['Product Category'].replace(/'/g, "''") : 'Uncategorized',
      price: parseFloat(row['Variant Price']) || 0,
      stock_quantity: parseInt(row['Variant Inventory Qty']) || 10,
      images: []
    });
  }

  const p = products.get(handle);
  if (row['Image Src']) {
    p.images.push(row['Image Src']);
  }
}

let sql = '-- Seed Data for Products\n';
let count = 0;

for (const p of products.values()) {
  const imagesJson = JSON.stringify(p.images).replace(/'/g, "''");
  sql += `INSERT INTO products (sku, title, description, category, price, stock_quantity, movement_velocity, images) VALUES ('${p.sku}', '${p.title}', '${p.description}', '${p.category}', ${p.price}, ${p.stock_quantity}, 'Normal', '${imagesJson}'::jsonb) ON CONFLICT (sku) DO NOTHING;\n`;
  count++;
}

fs.writeFileSync(outputFilePath, sql);
console.log(`Successfully generated SQL for ${count} products.`);
