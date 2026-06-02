async function run() {
    const res = await fetch('http://localhost:3000/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    console.log("Status:", res.status);
    console.log("Body:", await res.json());
}
run();
