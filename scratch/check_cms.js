require('dotenv').config({ path: '.env.local' });

async function run() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/store_ui_settings?id=eq.1&select=config`;
  console.log("Fetching URL:", url);
  try {
    const res = await fetch(url, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
      }
    });
    console.log("Fetch Status:", res.status);
    const data = await res.json();
    console.log("Fetched Data:", JSON.stringify(data, null, 2).slice(0, 500) + "...");
    const configData = data?.[0]?.config || null;
    console.log("configData has pages?", !!configData?.pages);
    console.log("configData homepage sections:", configData?.pages?.find(p => p.id === 'homepage')?.sections?.length);
  } catch (e) {
    console.error("Fetch threw error:", e);
  }
}

run();
