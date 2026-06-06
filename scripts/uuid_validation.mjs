// scripts/uuid_validation.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function isValidUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

async function main() {
  console.log('=== UUID VALIDATION CHECK ===\n');
  const { data: rows, error } = await supabase.from('collection_products').select('product_id, collection_id');
  
  if (error) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }

  let validCount = 0;
  let invalidCount = 0;
  const invalidRows = [];

  rows.forEach(row => {
    if (isValidUUID(row.product_id)) {
      validCount++;
    } else {
      invalidCount++;
      invalidRows.push(row);
    }
  });

  const report = [
    '# UUID VALIDATION REPORT',
    '**Date:** 2026-06-06',
    '',
    `Total Rows Analyzed: ${rows.length}`,
    `Valid UUIDs: ${validCount}`,
    `Invalid UUIDs: ${invalidCount}`,
    ''
  ];

  if (invalidCount > 0) {
    report.push('## Invalid Rows Found:');
    invalidRows.forEach(r => report.push(`- Collection: ${r.collection_id} | Product ID: ${r.product_id}`));
  } else {
    report.push('✅ **ALL PRODUCT IDs ARE VALID UUIDs.** Safe to proceed with type conversion (`TEXT -> UUID`).');
  }

  fs.writeFileSync('UUID_VALIDATION_REPORT.md', report.join('\n'));
  console.log('Report written to UUID_VALIDATION_REPORT.md');
  console.log(`Valid: ${validCount}, Invalid: ${invalidCount}`);
}

main().catch(console.error);
