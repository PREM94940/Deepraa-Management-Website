"use client";

import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export const CartDrawer = () => {
    const { items, isOpen, setIsOpen, updateQty, removeItem, getTotal } = useCartStore();
    const { user, openLoginModal } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (!user) {
            openLoginModal(window.location.pathname + window.location.search);
            return;
        }

        if (items.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        setLoading(true);
        try {
            // 1. Load Razorpay script
            const loadScript = () => {
                return new Promise((resolve) => {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });
            };
            
            const res = await loadScript();
            if (!res) {
                alert("Razorpay SDK failed to load. Are you online?");
                setLoading(false);
                return;
            }

            const totalAmount = getTotal() * 100; // in paise
            const currentItems = useCartStore.getState().items;

            // 2. Create Order API
            const result = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalAmount, items: currentItems })
            });
            
            const data = await result.json();

            if (data.error) {
                alert("Payment configuration missing. Server error.");
                setLoading(false);
                return;
            }

            // 3. Open Razorpay modal
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key',
                amount: data.amount,
                currency: data.currency,
                name: "Deeprastore",
                description: "Luxury Fabric Purchase",
                order_id: data.id,
                handler: async function (response: any) {
                    try {
                        // The server-side webhook will handle inventory deduction and status updates.
                        // We simply clear the cart and congratulate the user.
                        alert(`Payment successful! Your order has been placed securely.`);
                        useCartStore.getState().clearCart();
                        setIsOpen(false);
                        window.location.href = '/account/orders'; // Redirect to orders dashboard
                    } catch (err: any) {
                        console.error('Failed to finalize frontend state:', err);
                    }
                },
                theme: { color: "#D4AF37" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert(`Payment failed! Reason: ${response.error.description}`);
            });
            rzp.open();
        } catch (error) {
            console.error(error);
            alert("Checkout failed.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 premium-blur" onClick={() => setIsOpen(false)}></div>
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-bg shadow-2xl animate-slide-in-right flex flex-col">
                <div className="px-8 py-10 flex justify-between items-center border-b border-border">
                    <h2 className="text-3xl font-bold font-display italic">Your <span className="text-accent">Bag.</span></h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 bg-white rounded-full border border-border">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            <p className="font-bold uppercase tracking-widest text-sm">Your bag is empty</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="flex gap-6 group">
                                <div className="w-24 h-32 rounded-2xl overflow-hidden bg-white border border-border">
                                    <img src={item.img} className="w-full h-full object-cover" alt={item.name} />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-2">
                                    <div>
                                        <h4 className="font-bold text-lg leading-tight mb-1 group-hover:text-accent transition-colors text-fg">{item.name}</h4>
                                        <p className="text-accent font-bold">₹{item.price}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-fg">
                                        <div className="flex items-center border border-border rounded-lg px-2 py-1">
                                            <button onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))} className="px-2 font-bold">-</button>
                                            <span className="px-3 font-bold text-xs">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, item.qty + 1)} className="px-2 font-bold">+</button>
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className="text-muted hover:text-accent-dark transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-8 border-t border-border bg-white text-fg">
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-muted font-bold text-xs uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span>₹{getTotal()}</span>
                            </div>
                            <div className="flex justify-between text-muted font-bold text-xs uppercase tracking-widest">
                                <span>Shipping</span>
                                <span className="text-accent-emerald">Calculated at checkout</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold font-display pt-4 border-t border-border">
                                <span>Total</span>
                                <span>₹{getTotal()}</span>
                            </div>
                        </div>
                        <div className="bg-surface rounded-xl p-4 mb-6 text-xs text-muted flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                <span>Secure Razorpay Payments</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
                                <span>Authentic Luxury Collection</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                                <span>Easy Return Assistance</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full bg-accent text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                            {loading ? 'Processing...' : 'Checkout Securely'}
                        </button>
                        <p className="text-center text-[10px] font-bold text-muted uppercase tracking-widest mt-6 flex flex-col gap-1">
                            <span>✨ Free Shipping on orders above ₹20,000</span>
                            <span className="opacity-70">Dispatches within 48 hours</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
