"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, CheckCircle, Smartphone } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function ConfirmOrderPage() {
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        if (orderId) fetchOrder();
    }, [orderId]);

    async function fetchOrder() {
        setLoading(true);
        try {
            const { data: orderData, error: orderErr } = await supabase.from('orders').select('*, customers(*)').eq('id', orderId).single();
            if (orderErr) throw orderErr;
            
            const { data: itemsData, error: itemsErr } = await supabase.from('order_items').select('*').eq('order_id', orderId);
            if (itemsErr) throw itemsErr;

            setOrder(orderData);
            setItems(itemsData || []);
        } catch (err) {
            console.error("Error fetching order:", err);
        } finally {
            setLoading(false);
        }
    }

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    async function handlePayment() {
        setPaying(true);
        try {
            const res = await loadRazorpayScript();
            if (!res) {
                alert("Razorpay SDK failed to load");
                return;
            }

            // Create Razorpay order on our backend
            const orderResponse = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Math.round(order.total_amount * 100) })
            });
            const orderData = await orderResponse.json();

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy',
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Deeprastore",
                description: "Order Payment",
                order_id: orderData.id,
                handler: async function (response: any) {
                    // Payment Success! Update our database
                    await supabase.from('orders').update({ 
                        status: 'Confirmed',
                        payment_status: 'Paid'
                    }).eq('id', orderId);
                    
                    // Add to status history
                    await supabase.from('order_status_history').insert({
                        order_id: orderId,
                        old_status: 'Payment Pending',
                        new_status: 'Confirmed',
                        changed_by: 'Customer (Auto)'
                    });

                    setPaymentSuccess(true);
                },
                prefill: {
                    name: order.customers?.full_name || '',
                    contact: order.customers?.phone_number || ''
                },
                theme: {
                    color: "#0F172A"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment Error:", err);
            alert("Payment failed to initialize.");
        } finally {
            setPaying(false);
        }
    }

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your secure invoice...</div>;
    }

    if (!order) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>Order not found or invalid link.</div>;
    }

    if (paymentSuccess || order.payment_status === 'Paid') {
        return (
            <div style={{ maxWidth: '600px', margin: '40px auto', padding: '40px', textAlign: 'center', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <CheckCircle size={64} color="#10B981" style={{ margin: '0 auto 20px' }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '12px' }}>Payment Successful!</h1>
                <p style={{ color: '#64748B', marginBottom: '24px' }}>Your order is now confirmed. You will receive updates on WhatsApp shortly.</p>
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', fontSize: '0.9rem' }}>
                    Order ID: <strong>{order.id.slice(0, 8)}...</strong>
                </div>
            </div>
        );
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '24px', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', padding: '12px', background: '#F8FAFC', borderRadius: '50%', marginBottom: '16px' }}>
                    <ShieldCheck size={32} color="#0F172A" />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-playfair)' }}>Deeprastore Invoice</h1>
                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Secure Checkout</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Bill To</h3>
                <div style={{ fontWeight: 600 }}>{order.customers?.full_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#475569', marginTop: '4px' }}>
                    <Smartphone size={14} /> {order.customers?.phone_number}
                </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Order Details</h3>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                            <span>{item.quantity}x {item.product_name}</span>
                            <span style={{ fontWeight: 500 }}>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                    ))}
                    <hr style={{ borderColor: '#E2E8F0', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        <span>Total Payable</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                </div>
            </div>

            <button 
                onClick={handlePayment}
                disabled={paying}
                style={{ width: '100%', padding: '16px', background: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
                {paying ? 'Processing...' : `Pay ${formatCurrency(order.total_amount)} Now`}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8', marginTop: '16px' }}>
                Payments are processed securely via Razorpay. Subject to Deeprastore Terms & Conditions.
            </p>
        </div>
    );
}
