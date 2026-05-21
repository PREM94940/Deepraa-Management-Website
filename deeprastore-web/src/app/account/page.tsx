"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { motion } from 'framer-motion';

export default function Account() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                // Fetch orders for this user
                const { data } = await supabase.from('orders').select('*').eq('customer_id', user.id).order('created_at', { ascending: false });
                if (data) setOrders(data);
            }
            setLoading(false);
        }
        getUser();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin + '/account',
            }
        });
        
        if (error) setMessage(error.message);
        else setMessage('Check your email for the login link!');
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <main className="relative bg-surface min-h-screen">
            <Navbar />
            
            <div className="max-w-4xl mx-auto px-6 py-32">
                {loading ? (
                    <div className="text-center py-20 text-muted animate-pulse font-display italic text-xl">
                        Loading your details...
                    </div>
                ) : !user ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto bg-white p-10 shadow-2xl rounded-3xl"
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-display font-bold mb-2">Welcome</h1>
                            <p className="text-muted">Enter your email to access your luxury profile.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border-b border-border py-3 focus:outline-none focus:border-black transition-colors"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-gold transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Magic Link'}
                            </button>
                            {message && <p className="text-sm text-accent text-center font-medium mt-4">{message}</p>}
                        </form>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="flex justify-between items-end mb-12 border-b border-border pb-6">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">Your Profile</h1>
                                <p className="text-muted">{user.email}</p>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="text-sm font-bold uppercase tracking-widest text-accent hover:underline"
                            >
                                Sign Out
                            </button>
                        </div>

                        <div>
                            <h2 className="text-2xl font-display font-bold mb-6">Order History</h2>
                            {orders.length === 0 ? (
                                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                                    <p className="text-muted mb-4">You haven't placed any orders yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map(order => (
                                        <div key={order.id} className="border border-border rounded-xl p-6 flex justify-between items-center bg-white">
                                            <div>
                                                <div className="font-bold mb-1">Order #{order.id.slice(0, 8)}</div>
                                                <div className="text-sm text-muted">{new Date(order.created_at).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg">₹{order.total_amount?.toLocaleString()}</div>
                                                <div className="text-xs font-bold uppercase tracking-widest text-accent-emerald mt-1">{order.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
