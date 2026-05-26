const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("=== Setting up Authenticated User for Option B Seeding ===");

  const email = 'test_lifecycle_console_user@mailnesia.com';
  const password = 'TestPassword123!';
  
  let user;
  
  // 1. Sign up or login
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Aria Alteration Test'
      }
    }
  });

  if (signUpErr && signUpErr.message.includes('already registered')) {
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      console.error("❌ Sign in failed:", signInErr.message);
      return;
    }
    user = signInData.user;
  } else if (signUpErr) {
    console.error("❌ Sign up failed:", signUpErr.message);
    return;
  } else {
    user = signUpData.user;
  }

  console.log(`✅ Logged in as: ${user.email} (${user.id})`);

  // 2. Sync customer record
  const { data: existingCust } = await supabase.from('customers').select('id').eq('id', user.id).maybeSingle();
  if (!existingCust) {
    console.log("Syncing public.customers profile...");
    const { error: syncErr } = await supabase.from('customers').insert({
      id: user.id,
      email: user.email,
      full_name: 'Aria Alteration Test',
      total_orders: 1,
      total_spent: 8500
    });
    if (syncErr) {
      console.error("⚠️ Syncing profile failed:", syncErr.message);
    }
  }

  // 3. Create or load measurement profile
  console.log("Checking sizing profile...");
  const { data: existingProfiles } = await supabase
    .from('measurement_profiles')
    .select('*')
    .eq('customer_id', user.id)
    .limit(1);

  let profile = existingProfiles?.[0];

  if (!profile) {
    console.log("Creating new measurement profile...");
    const { data: newProf, error: profErr } = await supabase
      .from('measurement_profiles')
      .insert({
        customer_id: user.id,
        profile_label: 'Aria Bridal Spec',
        bust: 35,
        waist: 28,
        shoulder: 13.5,
        front_neck_depth: 7,
        back_neck_depth: 8.5,
        sleeve_length: 11,
        sleeve_round: 15,
        unit: 'inches'
      })
      .select()
      .single();

    if (profErr) {
      console.error("❌ Failed to create measurement profile:", profErr.message);
      return;
    }
    profile = newProf;
  }

  console.log(`✅ Sizing Profile active: "${profile.profile_label}"`);

  // 4. Create dummy order
  console.log("Creating order reference...");
  const { data: newOrder, error: orderErr } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      order_number: 'DS-TEST-ALT',
      status: 'Delivered',
      payment_status: 'Paid',
      total_amount: 8500,
      measurements: {
        bust: `${profile.bust} in`,
        waist: `${profile.waist} in`,
        shoulder: `${profile.shoulder} in`,
        frontNeckDepth: `${profile.front_neck_depth} in`,
        backNeckDepth: `${profile.back_neck_depth} in`,
        sleeveLength: `${profile.sleeve_length} in`,
        armHole: `${profile.sleeve_round} in`
      }
    })
    .select()
    .single();
    
  if (orderErr) {
    console.error("❌ Failed to create dummy order:", orderErr.message);
    return;
  }
  const orderId = newOrder.id;
  console.log("✅ Created dummy order ID:", orderId);

  // 5. Create dummy order item
  console.log("Creating order item...");
  const { data: newOrderItem, error: itemErr } = await supabase
    .from('order_items')
    .insert({
      order_id: orderId,
      product_name: 'Premium Pattu Ready-Wear Half Saree',
      quantity: 1,
      price: 8500
    })
    .select()
    .single();

  if (itemErr) {
    console.error("❌ Failed to create dummy order item:", itemErr.message);
    return;
  }
  console.log("✅ Created order item ID:", newOrderItem.id);

  // 6. Create customization record
  console.log("Creating stitching customization...");
  const { data: newCust, error: custRecordErr } = await supabase
    .from('stitching_customizations')
    .insert({
      order_item_id: newOrderItem.id,
      blouse_style: 'V-Neck - Elbow Sleeve',
      sleeve_length: 'Elbow Sleeve',
      neck_design_front: 'V-Neck',
      neck_design_back: 'V-Neck (Back Open/Zip: Side Zip)',
      measurements: {
        bust: profile.bust,
        waist: profile.waist,
        shoulder: profile.shoulder,
        frontNeckDepth: profile.front_neck_depth,
        backNeckDepth: profile.back_neck_depth,
        sleeveLength: profile.sleeve_length,
        armHole: profile.sleeve_round,
        unit: profile.unit
      },
      notes: 'Padding: Padded. Opening: Side Zip.',
      profile_id: profile.id
    })
    .select()
    .single();
    
  if (custRecordErr) {
    console.error("❌ Failed to create customization record:", custRecordErr.message);
    return;
  }
  console.log("✅ Created stitching customization ID:", newCust.id);

  // 7. Insert alteration request into alterations_history
  console.log("Seeding alterations_history...");
  const { data: newAlteration, error: altErr } = await supabase
    .from('alterations_history')
    .insert({
      order_id: orderId,
      customization_id: newCust.id,
      complaint_details: 'The shoulder width feels slightly loose and the back neck depth is lower than desired. Please correct for future orders.',
      adjustment_notes: 'Reduce shoulder width by 0.5 inches in pattern drafting.',
      tailor_remarks: 'Master Ramesh updating patterns.',
      status: 'Requested'
    })
    .select()
    .single();
    
  if (altErr) {
    console.error("❌ Failed to seed alterations_history:", altErr.message);
    return;
  }
  console.log("✅ Successfully seeded alterations_history entry ID:", newAlteration.id);
  console.log("Seeding complete! Option B is ready for verification.");
}

run();
