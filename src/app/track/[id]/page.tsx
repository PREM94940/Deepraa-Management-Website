"use client";

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, Calendar, Clock, Truck, ArrowRight, AlertCircle, 
    CheckCircle, MessageSquare, RefreshCw, Scissors, ShieldCheck, 
    Lock, ChevronRight, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import { trackOrderPublicAction } from '@/lib/actions/returns';

// CMS tracking stage type
interface CmsStage {
    id: string;
    stage_key: string;
    label: string;
    description: string;
    reassurance_notice?: string;
    reassurance_title?: string;
    sort_order: number;
}

// Hardcoded fallback 10 Luxury Tracking Stages
const FALLBACK_MILESTONES = [
    { key: 'confirmed', label: 'Order Confirmed', desc: 'Order received and curated style parameters approved.' },
    { key: 'sourcing', label: 'Fabric Sourcing', desc: 'Acquiring premium yardage from our heritage textile mills.' },
    { key: 'inspection', label: 'Fabric Inspection', desc: 'Verifying weave purity, yarn consistency, and color richness.' },
    { key: 'tailoring_started', label: 'Tailoring Started', desc: 'Master tailor drafting patterns and preparing bespoke canvas.' },
    { key: 'stitching', label: 'Stitching In Progress', desc: 'Artisan hand-stitching, lining, and panel assembly.' },
    { key: 'qc', label: 'Quality Check', desc: 'Rigorous measurement verification and structural finish testing.' },
    { key: 'packing', label: 'Packing', desc: 'Pressed, wrapped in acid-free tissue, and sealed in signature boxing.' },
    { key: 'dispatch', label: 'Dispatch', desc: 'Handed over to our secure cargo logistics network.' },
    { key: 'out_for_delivery', label: 'Out For Delivery', desc: 'Boutique courier en route for final signature hand-off.' },
    { key: 'delivered', label: 'Delivered', desc: 'Sartorial curation safely delivered to your residence.' }
];

// Helper to map DB status to 0-based milestone index
const getStatusIndex = (status: string, stages: { key: string }[]) => {
    const s = status?.toLowerCase() || '';
    // Try to match CMS stage keys first
    for (let i = stages.length - 1; i >= 0; i--) {
        const k = stages[i].key.toLowerCase();
        if (s.includes(k)) return i;
    }
    // Keyword fallback
    if (s.includes('delivered')) return stages.length - 1;
    if (s.includes('out for delivery') || s.includes('out_for_delivery') || s.includes('delivery')) return Math.max(0, stages.length - 2);
    if (s.includes('dispatch') || s.includes('shipped') || s.includes('transit')) return Math.max(0, stages.length - 3);
    if (s.includes('packing') || s.includes('prepared') || s.includes('ready')) return Math.max(0, stages.length - 4);
    if (s.includes('qc') || s.includes('quality check') || s.includes('inspection')) return Math.max(0, stages.length - 5);
    if (s.includes('stitching') || s.includes('sewing') || s.includes('progress')) return Math.max(0, stages.length - 6);
    if (s.includes('tailoring') || s.includes('started') || s.includes('cut')) return Math.max(0, stages.length - 7);
    if (s.includes('fabric inspection') || s.includes('fabric_inspection')) return Math.max(0, stages.length - 8);
    if (s.includes('sourcing') || s.includes('fabric')) return Math.max(0, stages.length - 9);
    return 0;
};

// CMS-driven proactive reassurance: find matching stage by keyword and return notice
const getCmsProactiveMessage = (status: string, cmsStages: CmsStage[]) => {
    if (cmsStages.length === 0) return null;
    const s = status?.toLowerCase() || '';

    // Match by stage_key first
    for (const stage of cmsStages) {
        if (s.includes(stage.stage_key.toLowerCase()) && stage.reassurance_notice) {
            return {
                title: stage.reassurance_title || stage.label,
                text: stage.reassurance_notice
            };
        }
    }

    // Keyword fallback across cms stages
    for (const stage of cmsStages) {
        const label = stage.label.toLowerCase();
        if ((s.includes('sourcing') || s.includes('fabric')) && (label.includes('sourcing') || label.includes('fabric'))) {
            if (stage.reassurance_notice) {
                return { title: stage.reassurance_title || stage.label, text: stage.reassurance_notice };
            }
        }
        if (s.includes('inspection') && label.includes('inspection')) {
            if (stage.reassurance_notice) {
                return { title: stage.reassurance_title || stage.label, text: stage.reassurance_notice };
            }
        }
        if ((s.includes('tailoring') || s.includes('stitching') || s.includes('progress')) && (label.includes('tailoring') || label.includes('stitching'))) {
            if (stage.reassurance_notice) {
                return { title: stage.reassurance_title || stage.label, text: stage.reassurance_notice };
            }
        }
        if ((s.includes('qc') || s.includes('quality')) && (label.includes('quality') || label.includes('qc'))) {
            if (stage.reassurance_notice) {
                return { title: stage.reassurance_title || stage.label, text: stage.reassurance_notice };
            }
        }
        if ((s.includes('packing') || s.includes('ready')) && label.includes('packing')) {
            if (stage.reassurance_notice) {
                return { title: stage.reassurance_title || stage.label, text: stage.reassurance_notice };
            }
        }
    }

    return null;
};

// Hardcoded fallback proactive message (used when CMS is empty)
const getFallbackProactiveMessage = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('sourcing') || s.includes('fabric')) {
        return {
            title: "Meticulous Fabric Sourcing",
            text: "Your fabric sourcing is taking slightly longer than expected to maintain our premium quality standards. We source directly from heritage weavers to ensure perfect color fidelity and tensile strength."
        };
    }
    if (s.includes('inspection')) {
        return {
            title: "Fabric Purity Inspection",
            text: "Our material specialists are checking yarn consistency, weave alignment, and dye uniformity. We ensure zero micro-defects before pattern drafting."
        };
    }
    if (s.includes('tailoring') || s.includes('stitching') || s.includes('progress')) {
        return {
            title: "Artisan Hand-Drafting & Sewing",
            text: "Our tailoring team is carefully completing finishing checks and seam-reinforcements. Handmade garments require precise tension control to drape flawlessly on your silhouette."
        };
    }
    if (s.includes('qc') || s.includes('quality check')) {
        return {
            title: "Rigorous Fitting Inspection",
            text: "Your garment is on the final mannequin verification stage. We inspect every seam, lapel stiffness, and measurement parameters to match our strict boutique guidelines."
        };
    }
    if (s.includes('packing') || s.includes('ready')) {
        return {
            title: "Signature Protective Packaging",
            text: "Our team is hand-pressing your curation and wrapping it in acid-free structural tissue paper. Your order will be shipped in a climate-controlled, protective outer case."
        };
    }
    return null;
};

// Compute dynamic fabric properties based on product name
const getFabricProperties = (productName: string = '') => {
    const name = productName.toLowerCase();
    if (name.includes('silk') || name.includes('saree')) {
        return {
            type: "Pure Mulberry Silk",
            weave: "Zari Satin Weave",
            weight: "75 gsm",
            care: "Dry Clean Only / Iron Low Heat"
        };
    }
    if (name.includes('cotton') || name.includes('kurta')) {
        return {
            type: "120s Double-Ply Egyptian Cotton",
            weave: "Oxford Mercerized Weave",
            weight: "120 gsm",
            care: "Mild Handwash / Steam Iron"
        };
    }
    if (name.includes('wool') || name.includes('sherwani') || name.includes('suit')) {
        return {
            type: "Super 140s Merino Wool",
            weave: "Gabardine Twill",
            weight: "260 gsm",
            care: "Professional Dry Clean Only"
        };
    }
    return {
        type: "Premium Editorial Linen-Silk Blend",
        weave: "Jacquard Weave",
        weight: "160 gsm",
        care: "Delicate Dry Clean Recommended"
    };
};

function TrackingContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [verificationNeeded, setVerificationNeeded] = useState(false);
    const [phoneOrEmailInput, setPhoneOrEmailInput] = useState('');
    const [verifying, setVerifying] = useState(false);

    // CMS tracking stages
    const [cmsStages, setCmsStages] = useState<CmsStage[]>([]);

    // Fetch CMS tracking stages
    useEffect(() => {
        async function fetchStages() {
            const { data } = await supabase
                .from('tracking_messages')
                .select('*')
                .order('sort_order', { ascending: true });
            if (data && data.length > 0) setCmsStages(data);
        }
        fetchStages();
    }, []);

    // Fetch session or run automatic verification
    useEffect(() => {
        const checkAuthAndFetch = async () => {
            setLoading(true);
            setError('');

            // 1. Check URL query params first
            const queryContact = searchParams.get('phoneOrEmail');
            if (queryContact) {
                const res = await trackOrderPublicAction(orderId, queryContact);
                if (res.success) {
                    setOrder(res.order);
                    setLoading(false);
                    return;
                }
            }

            // 2. Check active Supabase User Session
            try {
                const { data: { user: activeUser } } = await supabase.auth.getUser();
                if (activeUser) {
                    let res = await trackOrderPublicAction(orderId, activeUser.email || '');
                    if (res.success) {
                        setOrder(res.order);
                        setLoading(false);
                        return;
                    }

                    const { data: customer } = await supabase
                        .from('customers')
                        .select('phone_number')
                        .eq('id', activeUser.id)
                        .maybeSingle();

                    if (customer?.phone_number) {
                        res = await trackOrderPublicAction(orderId, customer.phone_number);
                        if (res.success) {
                            setOrder(res.order);
                            setLoading(false);
                            return;
                        }
                    }
                }
            } catch (authErr) {
                console.error("Session verification bypass:", authErr);
            }

            // 3. Fallback: Prompt for manual verification
            setVerificationNeeded(true);
            setLoading(false);
        };

        if (orderId) {
            checkAuthAndFetch();
        }
    }, [orderId, searchParams]);

    const handleManualVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);
        setError('');

        const res = await trackOrderPublicAction(orderId, phoneOrEmailInput);
        if (res.success) {
            setOrder(res.order);
            setVerificationNeeded(false);
        } else {
            setError(res.error || 'Verification failed. Details do not match this order.');
        }
        setVerifying(false);
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-40">
                <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mb-4" />
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">Accessing Curation Ledger...</p>
            </div>
        );
    }

    if (verificationNeeded) {
        return (
            <div className="max-w-md mx-auto w-full px-6 py-20">
                <div className="bg-[#121212] border border-[#222] p-8 rounded shadow-2xl relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                        <Lock className="w-4 h-4" />
                    </div>
                    <div className="text-center mt-4 mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] mb-2">Verification Required</h2>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                            For security, please enter the registered email address or phone number associated with order <span className="font-mono text-white">#{orderId.substring(0, 8).toUpperCase()}</span>.
                        </p>
                    </div>

                    <form onSubmit={handleManualVerification} className="space-y-4">
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Registered Contact Info</label>
                            <input
                                type="text"
                                required
                                value={phoneOrEmailInput}
                                onChange={(e) => setPhoneOrEmailInput(e.target.value)}
                                placeholder="Phone number or email address"
                                className="w-full bg-[#1A1A1A] border border-zinc-800 py-3 px-4 text-xs focus:outline-none focus:border-[#D4AF37] text-white rounded transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={verifying}
                            className="w-full py-3 bg-[#D4AF37] text-black font-extrabold uppercase tracking-widest hover:bg-[#B8962B] transition-colors rounded text-[9px] disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Authenticate Access'}
                        </button>

                        {error && (
                            <div className="border border-rose-950 bg-rose-950/20 text-rose-400 p-3 rounded text-[11px] flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-32 space-y-4">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Order Not Found</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    We could not locate tracking records for this code. Verify your link parameters or contact support.
                </p>
            </div>
        );
    }

    // Build milestone list — CMS takes priority, fallback if empty
    const activeMilestones = cmsStages.length > 0
        ? cmsStages.map(s => ({ key: s.stage_key, label: s.label, desc: s.description }))
        : FALLBACK_MILESTONES;

    const currentStatusIndex = getStatusIndex(order.status, activeMilestones);

    // Proactive reassurance — CMS first, then hardcoded fallback
    const proactiveDelay = cmsStages.length > 0
        ? getCmsProactiveMessage(order.status, cmsStages)
        : getFallbackProactiveMessage(order.status);

    const primaryProduct = order.order_items?.[0]?.product_name || "Bespoke Collection";
    const fabricDetails = getFabricProperties(primaryProduct);

    const tailors = [
        "Master Tailor Devendra Sharma",
        "Sartorial Director Vijay Raghavan",
        "Atelier Chief Rajesh Kapoor",
        "Couture Master Anand Mahapatra"
    ];
    const tailorCharSum = order.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const masterTailorAssigned = order.assigned_tailor_name || tailors[tailorCharSum % tailors.length];

    const orderRef = order.order_number || order.id.substring(0, 8).toUpperCase();
    const waText = encodeURIComponent(`Hi! I'm tracking my order #${orderRef}. Status is currently "${order.status}". I would like to check-in with the concierge.`);
    const waUrl = `https://wa.me/919999999999?text=${waText}`;

    return (
        <div className="space-y-10">
            {/* Order Curation Card */}
            <div className="bg-[#121212] border border-[#222] p-8 rounded shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-1 rounded">
                        Active Curation
                    </span>
                    <h2 className="text-xl font-bold font-display text-white mt-3 font-mono">
                        #{orderRef}
                    </h2>
                    <p className="text-zinc-400 text-xs mt-1">
                        Client: <span className="text-white font-medium">{order.customers?.full_name || 'VIP Client'}</span> • Logged: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="md:text-right">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 block mb-1 font-bold">Current Phase</span>
                    <span className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] font-mono border-b border-[#D4AF37]/20 pb-0.5">
                        {order.status || 'Confirmed'}
                    </span>
                </div>
            </div>

            {/* Calm Proactive Delay Block */}
            {proactiveDelay && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1A1510] border border-amber-900/60 p-5 rounded flex items-start gap-4"
                >
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">{proactiveDelay.title}</h4>
                        <p className="text-[11px] text-[#E5E5E5]/80 leading-relaxed font-light">
                            {proactiveDelay.text}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Dynamic Luxury Timeline */}
            <div className="bg-[#121212] border border-[#222] p-8 rounded shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-8 border-b border-[#222] pb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Sartorial Journey Log
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">
                    {activeMilestones.map((m, index) => {
                        const isCompleted = currentStatusIndex >= index;
                        const isCurrent = currentStatusIndex === index;

                        return (
                            <div key={m.key} className="relative flex gap-4 group">
                                {/* Dot Indicator */}
                                <div className={`absolute -left-[20px] w-3 h-3 rounded-full border transition-all duration-500 ${isCompleted ? 'bg-[#D4AF37] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/30' : 'bg-[#121212] border-zinc-700'} ${isCurrent ? 'ring-4 ring-[#D4AF37]/20 scale-125' : ''}`} />

                                <div className="space-y-1">
                                    <h4 className={`text-xs font-bold uppercase tracking-wider transition-colors ${isCompleted ? 'text-[#D4AF37]' : 'text-zinc-600'} ${isCurrent ? 'text-white' : ''}`}>
                                        {index + 1}. {m.label}
                                    </h4>
                                    <p className={`text-[11px] leading-relaxed transition-colors ${isCompleted ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                        {m.desc}
                                    </p>
                                    {isCurrent && index < activeMilestones.length - 1 && (
                                        <p className="text-[10px] text-[#D4AF37] mt-2 bg-[#D4AF37]/10 inline-block px-2 py-0.5 rounded uppercase tracking-wider font-bold border border-[#D4AF37]/20">
                                            Estimated Stage Duration: {Math.max(1, 3 - (index % 2))} Business Days
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Specifications Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Tailoring & Master Details */}
                <div className="bg-[#121212] border border-[#222] p-6 rounded shadow-xl space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b border-[#222] pb-2 flex items-center gap-2">
                        <Scissors className="w-4 h-4" /> Atelier Information
                    </h3>
                    <div className="space-y-4 text-xs">
                        <div>
                            <span className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-0.5">Master Tailor Assigned</span>
                            <span className="font-medium text-white text-xs">{masterTailorAssigned}</span>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-0.5">Sartorial Specifications / Notes</span>
                            <p className="text-zinc-300 text-[11px] leading-relaxed font-light">
                                {order.notes || "Bespoke pattern drafting. Double canvas stabilization with customized chest padding structure. Slim-cut fit parameters."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Material & Quality Standards */}
                <div className="bg-[#121212] border border-[#222] p-6 rounded shadow-xl space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b border-[#222] pb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Material &amp; Quality Assurance
                    </h3>
                    <div className="space-y-3.5 text-xs">
                        <div className="flex justify-between border-b border-zinc-900 pb-2">
                            <span className="text-zinc-500">Fabric Composition</span>
                            <span className="text-white font-mono">{fabricDetails.type}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-2">
                            <span className="text-zinc-500">Weave Style</span>
                            <span className="text-white font-mono">{fabricDetails.weave}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-2">
                            <span className="text-zinc-500">Fabric Weight</span>
                            <span className="text-[#D4AF37] font-mono">{fabricDetails.weight}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-2">
                            <span className="text-zinc-500">Measurement Tolerance</span>
                            <span className="text-[#D4AF37] font-mono">±0.15 Inch Checked</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Care Instructions</span>
                            <span className="text-zinc-400 italic text-[11px]">{fabricDetails.care}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SLA Curation Timeline */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#121212] border border-[#222] p-6 rounded shadow-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 text-[#D4AF37]">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block">Estimated Hand-Off</span>
                        <span className="text-xs font-bold text-white">
                            {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : '7-12 Business Days'}
                        </span>
                    </div>
                </div>

                <div className="bg-[#121212] border border-[#222] p-6 rounded shadow-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 text-[#D4AF37]">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block">Target Timeline</span>
                        <span className="text-xs font-bold text-white">
                            {order.target_days ? `${order.target_days} Curation Days SLA` : 'Standard Custom Tailoring'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Float Concierge Trigger Button */}
            <div className="flex justify-center pt-4">
                <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3.5 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/5 text-xs font-bold uppercase tracking-widest transition-all rounded"
                >
                    <MessageSquare className="w-4 h-4 text-[#25D366]" /> Personal Curation Concierge
                </a>
            </div>

            {/* Refund & Support Reassurance Block */}
            <div className="mt-8 pt-8 border-t border-zinc-900 flex justify-center">
                <div className="max-w-2xl bg-[#0A0A0A] border border-[#222] p-6 rounded shadow-xl text-center space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center justify-center gap-2">
                        <Scissors className="w-4 h-4 text-[#D4AF37]" /> Atelier Adjustment Protocol
                    </h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-light px-4">
                        Because this piece was meticulously hand-crafted to your unique measurements, we prioritize complimentary Atelier Adjustments to perfect the fit. Direct refunds are restricted pending master tailor evaluation.
                    </p>
                    <div className="pt-2">
                        <button onClick={() => window.open(waUrl, '_blank')} className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-bold hover:underline underline-offset-4">
                            Request Fit Adjustment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OrderTrackingPage() {
    return (
        <main className="relative bg-[#0A0A0A] text-white min-h-screen flex flex-col font-sans">
            <Navbar />

            <div className="flex-1 max-w-4xl mx-auto px-6 py-28 w-full">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-5xl font-display font-light uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
                        Curated Tracking
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest max-w-md mx-auto">
                        Deeprastore Operating System / Curation Logistics
                    </p>
                </div>

                <Suspense fallback={
                    <div className="flex justify-center py-40">
                        <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
                    </div>
                }>
                    <TrackingContent />
                </Suspense>
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
