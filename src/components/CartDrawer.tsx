"use client";

import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { trackInitiateCheckout, trackPurchase, trackWhatsAppClick } from '@/lib/analytics';

export const CartDrawer = () => {
    const { items, isOpen, setIsOpen, updateQty, removeItem, getTotal } = useCartStore();
    const { user, openLoginModal } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (!user) {
            setIsOpen(false);
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

            // Track initiate checkout
            trackInitiateCheckout(totalAmount / 100, currentItems);

            // 2. Create Order API
            const result = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: totalAmount, items: currentItems })
            });
            
            const data = await result.json();

            if (data.error) {
                alert(data.error === "Sold out" ? `Sorry, ${data.product || 'an item'} is out of stock.` : data.error);
                setLoading(false);
                return;
            }

            // 3. Open Razorpay modal
            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: data.currency,
                name: "Deeprastore",
                description: "Luxury Fabric Purchase",
                order_id: data.id,
                handler: async function (response: any) {
                    try {
                        // The server-side webhook will handle inventory deduction and status updates.
                        // We simply clear the cart and congratulate the user.
                        trackPurchase(data.id, data.amount / 100, currentItems);
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
                            className="w-full bg-accent text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all disabled:opacity-50 mb-3">
                            {loading ? 'Processing...' : 'Checkout Securely'}
                        </button>

                        <button 
                            onClick={() => {
                                trackWhatsAppClick('abandoned_cart');
                                const msg = `Hello Deeprastore, I need help checking out my cart with ${items.length} items.`;
                                window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-[#25D366]/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Need Checkout Help? WhatsApp Us
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
