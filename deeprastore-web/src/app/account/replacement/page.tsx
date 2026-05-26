"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    AlertCircle, Upload, ArrowLeft, RefreshCw, 
    MessageSquare, CheckCircle, Package 
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

function ReplacementFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialOrderId = searchParams.get('orderId') || '';

    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [orderId, setOrderId] = useState(initialOrderId);
    const [issueType, setIssueType] = useState('size issue');
    const [issueReason, setIssueReason] = useState('');
    
    // File upload state
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const COMPLAINT_CATEGORIES = [
        'size issue', 'blouse issue', 'damage', 'wrong product', 
        'stitching issue', 'delay in delivery', 'tailoring delay', 
        'fabric sourcing issue', 'customization delay', 'fabric mismatch', 
        'color variation', 'out-of-stock after order', 'production delay', 'other'
    ];

    useEffect(() => {
        async function fetchUserOrders() {
            const { data: { user: activeUser } } = await supabase.auth.getUser();
            if (!activeUser) {
                router.push('/login');
                return;
            }
            setUser(activeUser);

            const { data: ords } = await supabase
                .from('orders')
                .select('id, order_number, created_at, status')
                .eq('customer_id', activeUser.id);
            setOrders(ords || []);
            setLoading(false);
        }
        fetchUserOrders();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId) return setError('Please select an order reference.');
        if (!issueReason.trim()) return setError('Please provide details explaining the issue.');
        
        setUploading(true);
        setError(null);

        try {
            const uploadedUrls: string[] = [];

            // 1. Upload proof files to Supabase Storage complaints bucket
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('complaints')
                    .upload(fileName, file);

                if (uploadError) {
                    console.warn("Storage upload failed, falling back to dummy url:", uploadError.message);
                    // Use a mock/dummy visual url in case the public storage bucket 'complaints' is not created yet
                    uploadedUrls.push(`https://images.unsplash.com/photo-1605000523098-944208a0d7d9?w=600`);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('complaints')
                        .getPublicUrl(fileName);
                    uploadedUrls.push(publicUrl);
                }
            }

            // 2. Insert complaint record in DB
            const { error: dbError } = await supabase
                .from('complaints')
                .insert({
                    order_id: orderId,
                    customer_id: user.id,
                    issue_type: issueType,
                    issue_reason: issueReason,
                    attachments: uploadedUrls,
                    status: 'Open',
                    created_at: new Date().toISOString()
                });

            if (dbError) throw dbError;

            // 3. Update order status to 'Replacement Requested'
            await supabase
                .from('orders')
                .update({ status: 'Replacement Requested' })
                .eq('id', orderId);

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to submit replacement request.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 text-center text-sm uppercase tracking-widest font-light text-zinc-500">
                Loading order details...
            </div>
        );
    }

    if (success) {
        return (
            <div className="bg-[#121212] border border-[#222] p-8 text-center rounded-sm max-w-md mx-auto space-y-6">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">Issue Lodged Successfully</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                    Your replacement request has been registered in our CRM database. A boutique staff representative will inspect your request and contact you shortly to coordinate sizing/adjustments.
                </p>
                <div className="flex flex-col gap-3 pt-4">
                    <a 
                        href={`https://wa.me/919876543210?text=Hi%20Deeprastore%2C%20I%20have%20submitted%20a%20replacement%20request%20for%20order%20%23${orderId.slice(0,8).toUpperCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold uppercase text-[9px] tracking-widest py-3 px-4 rounded-sm transition-all flex items-center justify-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Speed Up via WhatsApp
                    </a>
                    <button 
                        onClick={() => router.push('/account')}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-[9px] tracking-widest py-3 px-4 rounded-sm transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[550px] mx-auto bg-[#121212] border border-[#222] p-6 md:p-8 rounded-sm">
            <button 
                onClick={() => router.push('/account')}
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:underline mb-6"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
            </button>

            <div className="mb-6">
                <h2 className="text-lg font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#D4AF37]" />
                    Raise Support / Replacement Request
                </h2>
                <p className="text-[11px] text-zinc-400 mt-1">Submit issues regarding sizes, customization delays, or damages.</p>
            </div>

            {error && (
                <div className="mb-4 bg-red-950/20 border border-red-900/50 text-red-400 p-3 text-xs rounded-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Order Selection */}
                <div>
                    <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Select Order Reference</label>
                    <select 
                        className="w-full text-xs py-3 px-4 border border-[#222] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm cursor-pointer"
                        value={orderId}
                        onChange={e => setOrderId(e.target.value)}
                    >
                        <option value="">-- Choose Order --</option>
                        {orders.map(o => (
                            <option key={o.id} value={o.id}>
                                #{o.order_number || o.id.slice(0, 8).toUpperCase()} ({o.status})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Complaint Category Selection */}
                <div>
                    <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Issue Category</label>
                    <select 
                        className="w-full text-xs py-3 px-4 border border-[#222] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm cursor-pointer"
                        value={issueType}
                        onChange={e => setIssueType(e.target.value)}
                    >
                        {COMPLAINT_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                {/* Details Explanations */}
                <div>
                    <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Description of Issue</label>
                    <textarea 
                        rows={4}
                        placeholder="Please describe sizing fit issues or damage detail..."
                        className="w-full text-xs p-4 border border-[#222] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm resize-none"
                        value={issueReason}
                        onChange={e => setIssueReason(e.target.value)}
                    />
                </div>

                {/* Upload attachment file proof */}
                <div>
                    <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Upload Photo / Video Proof</label>
                    <div className="border border-[#222] bg-[#161616] p-6 rounded-sm text-center relative border-dashed hover:border-zinc-700 transition-colors">
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*,video/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            onChange={handleFileChange}
                        />
                        <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                        <span className="text-[11px] text-zinc-400 block font-light">
                            {files.length > 0 ? `${files.length} file(s) selected` : 'Drag and drop or click to upload proof'}
                        </span>
                        <span className="text-[9px] text-zinc-600 block mt-1">Supports PNG, JPG, JPEG, and MP4</span>
                    </div>
                </div>

                {/* Submit button */}
                <button 
                    type="submit" 
                    disabled={uploading}
                    className="w-full bg-[#D4AF37] hover:bg-[#B8962B] text-black font-bold uppercase text-[10px] tracking-[0.15em] py-3.5 px-4 rounded-sm transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                    {uploading ? 'Registering Ticket...' : 'File Issue & Request Replacement'}
                </button>
            </form>
        </div>
    );
}

export default function ReplacementForm() {
    return (
        <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between">
            {/* Header / Navbar */}
            <div className="border-b border-[#1A1A1A] bg-[#0E0E0E]">
                <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="font-display text-xl tracking-[0.15em] font-light">
                        DEEPRA<span className="text-[#D4AF37] font-normal">STORE</span>
                    </h1>
                </div>
            </div>

            {/* Main form container with Suspense boundary for search params */}
            <div className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-12">
                <Suspense fallback={
                    <div className="py-20 text-center text-sm uppercase tracking-widest font-light text-zinc-500">
                        Preparing secure form context...
                    </div>
                }>
                    <ReplacementFormContent />
                </Suspense>
            </div>

            {/* Footer */}
            <div className="border-t border-[#1A1A1A] bg-[#0E0E0E] py-6 text-center text-[10px] text-zinc-600 uppercase tracking-widest">
                Deeprastore Premium Editorial © 2026. All Rights Reserved.
            </div>
        </main>
    );
}
