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

      // Atomic Update Lock: Update Order Status to Paid securely bypassing RLS
      // The .neq ensures if multiple webhooks arrive simultaneously, only the first one modifies the row
      const { data: updatedOrders, error: orderErr } = await supabaseServer
        .from('orders')
        .update({
          payment_status: 'Paid',
          status: 'Confirmed',
          approval_status: 'Approved'
        })
        .eq('id', deeprastoreOrderId)
        .neq('payment_status', 'Paid')
        .select();

      if (orderErr) {
        console.error("Webhook Error: Failed to update order status", orderErr);
        return NextResponse.json({ error: "Failed to sync order" }, { status: 500 });
      }

      if (!updatedOrders || updatedOrders.length === 0) {
        console.log(`[IDEMPOTENCY] Race condition prevented. Order ${deeprastoreOrderId} already paid.`);
        return NextResponse.json({ success: true, message: "Already processed" }, { status: 200 });
      }

      // Decrement Inventory for Order Items
      const { data: items } = await supabaseServer
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', deeprastoreOrderId);

      if (items && items.length > 0) {
        for (const item of items) {
          await supabaseServer.rpc('decrement_product_inventory', {
            p_product_id: item.product_id,
            p_quantity: item.quantity
          });
        }
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
