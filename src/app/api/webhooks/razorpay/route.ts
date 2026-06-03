import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error("Webhook Error: Missing signature or webhook secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error("Webhook Error: Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse the payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    
    if (event === 'payment.captured' || event === 'payment.authorized') {
      const paymentEntity = payload.payload.payment.entity;
      const deeprastoreOrderId = paymentEntity.notes?.deeprastore_order_id;

      if (!deeprastoreOrderId) {
        console.error("Webhook Error: Missing deeprastore_order_id in notes metadata");
        return NextResponse.json({ success: true, warning: "Ignored: No internal order ID attached." });
      }

      // 1. Check if order is already confirmed
      const { data: existingOrder } = await supabaseServer
        .from('orders')
        .select('status')
        .eq('id', deeprastoreOrderId)
        .single();
      
      if (existingOrder?.status === 'Confirmed') {
        return NextResponse.json({ success: true, message: "Already processed" });
      }

      // 2. Fetch order items
      const { data: orderItems, error: itemsErr } = await supabaseServer
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', deeprastoreOrderId);

      if (itemsErr) {
        console.error("Webhook Error: Failed to fetch order items", itemsErr);
        return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 });
      }

      // 3. Decrement inventory for each item
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
            const { data: product } = await supabaseServer
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single();
            
            if (product) {
              await supabaseServer
                .from('products')
                .update({ stock_quantity: product.stock_quantity - item.quantity })
                .eq('id', item.product_id);
            }
        }
      }

      // 4. Update Order Status
      const { error: updateErr } = await supabaseServer
        .from('orders')
        .update({
            status: 'Confirmed',
            payment_status: 'Paid',
            approval_status: 'Approved'
        })
        .eq('id', deeprastoreOrderId);

      if (updateErr) {
        console.error("Webhook Error: Order Update Failed", updateErr);
        return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
      }

      return NextResponse.json({ success: true, order_id: deeprastoreOrderId });
    }

    if (event === 'payment.failed') {
      const paymentEntity = payload.payload.payment.entity;
      const deeprastoreOrderId = paymentEntity.notes?.deeprastore_order_id;
      
      if (deeprastoreOrderId) {
        await supabaseServer
          .from('orders')
          .update({
            payment_status: 'Failed',
            status: 'Cancelled'
          })
          .eq('id', deeprastoreOrderId);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, message: "Unhandled event type ignored." });

  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
