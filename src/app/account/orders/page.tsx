"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AccountOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            const { data } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_id', user?.id)
                .order('created_at', { ascending: false });
            
            if (data) {
                setOrders(data);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-[#A3A3A3] text-[10px] uppercase tracking-widest font-bold animate-pulse">Loading Ledger...</div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h1 className="text-3xl font-display font-light text-white mb-2 flex items-center gap-3">
                    <ShoppingBag size={28} className="text-[#D4AF37]" /> Curation Ledger
                </h1>
                <p className="text-[10px] text-[#A3A3A3] uppercase tracking-widest">
                    A historical record of all your bespoke pieces and active curations.
                </p>
            </div>

            {orders.length === 0 ? (
                <div className="bg-[#161616] border border-[#222] p-12 rounded shadow-xl text-center">
                    <p className="text-[#737373] text-sm mb-4">No curations found in your ledger.</p>
                    <Link href="/lookbook" className="inline-block px-6 py-3 bg-[#D4AF37] text-black font-extrabold uppercase tracking-widest text-[9px] hover:bg-[#B8962B] transition-colors rounded">
                        Explore Collections
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((o) => (
                        <div key={o.id} className="bg-[#161616] border border-[#222] hover:border-[#D4AF37]/50 transition-colors p-6 rounded shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-white font-display">
                                        {o.order_number || o.id.substring(0,8)}
                                    </h3>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded">
                                        {o.status || 'Pending'}
                                    </span>
                                </div>
                                <div className="text-[11px] text-[#A3A3A3] flex flex-wrap gap-x-4 gap-y-1">
                                    <span>Placed: <strong className="text-white font-medium">{new Date(o.created_at).toLocaleDateString()}</strong></span>
                                    <span>Total Value: <strong className="text-white font-medium">₹{o.total_amount?.toLocaleString()}</strong></span>
                                </div>
                            </div>
                            
                            <div className="flex shrink-0 w-full md:w-auto">
                                <Link 
                                    href={`/track/${o.id}`} 
                                    className="w-full md:w-auto text-center px-6 py-3 bg-[#222] hover:bg-[#333] border border-[#333] hover:border-[#D4AF37]/50 text-white font-extrabold uppercase tracking-widest text-[9px] transition-all rounded flex items-center justify-center gap-2 group"
                                >
                                    Manage Curation <ArrowRight size={14} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
