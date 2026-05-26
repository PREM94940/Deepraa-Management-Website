"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { 
    MessageSquare, 
    Scissors, 
    Sparkles, 
    Truck, 
    RefreshCw, 
    AlertTriangle, 
    HelpCircle, 
    ChevronRight, 
    Search, 
    Calendar, 
    User, 
    Check, 
    Info,
    Database
} from 'lucide-react';

interface Order {
    id: string;
    order_number?: string;
    created_at: string;
    total_amount: number;
    status: string;
}

interface SupportCategory {
    id: string;
    category_id: string;
    title: string;
    description: string;
    intent_message: string;
    badge: string;
    badge_color?: string;
    sort_order?: number;
}

// Icon map for CMS-driven categories — resolved by category_id keyword
const iconMap: Record<string, React.ElementType> = {
    order_status: Truck,
    tailoring_help: Scissors,
    fitting_adjustment: Sparkles,
    delivery_clarification: Calendar,
    replacement_assistance: RefreshCw,
    fabric_questions: HelpCircle,
    wedding_support: AlertTriangle,
};

const colorMap: Record<string, string> = {
    order_status: 'from-amber-500/10 to-amber-600/5',
    tailoring_help: 'from-gold/10 to-yellow-600/5',
    fitting_adjustment: 'from-emerald-500/10 to-teal-600/5',
    delivery_clarification: 'from-blue-500/10 to-indigo-600/5',
    replacement_assistance: 'from-red-500/10 to-rose-600/5',
    fabric_questions: 'from-purple-500/10 to-pink-600/5',
    wedding_support: 'from-amber-600/20 to-red-600/10',
};

const borderMap: Record<string, string> = {
    wedding_support: 'border-[#D4AF37]/40',
};

// Hardcoded fallback categories
const FALLBACK_CATEGORIES: SupportCategory[] = [
    {
        id: 'order_status',
        category_id: 'order_status',
        title: 'Order Status',
        description: 'Track your handcrafted creation, request timing updates, or check fabrication phases.',
        intent_message: 'Hi Deeprastore, I would like to check the status of my order.',
        badge: 'Real-time Updates',
    },
    {
        id: 'tailoring_help',
        category_id: 'tailoring_help',
        title: 'Tailoring Help',
        description: 'Discuss necklines, custom measurements, modifications, or specialized style instructions.',
        intent_message: 'Hi Deeprastore, I need custom tailoring/stitching assistance for my order.',
        badge: 'Master Tailor Consultation',
    },
    {
        id: 'fitting_adjustment',
        category_id: 'fitting_adjustment',
        title: 'Fitting Adjustment',
        description: 'Request sizing alterations or corrections if your garment does not drape perfectly.',
        intent_message: 'Hi Deeprastore, I need help with fitting adjustments for my recent order.',
        badge: 'Perfect Fit Policy',
    },
    {
        id: 'delivery_clarification',
        category_id: 'delivery_clarification',
        title: 'Delivery Clarification',
        description: 'Update delivery address, clarify logistics queries, or request delivery window timing details.',
        intent_message: 'Hi Deeprastore, I need clarification on the delivery date/tracking for my order.',
        badge: 'Global Logistics',
    },
    {
        id: 'replacement_assistance',
        category_id: 'replacement_assistance',
        title: 'Replacement Assistance',
        description: 'Initiate replacement tickets for uncustomized boutique pieces within our 2-month window.',
        intent_message: 'Hi Deeprastore, I need assistance requesting a replacement for my order.',
        badge: 'Smooth Exchanges',
    },
    {
        id: 'fabric_questions',
        category_id: 'fabric_questions',
        title: 'Fabric Questions',
        description: 'Enquire about pure silks, georgette counts, dye quality, or request sample swatches.',
        intent_message: 'Hi Deeprastore, I have some questions regarding the fabrics/materials used in my order.',
        badge: 'Pure Materials',
    },
    {
        id: 'wedding_support',
        category_id: 'wedding_support',
        title: 'Wedding / Urgent Support',
        description: 'Expedite bridal orders or urgent event wear. Bypasses standard queues for dedicated support.',
        intent_message: 'Hi Deeprastore, I have an urgent wedding/event priority support request.',
        badge: 'Boutique Priority Queue',
    },
];

export default function SupportPage() {
    const [user, setUser] = useState<any>(null);
    const [customer, setCustomer] = useState<any>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // CMS state
    const [supportCategories, setSupportCategories] = useState<SupportCategory[]>([]);
    const [cmsLoading, setCmsLoading] = useState(true);

    // User input or selected order ID
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');
    const [manualOrderId, setManualOrderId] = useState<string>('');
    const [guestName, setGuestName] = useState<string>('');

    const supportNumber = "919876543210";

    // Fetch CMS categories from Supabase
    useEffect(() => {
        async function fetchCategories() {
            const { data, error } = await supabase
                .from('support_templates')
                .select('*')
                .order('sort_order', { ascending: true });
            if (!error && data && data.length > 0) {
                setSupportCategories(data);
            } else {
                // Fallback to hardcoded
                setSupportCategories(FALLBACK_CATEGORIES);
            }
            setCmsLoading(false);
        }
        fetchCategories();
    }, []);

    // Fetch user data
    useEffect(() => {
        async function fetchUserData() {
            try {
                const { data: { user: activeUser } } = await supabase.auth.getUser();
                if (activeUser) {
                    setUser(activeUser);

                    const { data: custData } = await supabase
                        .from('customers')
                        .select('*')
                        .eq('id', activeUser.id)
                        .maybeSingle();
                    if (custData) {
                        setCustomer(custData);
                    }

                    const { data: ords } = await supabase
                        .from('orders')
                        .select('id, order_number, created_at, total_amount, status')
                        .eq('customer_id', activeUser.id)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (ords) {
                        setOrders(ords);
                        if (ords.length > 0) {
                            setSelectedOrderId(ords[0].order_number || ords[0].id.slice(0, 8).toUpperCase());
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading support context:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchUserData();
    }, []);

    // Helper to generate WhatsApp link
    const generateWhatsAppUrl = (baseMessage: string) => {
        let finalMessage = baseMessage;

        const activeOrderId = selectedOrderId || manualOrderId;
        if (activeOrderId) {
            finalMessage += `\nOrder ID: #${activeOrderId}`;
        }

        const activeName = customer?.full_name || guestName;
        if (activeName) {
            finalMessage += `\nCustomer Name: ${activeName}`;
        }

        return `https://wa.me/${supportNumber}?text=${encodeURIComponent(finalMessage)}`;
    };

    // Determine if categories are live from CMS (not just fallback)
    const isCmsLive = !cmsLoading && supportCategories.length > 0 &&
        supportCategories !== FALLBACK_CATEGORIES;

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between selection:bg-[#D4AF37] selection:text-black font-sans">
            <Navbar />

            {/* Hero / Introduction */}
            <div className="relative overflow-hidden border-b border-[#1A1A1A] py-16 md:py-24 bg-gradient-to-b from-[#111111] to-[#0A0A0A]">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <span className="text-[10px] text-[#D4AF37] font-semibold tracking-[0.3em] uppercase block mb-3">CONCIERGE &amp; CARE</span>
                            <h1 className="font-display text-3xl md:text-5xl tracking-wide font-light mb-4">
                                WhatsApp-First <span className="text-[#D4AF37] font-normal italic">Support Center</span>
                            </h1>
                            <p className="text-zinc-400 text-sm md:text-base max-w-2xl font-light leading-relaxed">
                                At Deeprastore, we discard rigid corporate ticket systems in favor of direct, personalized communication.
                                Select a category below to initiate a premium, dedicated WhatsApp inquiry with our design team.
                            </p>
                        </div>

                        {/* CMS Live Badge */}
                        {isCmsLive && (
                            <div className="shrink-0 self-start md:self-center">
                                <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1.5 rounded-sm">
                                    <Database className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400">CMS Live</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Context Panel (Order & Customer Info) */}
            <div className="max-w-[1200px] mx-auto w-full px-6 py-8">
                <div className="bg-[#121212] border border-[#222] p-6 rounded-sm mb-12 shadow-xl">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        AIDA Guided Inquiry Helper
                    </h2>
                    <p className="text-xs text-zinc-400 mb-6 font-light">
                        Select or enter your order details below to automatically embed them in your WhatsApp message, helping our specialists trace your curation instantly.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Info */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">
                                Customer Name
                            </label>
                            {user ? (
                                <div className="flex items-center gap-2 px-4 py-3 bg-[#181818] border border-zinc-800 rounded-sm text-sm text-zinc-300 font-medium">
                                    <User className="w-4 h-4 text-[#D4AF37]" />
                                    <span>{customer?.full_name || user?.email}</span>
                                    <span className="text-[8px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-sm font-mono uppercase font-bold tracking-wider ml-auto">Logged In</span>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Enter your name (Optional)"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className="w-full bg-[#181818] border border-zinc-800 px-4 py-3 text-sm rounded-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all font-light"
                                />
                            )}
                        </div>

                        {/* Order Details */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block">
                                Order Association
                            </label>
                            {user && orders.length > 0 ? (
                                <div className="space-y-2">
                                    <select
                                        value={selectedOrderId}
                                        onChange={(e) => setSelectedOrderId(e.target.value)}
                                        className="w-full bg-[#181818] border border-zinc-800 px-4 py-3 text-sm rounded-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all font-mono"
                                    >
                                        {orders.map(o => (
                                            <option key={o.id} value={o.order_number || o.id.slice(0, 8).toUpperCase()}>
                                                Order #{o.order_number || o.id.slice(0, 8).toUpperCase()} (₹{o.total_amount.toLocaleString('en-IN')}) - {o.status}
                                            </option>
                                        ))}
                                        <option value="">-- Specify Manually --</option>
                                    </select>
                                    {!selectedOrderId && (
                                        <input
                                            type="text"
                                            placeholder="Enter Order Number manually"
                                            value={manualOrderId}
                                            onChange={(e) => setManualOrderId(e.target.value)}
                                            className="w-full bg-[#181818] border border-zinc-800 px-4 py-3 text-sm rounded-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all font-mono"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="e.g., ORD-73921 (Optional)"
                                        value={manualOrderId}
                                        onChange={(e) => setManualOrderId(e.target.value)}
                                        className="w-full bg-[#181818] border border-zinc-800 px-4 py-3 text-sm rounded-sm text-white focus:outline-none focus:border-[#D4AF37] transition-all font-mono"
                                    />
                                    <Search className="w-4 h-4 text-zinc-600 absolute right-3.5 top-3.5" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories Grid */}
                {cmsLoading ? (
                    /* Skeleton Loader */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-[#121212] border border-[#1E1E1E] rounded-sm p-6 flex flex-col justify-between animate-pulse"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-sm bg-zinc-900 border border-zinc-800" />
                                        <div className="h-4 w-28 bg-zinc-800 rounded-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-3/4 bg-zinc-800 rounded-sm" />
                                        <div className="h-3 w-full bg-zinc-900 rounded-sm" />
                                        <div className="h-3 w-5/6 bg-zinc-900 rounded-sm" />
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <div className="h-3 w-32 bg-zinc-800 rounded-sm" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {supportCategories.map((cat) => {
                            const catKey = cat.category_id || cat.id;
                            const Icon = iconMap[catKey] || HelpCircle;
                            const gradientColor = colorMap[catKey] || 'from-zinc-500/10 to-zinc-600/5';
                            const borderClass = borderMap[catKey] || 'border-[#222]';
                            const whatsappUrl = generateWhatsAppUrl(cat.intent_message);

                            return (
                                <a
                                    key={cat.id}
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group relative bg-[#121212] border ${borderClass} hover:border-[#D4AF37]/60 rounded-sm p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-[#D4AF37]/5 overflow-hidden`}
                                >
                                    {/* Soft glow overlay on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${gradientColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>

                                    <div className="relative z-10 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform duration-300">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-[9px] uppercase tracking-wider font-bold font-mono text-[#D4AF37]/80 bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-0.5 rounded-sm">
                                                {cat.badge}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold tracking-wide text-white group-hover:text-[#D4AF37] transition-colors mb-2">
                                                {cat.title}
                                            </h3>
                                            <p className="text-xs text-zinc-400 font-light leading-relaxed">
                                                {cat.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 pt-6 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] group-hover:translate-x-1 transition-transform">
                                        <span>Initiate Direct Chat</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* Quick Info & Trust Assurances */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 border-t border-[#1C1C1C]">
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Direct Design Access</h4>
                        <p className="text-xs text-zinc-500 font-light leading-relaxed">
                            No middle-men. You communicate directly with boutique assistants, fabric sourcing coordinators, and alteration tailors.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Priority Custom Alterations</h4>
                        <p className="text-xs text-zinc-500 font-light leading-relaxed">
                            Our customized designs represent custom art. Alterations are fast-tracked, coordinated via photo references on WhatsApp.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Event Wear Dispatching</h4>
                        <p className="text-xs text-zinc-500 font-light leading-relaxed">
                            For wedding-day priority support, our managers coordinate tracking closely up to final delivery and fitting adjustments.
                        </p>
                    </div>
                </div>
            </div>

            {/* Sticky Mobile/Desktop WhatsApp Floating Banner */}
            <div className="sticky bottom-6 right-6 z-50 self-end mr-6 mb-6">
                <a
                    href={`https://wa.me/${supportNumber}?text=${encodeURIComponent('Hi Deeprastore, I need general assistance.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-105"
                >
                    <MessageSquare className="w-4 h-4" />
                    <span>Quick Chat</span>
                </a>
            </div>

            <Footer />
        </div>
    );
}
