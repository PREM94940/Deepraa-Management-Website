"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Package, ArrowRight, Activity, Scissors, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AccountDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalOrders: 0, activeOrders: 0, activeTickets: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            // Fetch Orders
            const { data: orders } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_id', user?.id)
                .order('created_at', { ascending: false });

            // Fetch Active Tickets
            const { data: tickets } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('customer_id', user?.id)
                .not('status', 'in', '("Resolved","Rejected")');

            const orderList = orders || [];
            const activeCount = orderList.filter(o => !['Delivered', 'Cancelled'].includes(o.status || '')).length;

            setStats({
                totalOrders: orderList.length,
                activeOrders: activeCount,
                activeTickets: tickets?.length || 0
            });

            setRecentOrders(orderList.slice(0, 3));
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-[#A3A3A3] text-[10px] uppercase tracking-widest font-bold animate-pulse">Loading Curation Data...</div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-display font-light text-white">VIP Dashboard</h1>
                <span className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest">
                    Verified Member
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#161616] border border-[#222] p-6 rounded shadow-xl">
                    <div className="flex items-center gap-3 mb-2 text-[#A3A3A3]">
                        <Package size={16} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Total Curations</span>
                    </div>
                    <div className="text-4xl font-display font-light text-white">{stats.totalOrders}</div>
                </div>
                <div className="bg-[#161616] border border-[#222] p-6 rounded shadow-xl">
                    <div className="flex items-center gap-3 mb-2 text-[#D4AF37]">
                        <Activity size={16} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Active Orders</span>
                    </div>
                    <div className="text-4xl font-display font-light text-white">{stats.activeOrders}</div>
                </div>
                <div className="bg-[#161616] border border-[#222] p-6 rounded shadow-xl">
                    <div className="flex items-center gap-3 mb-2 text-rose-500">
                        <AlertCircle size={16} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Open Support</span>
                    </div>
                    <div className="text-4xl font-display font-light text-white">{stats.activeTickets}</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/account/measurements" className="bg-[#110D0A] hover:bg-[#1A140F] border border-[#D4AF37]/30 p-6 rounded shadow-xl transition-colors group flex justify-between items-center">
                    <div>
                        <h3 className="text-[#D4AF37] font-bold uppercase tracking-wider text-xs mb-1 flex items-center gap-2">
                            <Scissors size={14} /> Update Measurements
                        </h3>
                        <p className="text-[10px] text-[#A3A3A3] leading-relaxed">Ensure your bespoke tailoring profiles are up to date for your next order.</p>
                    </div>
                    <ArrowRight size={18} className="text-[#D4AF37] transform group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/lookbook" className="bg-[#161616] hover:bg-[#1A1A1A] border border-[#333] p-6 rounded shadow-xl transition-colors group flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-wider text-xs mb-1">
                            Explore Collections
                        </h3>
                        <p className="text-[10px] text-[#A3A3A3] leading-relaxed">Discover our latest premium curation pieces.</p>
                    </div>
                    <ArrowRight size={18} className="text-white transform group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Recent Orders Snapshot */}
            <div className="bg-[#161616] border border-[#222] rounded shadow-xl overflow-hidden">
                <div className="p-6 border-b border-[#222] flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#E5E5E5]">Recent Orders</h3>
                    <Link href="/account/orders" className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#B8962B]">View All</Link>
                </div>
                <div className="p-6">
                    {recentOrders.length === 0 ? (
                        <p className="text-[#737373] text-xs">No orders found.</p>
                    ) : (
                        <div className="space-y-4">
                            {recentOrders.map(o => (
                                <div key={o.id} className="flex justify-between items-center pb-4 border-b border-[#222] last:border-0 last:pb-0">
                                    <div>
                                        <p className="text-xs font-bold text-white">{o.order_number || o.id.substring(0,8)}</p>
                                        <p className="text-[10px] text-[#A3A3A3] mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded">
                                            {o.status || 'Pending'}
                                        </span>
                                        <div className="mt-2">
                                            <Link href={`/track/${o.id}`} className="text-[9px] text-white hover:text-[#D4AF37] underline underline-offset-2">Track & Manage</Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
