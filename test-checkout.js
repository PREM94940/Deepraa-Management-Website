const { createClient } = require('@supabase/supabase-js');

async function testCheckout() {
    const supabaseUrl = 'https://awyqinnivsvqsohfmmcj.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eXFpbm5pdnN2cXNvaGZtbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTczNjIsImV4cCI6MjA5NDg3MzM2Mn0.IWrku6AZP9IlklCxubVzmo8YXPVTkEdscL2CpPC5PVg';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Login as a test user
    console.log("Logging in...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'test@deeprastore.com', // Assume this exists, if not we'll create it
        password: 'password123'
    });

    if (authError) {
        console.log("User might not exist, attempting signup...");
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: 'test' + Date.now() + '@deeprastore.com',
            password: 'password123'
        });
        if (signUpErr) {
            console.error("Signup failed:", signUpErr);
            return;
        }
        console.log("Signed up user:", signUpData.user.id);
        
        // Ensure user is in customers table
        await supabase.from('customers').insert({
            id: signUpData.user.id,
            email: signUpData.user.email,
            full_name: "Test User"
        });
    }

    const session = await supabase.auth.getSession();
    const token = session.data.session.access_token;
    
    // Ensure customer row exists for foreign key constraint in orders table
    const { data: user } = await supabase.auth.getUser();
    await supabase.from('customers').upsert({
        id: user.user.id,
        email: user.user.email,
        full_name: "Test User"
    }, { onConflict: 'id' });

    console.log("Attempting checkout for out of stock item (DP168 UUID: 003636f2-f675-4502-8af1-9d7e63232920)");
    
    const res = await fetch('http://localhost:3000/api/razorpay', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `sb-awyqinnivsvqsohfmmcj-auth-token=${JSON.stringify(session.data.session)}`
        },
        body: JSON.stringify({
            amount: 4500000,
            items: [{
                id: "003636f2-f675-4502-8af1-9d7e63232920",
                name: "Test Lehenga",
                price: 45000,
                qty: 1
            }]
        })
    });

    const result = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", result);
}

testCheckout();
