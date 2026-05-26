"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Complaint, Order } from '@/types';
import { 
    Search, Plus, X, ArrowRight, CheckCircle2, 
    ShieldAlert, Sparkles, Scale, RefreshCw, 
    FileText, Image as ImageIcon, Check, User, Info, Scissors
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateComplaintStatusAction, createComplaintAction, escalateToTailoringAction } from '@/lib/actions/complaints';
import { toggleOrderRefundEligibilityAction } from '@/lib/actions/orders';

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    
    // Lightbox state
    const [previewImg, setPreviewImg] = useState<string | null>(null);

    // Modal state for creating tickets
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [issueType, setIssueType] = useState('size adjustment / fitting alteration');
    const [issueReason, setIssueReason] = useState('');
    const [refundAmount, setRefundAmount] = useState(0);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [escalationSuccess, setEscalationSuccess] = useState<string | null>(null);

    const COMPLAINT_CATEGORIES = [
        'size adjustment / fitting alteration',
        'product replacement',
        'stitching issue',
        'blouse issue',
        'damage / defective product',
        'wrong product received',
        'fabric mismatch',
        'color variation',
        'delay in delivery',
        'tailoring delay',
        'fabric sourcing issue',
        'customization delay',
        'out-of-stock after order',
        'production delay',
        'other'
    ];

    useEffect(() => {
        fetchComplaints();
        fetchOrdersForDropdown();
    }, [filter]);

    useEffect(() => {
        const channel = supabase.channel('realtime_complaints_admin')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaints' }, async (payload) => {
                const { data } = await supabase.from('complaints').select(`
                    *,
                    orders (
                        id, 
                        order_number, 
                        total_amount, 
                        status, 
                        payment_status, 
                        measurements, 
                        refund_eligible,
                        order_items (id, product_name, customizations)
                    ),
                    customers (id, full_name, phone_number, measurements)
                `).eq('id', payload.new.id).single();
                if (data) {
                    setComplaints(prev => [data, ...prev]);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'complaints' }, async (payload) => {
                const { data } = await supabase.from('complaints').select(`
                    *,
                    orders (
                        id, 
                        order_number, 
                        total_amount, 
                        status, 
                        payment_status, 
                        measurements, 
                        refund_eligible,
                        order_items (id, product_name, customizations)
                    ),
                    customers (id, full_name, phone_number, measurements)
                `).eq('id', payload.new.id).single();
                if (data) {
                    setComplaints(prev => prev.map(c => c.id === data.id ? data : c));
                    setSelectedComplaint((prev: any) => prev?.id === data.id ? data : prev);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchComplaints() {
        setLoading(true);
        try {
            let query = supabase.from('complaints').select(`
                *,
                orders (
                    id,
                    order_number,
                    total_amount,
                    status,
                    payment_status,
                    measurements,
                    refund_eligible,
                    order_items (
                        id,
                        product_name,
                        customizations
                    )
                ),
                customers (
                    id,
                    full_name,
                    phone_number,
                    measurements
                )
            `).order('created_at', { ascending: false });

            if (filter !== 'All') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            
            setComplaints(data || []);
            if (data && data.length > 0 && !selectedComplaint) {
                setSelectedComplaint(data[0]);
            }
        } catch (err) {
            console.error("Error fetching complaints:", err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchOrdersForDropdown() {
        const { data } = await supabase
            .from('orders')
            .select('id, order_number, customers(full_name)')
            .order('created_at', { ascending: false })
            .limit(50);
        if (data) setOrders(data);
    }

    async function handleCreateComplaint(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedOrderId) return alert('Please select an order reference');
        
        setSaving(true);
        try {
            const { data: orderData } = await supabase.from('orders').select('customer_id').eq('id', selectedOrderId).single();
            if (!orderData) throw new Error('Order not found');

            const res = await createComplaintAction({
                order_id: selectedOrderId,
                customer_id: orderData.customer_id,
                issue_type: issueType as any,
                issue_reason: issueReason,
                refund_amount: refundAmount,
                status: 'Open'
            });

            if (!res.success) throw new Error(res.error);
            
            setShowModal(false);
            setSelectedOrderId('');
            setIssueReason('');
            setRefundAmount(0);
            fetchComplaints();
        } catch (err: any) {
            alert(err.message || 'Failed to create complaint ticket');
        } finally {
            setSaving(false);
        }
    }

    async function updateStatus(id: string, newStatus: string) {
        setActionLoading('status');
        try {
            const res = await updateComplaintStatusAction(id, newStatus);
            if (!res.success) throw new Error(res.error);
            // Local state updates handled via realtime or direct call
            fetchComplaints();
        } catch (err: any) {
            alert(err.message || 'Failed to update ticket status');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleToggleRefundEligible(orderId: string, currentVal: boolean) {
        setActionLoading('refund');
        try {
            const res = await toggleOrderRefundEligibilityAction(orderId, !currentVal);
            if (!res.success) throw new Error(res.error);
            fetchComplaints();
        } catch (err: any) {
            alert(err.message || 'Failed to update order refund eligibility');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleEscalateToTailoring(complaintId: string) {
        setActionLoading('escalate');
        setEscalationSuccess(null);
        try {
            const res = await escalateToTailoringAction(complaintId);
            if (!res.success) throw new Error(res.error);
            setEscalationSuccess(res.alterationId || 'created');
            fetchComplaints();
        } catch (err: any) {
            alert(err.message || 'Failed to escalate to tailoring queue');
        } finally {
            setActionLoading(null);
        }
    }

    const filteredComplaints = complaints.filter(c => {
        const query = searchQuery.toLowerCase();
        return (
            c.id.toLowerCase().includes(query) ||
            c.customers?.full_name?.toLowerCase().includes(query) ||
            c.customers?.phone_number?.includes(query) ||
            c.issue_type?.toLowerCase().includes(query) ||
            c.orders?.order_number?.toLowerCase().includes(query)
        );
    });

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    const formatDate = (d: string) => {
        const dt = new Date(d);
        return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-6 md:p-8 space-y-8 font-sans">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-800/80 pb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-display font-light tracking-wider text-white">
                        Boutique Complaints & <span className="text-[#D4AF37]">Alterations</span>
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-mono">
                        Elite Diagnostics Command Center | Sizing Audit & Resolution Pipelines
                    </p>
                </div>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="self-start md:self-auto bg-[#D4AF37] hover:bg-[#B8962B] text-black font-semibold text-xs tracking-wider uppercase px-5 py-3 rounded-sm transition-all duration-300 flex items-center gap-2 border-none shadow-lg shadow-amber-950/20"
                >
                    <Plus size={16} /> New Support Ticket
                </button>
            </div>

            {/* Filters and search bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin scrollbar-thumb-zinc-800">
                    {['All', 'URGENT', 'Open', 'In Progress', 'Resolved', 'Closed'].map(status => (
                        <button 
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-sm text-xs font-mono tracking-widest uppercase transition-all duration-300 border ${
                                filter === status 
                                    ? 'bg-[#D4AF37] border-[#D4AF37] text-black font-bold' 
                                    : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <input 
                        type="text"
                        placeholder="Search by ID, customer name, phone, or issue..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-[#121212] border border-zinc-800/80 rounded-sm py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] transition-all"
                    />
                </div>
            </div>

            {/* Dashboard Split Layout Grid */}
            {loading ? (
                <div className="h-[500px] flex items-center justify-center border border-zinc-800/50 bg-zinc-900/10 rounded-sm">
                    <div className="flex flex-col items-center gap-3 text-zinc-400 font-mono text-xs uppercase tracking-widest">
                        <RefreshCw className="animate-spin text-[#D4AF37]" size={24} />
                        Syncing CRM Pipelines...
                    </div>
                </div>
            ) : complaints.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center border border-dashed border-zinc-800 bg-zinc-900/5 rounded-sm p-6 text-center">
                    <ShieldAlert className="text-zinc-600 mb-3" size={36} />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">No Tickets Logged</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm font-light">
                        All clear. Customer satisfaction reports are balanced. No active fitting or alteration disputes found matching this criteria.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Panel: Ticket List (Col 5) */}
                    <div className="lg:col-span-5 space-y-4 max-h-[750px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-semibold border-b border-zinc-800 pb-2">
                            Active Tickets ({filteredComplaints.length})
                        </div>
                        <div className="space-y-3">
                            {filteredComplaints.map(c => {
                                const isSelected = selectedComplaint?.id === c.id;
                                return (
                                    <div 
                                        key={c.id}
                                        onClick={() => setSelectedComplaint(c)}
                                        className={`p-4 rounded-sm border transition-all duration-300 cursor-pointer text-left ${
                                            isSelected 
                                                ? 'bg-[#151515] border-[#D4AF37] shadow-md shadow-amber-950/10' 
                                                : 'bg-[#111] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#131313]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase">
                                                ID: {c.id.slice(0, 8)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                                c.status === 'URGENT' 
                                                    ? 'bg-red-950/40 text-red-400 border border-red-800/40' 
                                                    : c.status === 'Open' 
                                                    ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' 
                                                    : c.status === 'Resolved' 
                                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                                                    : 'bg-zinc-800 text-zinc-400'
                                            }`}>
                                                {c.status}
                                            </span>
                                        </div>

                                        <h4 className="text-xs font-semibold text-white truncate uppercase tracking-wider">
                                            {c.customers?.full_name || 'Guest Customer'}
                                        </h4>
                                        
                                        <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-2 font-mono">
                                            <span className="text-zinc-500">REF: {c.orders?.order_number || `ORD-${c.order_id.slice(0, 6)}`}</span>
                                            <span>{formatDate(c.created_at)}</span>
                                        </div>

                                        <div className="mt-3 pt-2.5 border-t border-zinc-800/50 flex items-center justify-between">
                                            <span className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold truncate max-w-[200px]">
                                                {c.issue_type}
                                            </span>
                                            <ArrowRight size={12} className={`text-zinc-600 transition-transform ${isSelected ? 'translate-x-1 text-[#D4AF37]' : ''}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Panel: Detail Panel Comparison (Col 7) */}
                    <div className="lg:col-span-7 bg-[#111] border border-zinc-800 rounded-sm p-6 space-y-6">
                        <AnimatePresence mode="wait">
                            {selectedComplaint ? (
                                <motion.div
                                    key={selectedComplaint.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-6"
                                >
                                    {/* Selected Ticket Top header details */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5 gap-3">
                                        <div>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                                TICKET DIAGNOSTICS & COMPARATIVE AUDIT
                                            </span>
                                            <h2 className="text-lg font-bold text-white uppercase mt-0.5">
                                                {selectedComplaint.customers?.full_name}
                                            </h2>
                                            <p className="text-xs text-zinc-400 font-mono">
                                                Phone: {selectedComplaint.customers?.phone_number} | Order Ref: {selectedComplaint.orders?.order_number || selectedComplaint.order_id}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            <span className="text-xs text-zinc-500 font-mono uppercase">Ticket Status:</span>
                                            <select 
                                                value={selectedComplaint.status}
                                                disabled={actionLoading === 'status'}
                                                onChange={(e) => updateStatus(selectedComplaint.id, e.target.value)}
                                                className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded-sm py-1 px-3 outline-none focus:border-[#D4AF37] cursor-pointer"
                                            >
                                                <option value="Open">Open</option>
                                                <option value="URGENT">URGENT</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* SIDE BY SIDE COMPARISON GRID */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                        {/* Left Side: Original Measurements */}
                                        <div className="bg-zinc-950 border border-zinc-850/60 p-5 rounded-sm flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 text-[#D4AF37] font-mono text-[10px] uppercase tracking-widest font-semibold border-b border-zinc-800/80 pb-2 mb-3">
                                                    <Scale size={13} />
                                                    Original Measurements
                                                </div>

                                                {/* Render measurements */}
                                                {selectedComplaint.orders?.measurements || selectedComplaint.customers?.measurements ? (
                                                    <div className="space-y-4">
                                                        {/* Render Blouse details if present */}
                                                        {(() => {
                                                            const m = selectedComplaint.orders?.measurements || selectedComplaint.customers?.measurements || {};
                                                            const blouseKeys = ['Shoulder', 'Chest Around', 'Waist Around', 'Sleeve Length', 'Front neck Depth', 'Back Neck Depth'];
                                                            const hasBlouse = blouseKeys.some(k => m[k]);
                                                            
                                                            if (!hasBlouse) return null;
                                                            return (
                                                                <div>
                                                                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2 font-mono">Blouse Specification:</div>
                                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                                        {blouseKeys.map(k => m[k] && (
                                                                            <div key={k} className="border-b border-zinc-900/60 pb-1">
                                                                                <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">{k}</span>
                                                                                <span className="text-zinc-200 font-medium font-mono">{m[k]}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Render Lehenga details if present */}
                                                        {(() => {
                                                            const m = selectedComplaint.orders?.measurements || selectedComplaint.customers?.measurements || {};
                                                            const lehengaKeys = ['Waist', 'Hips', 'Length'];
                                                            const hasLehenga = lehengaKeys.some(k => m[k]);
                                                            
                                                            if (!hasLehenga) return null;
                                                            return (
                                                                <div className="pt-2 border-t border-zinc-900/80">
                                                                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2 font-mono">Lehenga Spec:</div>
                                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                                        {lehengaKeys.map(k => m[k] && (
                                                                            <div key={k} className="border-b border-zinc-900/60 pb-1">
                                                                                <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">{k}</span>
                                                                                <span className="text-zinc-200 font-medium font-mono">{m[k]}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Render other keys as fallback key-values */}
                                                        {(() => {
                                                            const m = selectedComplaint.orders?.measurements || selectedComplaint.customers?.measurements || {};
                                                            const standardKeys = ['Shoulder', 'Shoulder Full length', 'Front neck Depth', 'Chest Around', 'Waist Around', 'Back Neck Depth', 'Blouse Front Side Length', 'Sleeve Length', 'Sleeve length Around', 'Armhole around', 'Blouse Apex Point', 'Waist', 'Hips', 'Length', 'Extra Note'];
                                                            const otherKeys = Object.keys(m).filter(k => !standardKeys.includes(k));
                                                            
                                                            if (otherKeys.length === 0) return null;
                                                            return (
                                                                <div className="pt-2 border-t border-zinc-900/80">
                                                                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2 font-mono">Other Specifications:</div>
                                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                                        {otherKeys.map(k => (
                                                                            <div key={k} className="border-b border-zinc-900/60 pb-1">
                                                                                <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">{k}</span>
                                                                                <span className="text-zinc-200 font-medium font-mono">{m[k] || 'N/A'}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-zinc-500 italic py-6 text-center">
                                                        No digital measurement profile found on this order/customer profile.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Order Amount Info */}
                                            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                                                <span className="text-zinc-500 uppercase tracking-widest">Order Total:</span>
                                                <span className="font-mono font-bold text-white">
                                                    {selectedComplaint.orders?.total_amount ? formatCurrency(selectedComplaint.orders.total_amount) : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right Side: Customer Remarks & Proofs */}
                                        <div className="bg-zinc-950 border border-zinc-850/60 p-5 rounded-sm flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-[#D4AF37] font-mono text-[10px] uppercase tracking-widest font-semibold border-b border-zinc-800/80 pb-2">
                                                    <FileText size={13} />
                                                    Alteration Remarks
                                                </div>

                                                <div className="space-y-1.5">
                                                    <span className="text-zinc-500 text-[9px] uppercase tracking-widest block font-mono">Issue Category:</span>
                                                    <span className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 uppercase tracking-wider py-1 px-2.5 rounded-sm inline-block font-mono">
                                                        {selectedComplaint.issue_type}
                                                    </span>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <span className="text-zinc-500 text-[9px] uppercase tracking-widest block font-mono">Customer Explanations & Notes:</span>
                                                    <p className="text-xs text-zinc-200 bg-zinc-900/40 border border-zinc-900 p-3 rounded-sm leading-relaxed italic">
                                                        "{selectedComplaint.issue_reason || 'No description provided'}"
                                                    </p>
                                                </div>

                                                {/* Uploaded Reference Proof Photo */}
                                                <div className="space-y-2">
                                                    <span className="text-zinc-500 text-[9px] uppercase tracking-widest block font-mono">Customer Photo/Video References:</span>
                                                    {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 ? (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {selectedComplaint.attachments.map((img: string, i: number) => (
                                                                <div 
                                                                    key={i} 
                                                                    onClick={() => setPreviewImg(img)}
                                                                    className="aspect-square bg-zinc-900 border border-zinc-850 rounded-sm overflow-hidden cursor-pointer hover:border-[#D4AF37] transition-all relative group"
                                                                >
                                                                    <img src={img} alt="customer proof" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <span className="text-[9px] text-[#D4AF37] font-mono uppercase tracking-widest font-bold">Zoom</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="border border-dashed border-zinc-800 bg-zinc-900/10 p-4 rounded-sm text-center">
                                                            <ImageIcon size={18} className="text-zinc-600 mx-auto mb-1" />
                                                            <span className="text-[10px] text-zinc-500 italic block">No proof media files uploaded.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 text-[10px] text-zinc-500 font-mono text-right">
                                                Filed on: {new Date(selectedComplaint.created_at).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ADMINISTRATIVE ACTION CONTROL HUB */}
                                    <div className="bg-[#151515] border border-zinc-800 p-5 rounded-sm space-y-4">
                                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles size={14} className="text-[#D4AF37]" />
                                                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-bold">
                                                    Administrative Override Command Hub
                                                </span>
                                            </div>
                                            {selectedComplaint.orders?.status && (
                                                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-sm">
                                                    Order Status: {selectedComplaint.orders.status}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-zinc-950 border border-zinc-905/60 rounded-sm">
                                            <div className="max-w-md">
                                                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                                    Toggle Refund Eligibility
                                                </h4>
                                                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                                                    Enabling this sets <span className="font-mono text-amber-500">refund_eligible = true</span> on the parent order table. This authorizes payment processing pipelines and shifts order status to <span className="text-amber-500 font-mono">"Refund Eligible"</span>.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`text-[10px] font-mono uppercase font-bold tracking-widest ${
                                                    selectedComplaint.orders?.refund_eligible ? 'text-emerald-400' : 'text-zinc-500'
                                                }`}>
                                                    {selectedComplaint.orders?.refund_eligible ? 'ELIGIBLE FOR REFUND' : 'REFUND INACTIVE'}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleRefundEligible(selectedComplaint.order_id, selectedComplaint.orders?.refund_eligible)}
                                                    disabled={actionLoading === 'refund' || !selectedComplaint.order_id}
                                                    className={`w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none p-1 relative ${
                                                        selectedComplaint.orders?.refund_eligible ? 'bg-emerald-600' : 'bg-zinc-800'
                                                    }`}
                                                >
                                                    <span 
                                                        className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                                                            selectedComplaint.orders?.refund_eligible ? 'translate-x-7' : 'translate-x-0'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Escalate to Tailoring Bridge */}
                                        {(selectedComplaint.issue_type?.toLowerCase().includes('fitting') ||
                                          selectedComplaint.issue_type?.toLowerCase().includes('alteration') ||
                                          selectedComplaint.issue_type?.toLowerCase().includes('size') ||
                                          selectedComplaint.issue_type?.toLowerCase().includes('stitching') ||
                                          selectedComplaint.issue_type?.toLowerCase().includes('blouse')) && (
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-zinc-950 border border-amber-900/20 rounded-sm">
                                                <div className="max-w-md">
                                                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Scissors size={13} /> Escalate to Artisan Tailoring Queue
                                                    </h4>
                                                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                                                        Creates an <span className="font-mono text-amber-400">alterations_history</span> entry for the Master Tailor Console at <span className="text-amber-400 font-mono">/admin/alterations</span>. The tailor will assign adjustment notes and execute the fitting correction.
                                                    </p>
                                                    {escalationSuccess && (
                                                        <p className="text-[10px] text-emerald-400 font-mono mt-1.5">
                                                            ✅ Escalated — Alteration Job ID: {escalationSuccess.slice(0, 8).toUpperCase()}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleEscalateToTailoring(selectedComplaint.id)}
                                                    disabled={actionLoading === 'escalate'}
                                                    className="shrink-0 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-400 font-bold text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {actionLoading === 'escalate' ? (
                                                        <RefreshCw size={12} className="animate-spin" />
                                                    ) : (
                                                        <Scissors size={12} />
                                                    )}
                                                    {actionLoading === 'escalate' ? 'Escalating...' : 'Escalate to Tailoring'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center text-center text-zinc-500 uppercase tracking-widest font-mono text-xs">
                                    <Scale size={28} className="text-zinc-700 mb-3" />
                                    SELECT A TICKET TO INITIATE REVIEW | Elite Boutique Alterations
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* LIGHTBOX MODAL */}
            {previewImg && (
                <div 
                    onClick={() => setPreviewImg(null)} 
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center cursor-pointer p-4 transition-all duration-300"
                >
                    <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center">
                        <button 
                            onClick={() => setPreviewImg(null)} 
                            className="absolute -top-10 right-0 bg-zinc-900 border border-zinc-800 p-2 rounded-sm text-zinc-400 hover:text-white cursor-pointer transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <img 
                            src={previewImg} 
                            alt="Full screen preview" 
                            className="max-w-full max-h-full object-contain rounded-sm border border-zinc-800" 
                        />
                    </div>
                </div>
            )}

            {/* CREATE TICKET MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#121212] border border-zinc-800 rounded-sm w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center bg-zinc-900/60 px-6 py-4 border-b border-zinc-800">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
                                <Sparkles size={16} /> Lodge CRM Support Ticket
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-zinc-500 hover:text-white bg-transparent border-none cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateComplaint} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-1.5">Select Order Reference</label>
                                <select 
                                    required
                                    value={selectedOrderId}
                                    onChange={e => setSelectedOrderId(e.target.value)}
                                    className="w-full text-xs py-3 px-4 border border-zinc-800 bg-zinc-950 text-white outline-none focus:border-[#D4AF37] rounded-sm cursor-pointer"
                                >
                                    <option value="">-- Select Recent Order Reference --</option>
                                    {orders.map((o: any) => (
                                        <option key={o.id} value={o.id}>
                                            {o.order_number || o.id.slice(0, 8).toUpperCase()} - {o.customers?.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-1.5">Issue Category</label>
                                <select 
                                    value={issueType}
                                    onChange={e => setIssueType(e.target.value)}
                                    className="w-full text-xs py-3 px-4 border border-zinc-800 bg-zinc-950 text-white outline-none focus:border-[#D4AF37] rounded-sm cursor-pointer"
                                >
                                    {COMPLAINT_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-1.5 font-bold">Issue Details / Remarks</label>
                                <textarea 
                                    required
                                    value={issueReason}
                                    onChange={e => setIssueReason(e.target.value)}
                                    rows={4}
                                    style={{ resize: 'none' }}
                                    className="w-full text-xs p-4 border border-zinc-800 bg-zinc-950 text-white outline-none focus:border-[#D4AF37] rounded-sm placeholder-zinc-650"
                                    placeholder="Explain the sizing fit issues or damage detail reports..."
                                />
                            </div>

                            {issueType.toLowerCase().includes('refund') && (
                                <div>
                                    <label className="block text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-1.5">Authorized Refund Amount (₹)</label>
                                    <input 
                                        type="number"
                                        value={refundAmount}
                                        onChange={e => setRefundAmount(Number(e.target.value))}
                                        className="w-full text-xs py-3 px-4 border border-zinc-800 bg-zinc-950 text-white outline-none focus:border-[#D4AF37] rounded-sm"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-850">
                                <button 
                                    type="button" 
                                    className="border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white px-5 py-3 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="bg-[#D4AF37] hover:bg-[#B8962B] text-black font-bold text-[10px] uppercase tracking-widest px-5 py-3 rounded-sm transition-all disabled:bg-zinc-800 disabled:text-zinc-650 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Creating Ticket...' : 'Register Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
