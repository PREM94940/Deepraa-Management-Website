// scripts/executive_audit.mjs
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awyqinnivsvqsohfmmcj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAudit() {
  console.log("=== STARTING FULL SYSTEM AUDIT ===\n");

  // 1. Security (RLS Check)
  console.log("1. SECURITY: Checking RLS Policies...");
  try {
    const { data: policies, error } = await supabase.rpc('get_policies'); // If custom RPC exists
    // Fallback if no RPC: try inserting into a protected table
    const { error: insertError } = await supabase.from('products').insert({ title: 'test_rls' });
    if (insertError) {
      console.log("   RLS is ACTIVE on products table (Insert rejected).");
    } else {
      console.log("   WARNING: RLS is INACTIVE or missing on products table (Insert allowed).");
    }
  } catch (e) {
    console.log("   Could not verify RLS completely.", e.message);
  }

  // 2. Performance & Frontend (Typecheck & Build Status)
  console.log("\n2. FRONTEND: Running TypeScript Typecheck (detecting missing files/dead code)...");
  try {
    const tscOutput = execSync('npx tsc --noEmit', { stdio: 'pipe' }).toString();
    console.log("   ✅ TypeScript compilation passed cleanly.");
  } catch (err) {
    console.log("   ❌ TypeScript errors found (Dead code / Missing Files):");
    const errors = err.stdout ? err.stdout.toString().split('\n').slice(0, 15).join('\n') : 'Unknown TS Error';
    console.log(errors);
    console.log("   ... (truncated)");
  }

  // 3. SEO & Analytics (Known issues from previous audit)
  console.log("\n3. SEO & ANALYTICS: Reading layout/pages...");
  try {
    const collectionsPage = execSync('type "src\\app\\collections\\[slug]\\page.tsx" | findstr "use client"').toString();
    if (collectionsPage) console.log("   ❌ Collection Page is 'use client' - Missing SEO Metadata");
  } catch (e) {
    console.log("   Collection Page missing or changed.");
  }

  console.log("\n=== AUDIT DATA COLLECTION COMPLETE ===");
}

runAudit().catch(console.error);
