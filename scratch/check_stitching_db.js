const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase env variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLifecycle() {
  console.log("Starting Supabase connection & schema verification...\n");

  // 1. Check measurement_profiles table
  console.log("Checking 'measurement_profiles' table...");
  const { data: mData, error: mErr } = await supabase
    .from('measurement_profiles')
    .select('*')
    .limit(1);

  if (mErr) {
    console.error("❌ Failed to query measurement_profiles:", mErr.message);
  } else {
    console.log("✅ measurement_profiles accessible. Rows found:", mData.length);
  }

  // 2. Check alterations_history table
  console.log("Checking 'alterations_history' table...");
  const { data: aData, error: aErr } = await supabase
    .from('alterations_history')
    .select('*')
    .limit(1);

  if (aErr) {
    console.error("❌ Failed to query alterations_history:", aErr.message);
  } else {
    console.log("✅ alterations_history accessible. Rows found:", aData.length);
  }

  // 3. Write & Read Lifecycle test on measurement_profiles
  console.log("\nTesting insert/select/delete lifecycle on 'measurement_profiles'...");
  const testProfile = {
    profile_label: 'Stabilization Test Profile',
    bust: 36.5,
    waist: 30.0,
    shoulder: 14.0,
    front_neck_depth: 7.5,
    back_neck_depth: 8.0,
    sleeve_length: 10.5,
    sleeve_round: 12.0,
    blouse_length: 14.5
  };

  const { data: insData, error: insErr } = await supabase
    .from('measurement_profiles')
    .insert(testProfile)
    .select();

  if (insErr) {
    console.error("❌ Insert failed:", insErr.message);
  } else {
    const insertedProfile = insData[0];
    console.log("✅ Insert succeeded. Created Profile ID:", insertedProfile.id);

    // Read back
    const { data: readData, error: readErr } = await supabase
      .from('measurement_profiles')
      .select('*')
      .eq('id', insertedProfile.id);

    if (readErr || readData.length === 0) {
      console.error("❌ Read back failed:", readErr ? readErr.message : "No row found");
    } else {
      console.log("✅ Read back succeeded. Profile Label:", readData[0].profile_label);
    }

    // Cleanup delete
    const { error: delErr } = await supabase
      .from('measurement_profiles')
      .delete()
      .eq('id', insertedProfile.id);

    if (delErr) {
      console.error("⚠️ Cleanup delete failed:", delErr.message);
    } else {
      console.log("✅ Cleanup delete succeeded.");
    }
  }

  console.log("\nVerification complete!");
}

testLifecycle();
