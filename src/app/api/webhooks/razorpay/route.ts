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

      // Atomic Update Lock & Inventory Decrement via single RPC
      const { error: rpcErr } = await supabaseServer.rpc('confirm_order_and_decrement_inventory', {
        p_order_id: deeprastoreOrderId
      });

      if (rpcErr) {
        console.error("Webhook Error: Transaction Failed (Order Update & Inventory Decrement)", rpcErr);
        // CRITICAL: Return 500 so Razorpay retries this webhook later
        return NextResponse.json({ error: "Failed to confirm order and decrement inventory", details: rpcErr }, { status: 500 });
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
