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

                        {order.return_status && order.return_status !== 'Not Applicable' && (
                            <div className="mb-12 bg-accent/5 border border-accent/20 rounded-2xl p-6">
                                <h3 className="text-lg font-bold font-display mb-4 text-accent">Return Status</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                    </div>
                                    <div>
                                        <p className="font-bold">{order.return_status}</p>
                                        <p className="text-sm text-muted">Your return is being processed by our team.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 bg-white p-6 rounded-2xl mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Total Amount</span>
                                <span className="font-bold">₹{order.total_amount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Payment Status</span>
                                <span className="font-bold capitalize">{order.payment_status || 'Paid'}</span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button 
                                onClick={() => window.open(`https://wa.me/919999999999?text=${encodeURIComponent(`Hi! I need help with my order ID: ${order.id}`)}`, '_blank')}
                                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#25D366] hover:text-[#128C7E] transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                Need help with this order? Chat with Support
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
