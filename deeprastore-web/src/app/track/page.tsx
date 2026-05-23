"use client";

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Phone, Mail, Package, Calendar, Clock, Truck, 
    ArrowRight, CornerDownLeft, AlertCircle, CheckCircle, 
    MessageSquare, RefreshCw, Scissors, ShieldCheck, ChevronRight
} from 'lucide-react';
import { 
    trackOrderPublicAction, 
    lookupOrdersByPhoneAction, 
    submitReturnRequestAction 
} from '@/lib/actions/returns';

export default function TrackOrder() {
    const [searchTab, setSearchTab] = useState<'id' | 'phone'>('id');
    const [orderIdInput, setOrderIdInput] = useState('');
    const [phoneOrEmailInput, setPhoneOrEmailInput] = useState('');
    
    const [order, setOrder] = useState<any>(null);
    const [activeReturn, setActiveReturn] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Returns workflow
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [returnType, setReturnType] = useState<'Replacement' | 'Refund' | 'Alteration'>('Alteration');
    const [returnReason, setReturnReason] = useState('Fit adjustment required');
    const [returnNotes, setReturnNotes] = useState('');
    const [returnResolution, setReturnResolution] = useState('Alteration/Exchange');
    const [returnLoading, setReturnLoading] = useState(false);

    const handleIdSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');
        setOrder(null);
        setRecentOrders([]);
        setActiveReturn(null);

        const res = await trackOrderPublicAction(orderIdInput, phoneOrEmailInput);
        if (res.success) {
            setOrder(res.order);
            setActiveReturn(res.activeReturn);
        } else {
            setError(res.error || 'Failed to locate order.');
        }
        setLoading(false);
    };

    const handlePhoneSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');
        setOrder(null);
        setRecentOrders([]);
        setActiveReturn(null);

        const res = await lookupOrdersByPhoneAction(phoneOrEmailInput);
        if (res.success && res.orders) {
            if (res.orders.length === 1) {
                // Auto load if single order
                setOrder(res.orders[0]);
                // Fetch return status
                const detailsRes = await trackOrderPublicAction(res.orders[0].id, phoneOrEmailInput);
                if (detailsRes.success) {
                    setActiveReturn(detailsRes.activeReturn);
                }
            } else if (res.orders.length > 1) {
                setRecentOrders(res.orders);
            } else {
                setError('No orders found matching this contact number or email.');
            }
        } else {
            setError(res.error || 'Failed to locate customer orders.');
        }
        setLoading(false);
    };

    const selectOrderFromList = async (selectedOrder: any) => {
        setLoading(true);
        const res = await trackOrderPublicAction(selectedOrder.id, phoneOrEmailInput);
        if (res.success) {
            setOrder(res.order);
            setActiveReturn(res.activeReturn);
            setRecentOrders([]);
        } else {
            setError(res.error || 'Verification failed.');
        }
        setLoading(false);
    };

    const handleReturnSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setReturnLoading(true);
        setError('');
        setSuccessMsg('');

        const res = await submitReturnRequestAction({
            orderId: order.id,
            phone: phoneOrEmailInput || order.customers?.phone_number,
            issueType: returnType,
            reason: returnReason + (returnNotes ? `: ${returnNotes}` : ''),
            resolution: returnResolution
        });

        if (res.success) {
            setSuccessMsg('Your return request has been submitted successfully. A boutique concierge will review it shortly.');
            setShowReturnForm(false);
            // Refresh order state
            const refreshRes = await trackOrderPublicAction(order.id, phoneOrEmailInput || order.customers?.phone_number);
            if (refreshRes.success) {
                setOrder(refreshRes.order);
                setActiveReturn(refreshRes.activeReturn);
            }
        } else {
            setError(res.error || 'Failed to submit return request.');
        }
        setReturnLoading(false);
    };

    // Milestone statuses definitions
    const milestones = [
        { key: 'placed', label: 'Consultation & Curation', desc: 'Order received & style consulting started' },
        { key: 'confirmed', label: 'Design Confirmed', desc: 'Sartorial choices & parameters approved' },
        { key: 'stitching', label: 'Artisan Stitching', desc: 'Handcrafted details and tailoring in progress' },
        { key: 'ready', label: 'Quality Inspected', desc: 'Finished, pressed & packaged at boutique' },
        { key: 'dispatched', label: 'In Transit', desc: 'Secure shipping by premium cargo logistics' },
        { key: 'delivered', label: 'Hand Delivered', desc: 'Order safely delivered' }
    ];

    const getStatusIndex = (status: string) => {
        const s = status?.toLowerCase() || 'pending';
        if (s === 'pending' || s === 'pending approval' || s === 'payment pending') return 0;
        if (s === 'confirmed') return 1;
        if (s === 'to stitching' || s === 'in stitching') return 2;
        if (s === 'ready') return 3;
        if (s === 'dispatched') return 4;
        if (s === 'delivered') return 5;
        return 0; // Default
    };

    const getWhatsAppUrl = () => {
        if (!order) return 'https://wa.me/919999999999';
        const msg = `Hi! I need help with my Order ${order.order_number || order.id.substring(0,8)} (Current status: ${order.status || 'Pending'}).`;
        return `https://wa.me/919999999999?text=${encodeURIComponent(msg)}`;
    };

    return (
        <main className="relative bg-[#0F0F0F] text-white min-h-screen flex flex-col font-sans">
            <Navbar />
            
            <div className="flex-1 max-w-4xl mx-auto px-6 py-28 w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-display font-light uppercase tracking-widest text-[#D4AF37] mb-3">
                        Boutique Tracking Portal
                    </h1>
                    <p className="text-[#A3A3A3] text-xs font-bold uppercase tracking-wider max-w-md mx-auto">
                        Deeprastore Operating System / Curation Logistics
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8 border-b border-[#222]">
                    <button 
                        onClick={() => { setSearchTab('id'); setError(''); }}
                        className={`px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all ${searchTab === 'id' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-[#737373] hover:text-[#E5E5E5]'}`}
                    >
                        Track by Order ID
                    </button>
                    <button 
                        onClick={() => { setSearchTab('phone'); setError(''); }}
                        className={`px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all ${searchTab === 'phone' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-[#737373] hover:text-[#E5E5E5]'}`}
                    >
                        Lookup by Phone / Email
                    </button>
                </div>

                {/* Search Panel */}
                <div className="bg-[#161616] border border-[#222] p-8 md:p-10 rounded shadow-2xl mb-10">
                    <form onSubmit={searchTab === 'id' ? handleIdSearch : handlePhoneSearch} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {searchTab === 'id' ? (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Order ID or Number</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                required
                                                value={orderIdInput}
                                                onChange={(e) => setOrderIdInput(e.target.value)}
                                                placeholder="e.g. ORD-818378 or UUID"
                                                className="w-full bg-[#222] border border-[#333] py-3 pl-4 pr-10 text-xs focus:outline-none focus:border-[#D4AF37] text-white rounded transition-colors"
                                            />
                                            <Package className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Contact Phone or Email</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                required
                                                value={phoneOrEmailInput}
                                                onChange={(e) => setPhoneOrEmailInput(e.target.value)}
                                                placeholder="Registered phone or email"
                                                className="w-full bg-[#222] border border-[#333] py-3 pl-4 pr-10 text-xs focus:outline-none focus:border-[#D4AF37] text-white rounded transition-colors"
                                            />
                                            <Phone className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Registered Phone Number or Email</label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            required
                                            value={phoneOrEmailInput}
                                            onChange={(e) => setPhoneOrEmailInput(e.target.value)}
                                            placeholder="Enter phone number (e.g. 7702286791) or email address"
                                            className="w-full bg-[#222] border border-[#333] py-3.5 pl-4 pr-10 text-xs focus:outline-none focus:border-[#D4AF37] text-white rounded transition-colors"
                                        />
                                        <Search className="absolute right-4 top-3.5 w-4.5 h-4.5 text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="px-8 py-3.5 bg-[#D4AF37] text-black font-extrabold uppercase tracking-widest hover:bg-[#B8962B] transition-colors rounded disabled:opacity-40 flex items-center gap-2 text-[10px]"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                                    </>
                                ) : (
                                    'Query Curation System'
                                )}
                            </button>
                        </div>
                        {error && (
                            <div className="border border-rose-950 bg-rose-950/20 text-rose-400 p-3 rounded text-xs flex items-center gap-2 mt-4">
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {successMsg && (
                            <div className="border border-green-950 bg-green-950/20 text-green-400 p-3 rounded text-xs flex items-center gap-2 mt-4">
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                <span>{successMsg}</span>
                            </div>
                        )}
                    </form>
                </div>

                {/* Multiple Orders Selector */}
                {recentOrders.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#161616] border border-[#222] p-6 rounded mb-10 space-y-4"
                    >
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] border-b border-[#222] pb-2">
                            Select Curation Order
                        </h3>
                        <div className="grid gap-3">
                            {recentOrders.map(o => (
                                <button
                                    key={o.id}
                                    onClick={() => selectOrderFromList(o)}
                                    className="flex justify-between items-center bg-[#222] hover:bg-[#262626] border border-[#333] hover:border-[#D4AF37] p-4 text-left rounded transition-all group"
                                >
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors">{o.order_number || o.id.substring(0,8)}</p>
                                        <p className="text-[10px] text-[#A3A3A3]">Placed: {new Date(o.created_at).toLocaleDateString()} • Value: ₹{o.total_amount?.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border border-[#333] text-white">
                                            {o.status || 'Pending'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Order Tracking Timeline & Details */}
                {order && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        {/* Order Header Card */}
                        <div className="bg-[#161616] border border-[#222] p-8 rounded shadow-xl flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/50 px-2 py-0.5 rounded">
                                    Curation Order Active
                                </span>
                                <h2 className="text-xl font-bold font-display text-white mt-1">
                                    {order.order_number || order.id.substring(0, 8)}
                                </h2>
                                <p className="text-[#A3A3A3] text-xs">
                                    Customer: <span className="text-white font-medium">{order.customers?.full_name || 'VIP Client'}</span> • Placed: {new Date(order.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="md:text-right flex flex-col justify-end gap-1">
                                <p className="text-[#A3A3A3] text-[10px] font-bold uppercase tracking-widest">Order Status</p>
                                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] py-1">
                                    {order.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Timeline */}
                        {order.status?.toLowerCase() === 'cancelled' ? (
                            <div className="bg-rose-950/20 border border-rose-900/60 p-6 rounded text-center space-y-2">
                                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400">Order Cancelled</h3>
                                <p className="text-rose-200/80 text-xs max-w-md mx-auto leading-relaxed">
                                    This order is marked as cancelled. Any payments captured will be refunded according to our standard operating parameters. Contact support for assistance.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-[#161616] border border-[#222] p-8 rounded shadow-xl">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-8 border-b border-[#222] pb-3">
                                    Logistics Journey Timeline
                                </h3>
                                
                                <div className="space-y-6">
                                    {milestones.map((m, index) => {
                                        const activeIndex = getStatusIndex(order.status);
                                        const isCompleted = activeIndex >= index;
                                        const isCurrent = activeIndex === index;
                                        
                                        return (
                                            <div key={m.key} className="flex gap-4 relative group">
                                                {/* Left line connection */}
                                                {index < milestones.length - 1 && (
                                                    <div className={`absolute left-3.5 top-8 w-0.5 h-12 -translate-x-1/2 ${activeIndex > index ? 'bg-[#D4AF37]' : 'bg-[#262626]'}`}></div>
                                                )}
                                                
                                                {/* Node Circle */}
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 z-10 transition-all ${isCompleted ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'bg-[#161616] border-[#333] text-[#737373]'} ${isCurrent ? 'ring-4 ring-[#D4AF37]/10 scale-110' : ''}`}>
                                                    {isCompleted ? (
                                                        <ShieldCheck className="w-4 h-4" />
                                                    ) : (
                                                        <span className="text-[10px] font-bold">{index + 1}</span>
                                                    )}
                                                </div>

                                                {/* Detail content */}
                                                <div className="space-y-0.5">
                                                    <h4 className={`text-xs font-bold uppercase tracking-wider transition-colors ${isCompleted ? 'text-[#D4AF37]' : 'text-[#737373]'} ${isCurrent ? 'text-white' : ''}`}>
                                                        {m.label}
                                                    </h4>
                                                    <p className={`text-[11px] leading-relaxed transition-colors ${isCompleted ? 'text-[#E5E5E5]/90' : 'text-[#525252]'}`}>
                                                        {m.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* expected delivery SLA block */}
                        {order.status?.toLowerCase() !== 'cancelled' && order.status?.toLowerCase() !== 'delivered' && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-[#161616] border border-[#222] p-6 rounded shadow-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 text-[#D4AF37]">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[#A3A3A3] text-[9px] font-bold uppercase tracking-widest">Expected Delivery</p>
                                        <p className="text-xs font-bold text-white">
                                            {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'To Be Decided'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-[#161616] border border-[#222] p-6 rounded shadow-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 text-[#D4AF37]">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[#A3A3A3] text-[9px] font-bold uppercase tracking-widest">Target Timeline</p>
                                        <p className="text-xs font-bold text-white">
                                            {order.target_days ? `${order.target_days} Curation Days SLA` : 'Standard Custom Tailoring'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Logistics transit tracking information */}
                        {order.status?.toLowerCase() === 'dispatched' && order.tracking_number && (
                            <div className="bg-amber-950/20 border border-amber-900/60 p-6 rounded shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex gap-3">
                                    <Truck className="w-8 h-8 text-amber-500 shrink-0" />
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Shipment Out for Delivery</h4>
                                        <p className="text-[11px] text-amber-200/80 leading-normal">
                                            Tracking Number: <span className="font-extrabold text-white font-mono">{order.tracking_number}</span>
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => window.open(`https://track.delhivery.com/tracking/${order.tracking_number}`, '_blank')}
                                    className="px-5 py-2.5 bg-amber-500 text-black font-extrabold uppercase tracking-widest hover:bg-amber-400 transition-colors text-[9px] rounded flex items-center gap-2"
                                >
                                    Track Cargo <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Active Return Status Banner */}
                        {activeReturn && (
                            <div className="bg-[#1C1510] border border-[#D4AF37]/30 p-6 rounded shadow-xl flex gap-4">
                                <RefreshCw className="w-6 h-6 text-[#D4AF37] shrink-0 animate-pulse mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Active Return Request ({activeReturn.status})</h4>
                                    <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
                                        Type: <span className="text-white font-bold">{activeReturn.issue_type}</span> • Submitted: {new Date(activeReturn.created_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-[11px] text-[#E5E5E5]/80 leading-relaxed italic mt-1">
                                        Reason: {activeReturn.issue_reason}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Order Subtotal Details */}
                        <div className="bg-[#161616] border border-[#222] p-6 rounded shadow-xl space-y-3">
                            <div className="flex justify-between text-xs border-b border-[#222] pb-3">
                                <span className="text-[#A3A3A3]">Items value</span>
                                <span className="font-bold text-white">₹{order.total_amount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs border-b border-[#222] pb-3">
                                <span className="text-[#A3A3A3]">Payment Status</span>
                                <span className="font-bold text-[#D4AF37] capitalize">{order.payment_status || 'Paid'}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-white">Amount Paid</span>
                                <span className="text-[#D4AF37]">₹{order.total_amount?.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Public Returns / Exchange Form */}
                        {order.status?.toLowerCase() === 'delivered' && !activeReturn && (
                            <div className="border border-[#222] bg-[#161616] p-8 rounded shadow-xl space-y-6">
                                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                                        Self-Service Return & Alteration
                                    </h3>
                                    <button 
                                        onClick={() => setShowReturnForm(!showReturnForm)}
                                        className="text-[10px] font-extrabold uppercase tracking-widest border border-[#333] hover:border-[#D4AF37] text-white hover:text-[#D4AF37] px-4 py-2 rounded transition-colors"
                                    >
                                        {showReturnForm ? 'Cancel Request' : 'File Return/Alteration'}
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showReturnForm && (
                                        <motion.form 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            onSubmit={handleReturnSubmit}
                                            className="space-y-5 overflow-hidden text-xs"
                                        >
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-1.5">Action Needed</label>
                                                    <select 
                                                        value={returnType}
                                                        onChange={e => setReturnType(e.target.value as any)}
                                                        className="w-full bg-[#222] border border-[#333] p-2.5 text-xs text-white rounded outline-none focus:border-[#D4AF37]"
                                                    >
                                                        <option value="Alteration">Fitting Alteration (Bespoke size tweaking)</option>
                                                        <option value="Replacement">Size Exchange (Swap for different tag size)</option>
                                                        <option value="Refund">Return (Refund request)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-1.5">Primary Reason</label>
                                                    <select 
                                                        value={returnReason}
                                                        onChange={e => setReturnReason(e.target.value)}
                                                        className="w-full bg-[#222] border border-[#333] p-2.5 text-xs text-white rounded outline-none focus:border-[#D4AF37]"
                                                    >
                                                        <option value="Fit adjustment required">Too loose / Too tight in seams</option>
                                                        <option value="Length adjustment required">Hem length too long/short</option>
                                                        <option value="Damaged on arrival">Arrived with transit damage</option>
                                                        <option value="Color mismatch">Color/Fabric variation mismatch</option>
                                                        <option value="Incorrect sizing tag">Incorrect size dispatched</option>
                                                        <option value="Other">Other (provide details below)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-1.5">Preferred Refund/Resolution Path</label>
                                                <select 
                                                    value={returnResolution}
                                                    onChange={e => setReturnResolution(e.target.value)}
                                                    className="w-full bg-[#222] border border-[#333] p-2.5 text-xs text-white rounded outline-none focus:border-[#D4AF37]"
                                                >
                                                    <option value="Alteration/Exchange">Complementary Curation Alteration & Return</option>
                                                    <option value="Store Credit">Boutique Gift Card / Store Credit (Fastest)</option>
                                                    <option value="Original Payment Refund">Original Payment Gateway Refund (Deduction rules apply)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-1.5">Additional Fitting Notes</label>
                                                <textarea 
                                                    className="w-full bg-[#222] border border-[#333] p-3 text-xs focus:border-[#D4AF37] outline-none min-h-[80px] text-white rounded"
                                                    placeholder="Specify details, e.g. 'bust needs +0.5 inch adjustment'..."
                                                    value={returnNotes}
                                                    onChange={e => setReturnNotes(e.target.value)}
                                                ></textarea>
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={returnLoading}
                                                    className="px-6 py-3 bg-[#D4AF37] text-black font-extrabold uppercase tracking-widest hover:bg-[#B8962B] transition-colors rounded disabled:opacity-40 text-[9px]"
                                                >
                                                    {returnLoading ? 'Registering request...' : 'Submit Request'}
                                                </button>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* WhatsApp support concierge action */}
                        <div className="flex justify-center pt-4">
                            <button 
                                onClick={() => window.open(getWhatsAppUrl(), '_blank')}
                                className="flex items-center gap-2 px-6 py-3 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 text-xs font-bold uppercase tracking-widest transition-all rounded"
                            >
                                <MessageSquare className="w-4 h-4" /> Connect with Personal Curation Concierge
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
