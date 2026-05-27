const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    // Select a single row to see available fields
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Error fetching customers:', error);
    } else {
        console.log('Customer columns:', data.length > 0 ? Object.keys(data[0]) : 'No records found');
        console.log('Sample record:', data[0]);
    }
}

inspect();
