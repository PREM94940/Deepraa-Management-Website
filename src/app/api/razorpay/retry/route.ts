import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

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
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 1. Fetch Order and verify ownership
    const { data: order } = await supabase
      .from('orders')
      .select('id, customer_id, payment_screenshot, total_amount, status')
      .eq('id', order_id)
      .single();

    if (!order || order.customer_id !== session.user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== 'Pending') {
      return NextResponse.json({ error: "Order is already processed" }, { status: 400 });
    }

    // 2. Validate Stock Again (Just in case it sold out while pending)
    const { data: items } = await supabase.from('order_items').select('product_id, quantity, product_name').eq('order_id', order.id);
    if (items) {
      for (const item of items) {
        const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single();
        if (!product || product.stock_quantity < item.quantity) {
          return NextResponse.json({ error: "Sold out", product: item.product_name }, { status: 400 });
        }
      }
    }

    return NextResponse.json({
      id: order.payment_screenshot, // The Razorpay Order ID we saved earlier
      amount: order.total_amount * 100, // convert back to paise for Razorpay frontend
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("Razorpay retry error:", error);
    return NextResponse.json({ error: "Failed to initialize retry" }, { status: 500 });
  }
}
