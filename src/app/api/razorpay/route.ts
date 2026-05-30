import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { amount, items } = await req.json();

    if (!amount || amount <= 0 || !items || items.length === 0) {
      return NextResponse.json({ error: "Invalid amount or empty cart" }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    // 1. Authenticate user via Supabase SSR
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session }, error: authErr } = await supabase.auth.getSession();
    if (authErr || !session) {
      return NextResponse.json({ error: "Unauthorized. You must be logged in to checkout." }, { status: 401 });
    }

    // 2. Create Pending Order in Deeprastore
    const orderNumber = `WEB-${Date.now().toString().slice(-6)}`;
    
    // total is passed in paise, store in DB as INR
    const totalAmountINR = amount / 100;

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id: session.user.id,
        order_number: orderNumber,
        total_amount: totalAmountINR,
        status: 'Pending',
        approval_status: 'Pending',
        payment_status: 'Pending',
        source: 'web',
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("Order Pre-Creation Error:", orderErr);
      return NextResponse.json({ error: "Failed to initialize order." }, { status: 500 });
    }

    // 3. Create Order Items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      price: item.price,
      quantity: item.qty
    }));
    
    const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
    if (itemsErr) {
      console.error("Order Items Pre-Creation Error:", itemsErr);
      // We could rollback the order here, but keeping it as abandoned cart is fine.
    }

    // 4. Create Razorpay Order and link metadata
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: amount, // already in paisa
      currency: 'INR',
      receipt: `receipt_${orderNumber}`,
      notes: {
        deeprastore_order_id: order.id,
        user_id: session.user.id
      }
    });

    // 5. Update the pending order with the razorpay order id reference
    await supabase.from('orders').update({ payment_screenshot: razorpayOrder.id }).eq('id', order.id);

    return NextResponse.json(razorpayOrder);
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
