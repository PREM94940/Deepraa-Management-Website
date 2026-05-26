"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Package, Truck, Calendar, MessageSquare, AlertTriangle, 
    RefreshCcw, User, LogOut, ArrowRight, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function CustomerDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [customer, setCustomer] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // List of dynamic handcrafted steps in order
    const ORDER_STEPS = [
        'Order Confirmed',
        'Fabric Sourcing',
        'Tailoring In Progress',
        'Quality Check',
        'Preparing Dispatch',
        'Ready for Dispatch',
        'Shipped',
        'Delivered'
    ];

    useEffect(() => {
        async function fetchUserData() {
            setLoading(true);
            try {
                const { data: { user: activeUser }, error: userError } = await supabase.auth.getUser();
                if (userError || !activeUser) {
                    router.push('/login');
                    return;
                }
                setUser(activeUser);

                // Fetch customer details
                const { data: custData } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', activeUser.id)
                    .maybeSingle();
                setCustomer(custData);

                // Fetch customer orders
                const { data: ords } = await supabase
                    .from('orders')
                    .select('*, order_items(*)')
                    .eq('customer_id', activeUser.id)
                    .order('created_at', { ascending: false });
                setOrders(ords || []);
                
                if (ords && ords.length > 0) {
                    setSelectedOrder(ords[0]); // Default to show latest order
                }

                // Fetch active complaints
                const { data: comps } = await supabase
                    .from('complaints')
                    .select('*')
                    .eq('customer_id', activeUser.id)
                    .order('created_at', { ascending: false });
                setComplaints(comps || []);

            } catch (err) {
                console.error("Dashboard data fetching failed:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchUserData();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const getStepIndex = (status: string) => {
        return ORDER_STEPS.indexOf(status);
    };

    // Dynamic delay communication message checker
    const hasDelay = (order: any) => {
        if (!order) return false;
        // Mock checking logic: custom status indicating delay or customization queue
        const delayStatuses = ['Fabric Sourcing', 'Tailoring In Progress', 'Replacement Requested'];
        return delayStatuses.includes(order.status) || order.target_days > 15;
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="animate-pulse text-sm text-[#A3A3A3] uppercase tracking-[0.2em] font-light">
                    Securing Customer Curation...
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between">
            {/* Header / Navbar */}
            <div className="border-b border-[#1A1A1A] bg-[#0E0E0E]">
                <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="font-display text-xl tracking-[0.15em] font-light">
                        DEEPRA<span className="text-[#D4AF37] font-normal">STORE</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">{user?.email}</span>
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 text-[10px] uppercase font-bold tracking-wider hover:bg-red-950/20 hover:text-red-400 hover:border-red-900 transition-colors rounded-sm"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1200px] mx-auto w-full px-4 py-8 md:py-12 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Profile & Quick Info */}
                <div className="space-y-6">
                    {/* Customer Info Card */}
                    <div className="bg-[#121212] border border-[#222] p-6 rounded-sm">
                        <div className="flex items-center gap-3.5 mb-6">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-[#D4AF37] flex items-center justify-center text-lg font-bold text-[#D4AF37]">
                                {(customer?.full_name || 'C')[0]}
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold tracking-wide text-white">{customer?.full_name || 'Customer'}</h2>
                                <p className="text-[10px] text-zinc-400 tracking-wider">
                                    Loyalty Tier: <span className="text-[#D4AF37] font-bold">{customer?.loyalty_level || 'Bronze'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3.5 text-xs border-t border-[#1C1C1C] pt-4">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Contact Number:</span>
                                <span className="font-mono text-zinc-300">{customer?.phone_number || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Email Address:</span>
                                <span className="text-zinc-300 truncate max-w-[180px]">{customer?.email || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">City / Region:</span>
                                <span className="text-zinc-300">{customer?.city || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp First Service Link */}
                    <div className="bg-[#121212] border border-emerald-900/40 bg-gradient-to-br from-[#121212] to-emerald-950/10 p-6 rounded-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            WhatsApp-First Support
                        </h3>
                        <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                            Need immediate timeline updates, custom stitching changes, or design assistance? Contact our boutique support directly on WhatsApp.
                        </p>
                        <a 
                            href="https://wa.me/919876543210?text=Hi%20Deeprastore%20Support%2C%20I%20have%20an%20inquiry%20regarding%20my%20recent%20order."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold uppercase text-[9px] tracking-widest py-3 px-4 rounded-sm transition-all flex items-center justify-center gap-2"
                        >
                            Open Support Chat
                        </a>
                    </div>

                    {/* Active Replacement Requests */}
                    <div className="bg-[#121212] border border-[#222] p-6 rounded-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-4 flex items-center gap-2">
                            <RefreshCcw className="w-4 h-4" />
                            Replacement Tickets
                        </h3>
                        <div className="space-y-3">
                            {complaints.map(c => (
                                <div key={c.id} className="p-3 bg-[#161616] border border-[#262626] rounded-sm text-xs space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-zinc-300 uppercase text-[9px] tracking-wider">{c.issue_type}</span>
                                        <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-sm ${c.status === 'Resolved' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                                            {c.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 line-clamp-2">{c.issue_reason}</p>
                                    <div className="text-[8px] text-zinc-600">Opened on {new Date(c.created_at).toLocaleDateString()}</div>
                                </div>
                            ))}
                            {complaints.length === 0 && (
                                <p className="text-[11px] text-zinc-500 italic text-center py-2">No active replacement tickets.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: My Orders List & Active Order Step Tracking */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dynamic Order Step Tracking */}
                    <div className="bg-[#121212] border border-[#222] p-6 rounded-sm">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] mb-6 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Bespoke Fabrication Tracking
                        </h2>

                        {selectedOrder ? (
                            <div className="space-y-6">
                                {/* Order Quick Info */}
                                <div className="flex flex-wrap justify-between items-center gap-4 bg-[#161616] p-4 border border-[#262626] rounded-sm">
                                    <div>
                                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Order Reference</span>
                                        <span className="font-mono text-xs font-bold text-white">#{selectedOrder.order_number || selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Fulfillment Timeline</span>
                                        <span className="text-xs font-semibold text-zinc-300">
                                            {selectedOrder.expected_delivery_date ? new Date(selectedOrder.expected_delivery_date).toLocaleDateString() : '7-12 Business Days'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Total Investment</span>
                                        <span className="text-xs font-bold text-[#D4AF37]">₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div>
                                        <a 
                                            href={`/account/replacement?orderId=${selectedOrder.id}`}
                                            className="px-3.5 py-2 border border-[#D4AF37] text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors rounded-sm"
                                        >
                                            Request Replacement
                                        </a>
                                    </div>
                                </div>

                                {/* Proactive Delay Trust Banner */}
                                {hasDelay(selectedOrder) && (
                                    <div className="bg-amber-950/20 border border-amber-900/60 p-4 rounded-sm flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div className="text-xs text-amber-300 leading-relaxed">
                                            <p className="font-bold uppercase tracking-wider text-[10px] mb-1">Handcrafted Curation Notice</p>
                                            <p className="font-light text-[11px]">
                                                Your order is currently in fabric sourcing and quality tailor-finishing. Deeprastore orders are uniquely handcrafted, requiring dedicated preparation time to maintain premium boutique quality. Expected dispatch updated to 3-4 business days. Thank you for your trust and patience.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* visual timeline list tracker */}
                                <div className="pt-4 relative">
                                    {/* Mobile vertical line, desktop horizontal lines */}
                                    <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-4 md:gap-4">
                                        {ORDER_STEPS.map((step, idx) => {
                                            const currentIdx = getStepIndex(selectedOrder.status);
                                            const isCompleted = idx < currentIdx;
                                            const isCurrent = idx === currentIdx;
                                            const isPending = idx > currentIdx;

                                            return (
                                                <div key={step} className="flex md:flex-col items-center gap-3 md:text-center md:gap-2">
                                                    {/* Circle icon */}
                                                    <div className="relative z-10">
                                                        {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-[#121212]" />}
                                                        {isCurrent && <AlertCircle className="w-5 h-5 text-[#D4AF37] animate-pulse bg-[#121212]" />}
                                                        {isPending && <div className="w-5 h-5 rounded-full border border-zinc-800 bg-[#1a1a1a]" />}
                                                    </div>
                                                    <div>
                                                        <span className={`text-[10px] font-bold block uppercase tracking-wider ${isCurrent ? 'text-[#D4AF37]' : isCompleted ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                                            {step}
                                                        </span>
                                                        <span className="text-[8px] text-zinc-500 font-mono block">
                                                            {isCurrent ? 'Current Phase' : isCompleted ? 'Completed' : 'Pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-zinc-500 italic text-xs">
                                No active orders found. Begin your premium catalog selection.
                            </div>
                        )}
                    </div>

                    {/* Order History Table */}
                    <div className="bg-[#121212] border border-[#222] p-6 rounded-sm">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] mb-6 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Curation Order History
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#222] text-[#A3A3A3] uppercase text-[9px] tracking-wider">
                                        <th className="pb-3.5 font-bold">Order ID</th>
                                        <th className="pb-3.5 font-bold">Status</th>
                                        <th className="pb-3.5 font-bold">Items</th>
                                        <th className="pb-3.5 font-bold">Total</th>
                                        <th className="pb-3.5 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1C1C1C]">
                                    {orders.map(o => (
                                        <tr key={o.id} className="hover:bg-[#161616] transition-colors">
                                            <td className="py-4 font-mono font-bold text-white">#{o.order_number || o.id.slice(0, 8).toUpperCase()}</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm ${o.status === 'Delivered' ? 'bg-emerald-950 text-emerald-400' : 'bg-[#1C1C1C] text-[#A3A3A3]'}`}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-zinc-400">{o.order_items?.length || 0} Products</td>
                                            <td className="py-4 text-[#D4AF37] font-semibold">₹{o.total_amount.toLocaleString('en-IN')}</td>
                                            <td className="py-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedOrder(o)}
                                                    className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] hover:underline"
                                                >
                                                    Track
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-zinc-500 italic">No orders found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-[#1A1A1A] bg-[#0E0E0E] py-6 text-center text-[10px] text-zinc-600 uppercase tracking-widest">
                Deeprastore Premium Editorial © 2026. All Rights Reserved.
            </div>
        </main>
    );
}
