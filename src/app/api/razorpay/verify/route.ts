import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { paymentId, orderId, signature, total, items } = await req.json();

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json({ error: "Missing payment verification parameters" }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    // 1. Verify Razorpay Signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid payment signature. Potential fraud attempt." }, { status: 400 });
    }

    // 2. Initialize Supabase SSR client to capture auth context securely
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

    // 3. Verify Session
    const { data: { session }, error: authErr } = await supabase.auth.getSession();
    if (authErr || !session) {
      return NextResponse.json({ error: "Unauthorized. You must be logged in to place an order." }, { status: 401 });
    }

    // 4. Securely Insert Order (RLS will automatically enforce customer_id = auth.uid() because of session context)
    const orderNumber = `WEB-${Date.now().toString().slice(-6)}`;
    
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id: session.user.id,
        order_number: orderNumber,
        total_amount: total,
        status: 'Confirmed',
        approval_status: 'Approved',
        payment_status: 'Paid',
        source: 'web',
        payment_screenshot: paymentId, // We use this as a reference ID for Razorpay
      })
      .select()
      .single();

    if (orderErr) {
      console.error("Order Insertion Error:", orderErr);
      return NextResponse.json({ error: "Failed to create order record." }, { status: 500 });
    }

    // 5. Insert Order Items
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.qty
      }));
      
      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
      if (itemsErr) {
        console.error("Order Items Insertion Error:", itemsErr);
        // We do not fail the whole request since payment and order exist, but log the error
      } else {
        // Decrement inventory for each item
        for (const item of items) {
          await supabase.rpc('decrement_product_inventory', {
            p_product_id: item.id,
            p_quantity: item.qty
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      order_id: order.id, 
      order_number: order.order_number 
    });

  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json({ error: "Internal server verification error" }, { status: 500 });
  }
}
