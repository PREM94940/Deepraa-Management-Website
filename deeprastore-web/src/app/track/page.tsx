"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { motion } from 'framer-motion';

export default function TrackOrder() {
    const [orderId, setOrderId] = useState('');
    const [phone, setPhone] = useState('');
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setOrder(null);

        // In a real app, you would query by order ID and verify the phone number matches the order details
        // For this demo, we'll just try to find the order by ID
        const { data, error: err } = await supabase.from('orders').select('*').eq('id', orderId).single();
        
        if (err || !data) {
            setError('Order not found. Please check your Order ID.');
        } else {
            setOrder(data);
        }
        setLoading(false);
    };

    const getStatusStep = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 1;
            case 'processing': return 2;
            case 'shipped': return 3;
            case 'delivered': return 4;
            default: return 1;
        }
    };

    return (
        <main className="relative bg-surface min-h-screen flex flex-col">
            <Navbar />
            
            <div className="flex-1 max-w-3xl mx-auto px-6 py-24 w-full">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Track Your Order</h1>
                    <p className="text-muted max-w-lg mx-auto">
                        Enter your order details below to see its current journey.
                    </p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-border mb-12"
                >
                    <form onSubmit={handleTrack} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-widest mb-2">Order ID</label>
                                <input 
                                    type="text"
                                    required
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    placeholder="e.g. 1234abcd..."
                                    className="w-full border-b border-border py-3 focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-widest mb-2">Phone Number</label>
                                <input 
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Your registered number"
                                    className="w-full border-b border-border py-3 focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-gold transition-colors disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Searching...' : 'Track Order'}
                        </button>
                        {error && <p className="text-accent text-sm text-center font-bold">{error}</p>}
                    </form>
                </motion.div>

                {order && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-border"
                    >
                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-2xl font-bold font-display">Order Details</h2>
                                <p className="text-muted text-sm">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold uppercase tracking-widest text-accent-emerald bg-accent-emerald/10 px-3 py-1 rounded-full">
                                    {order.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Progress Tracker */}
                        <div className="relative mb-12">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full"></div>
                            <div 
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-black rounded-full transition-all duration-1000"
                                style={{ width: `${(getStatusStep(order.status) - 1) * 33.33}%` }}
                            ></div>
                            
                            <div className="relative flex justify-between">
                                {[ 
                                    { step: 1, label: 'Order Placed' },
                                    { step: 2, label: 'Processing' },
                                    { step: 3, label: 'Shipped' },
                                    { step: 4, label: 'Delivered' }
                                ].map(s => (
                                    <div key={s.step} className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors duration-500 ${getStatusStep(order.status) >= s.step ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            {getStatusStep(order.status) > s.step ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            ) : s.step}
                                        </div>
                                        <span className={`mt-2 text-xs font-bold uppercase tracking-widest ${getStatusStep(order.status) >= s.step ? 'text-black' : 'text-gray-400'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 bg-white p-6 rounded-2xl">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Total Amount</span>
                                <span className="font-bold">₹{order.total_amount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Payment Status</span>
                                <span className="font-bold capitalize">{order.payment_status || 'Paid'}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
