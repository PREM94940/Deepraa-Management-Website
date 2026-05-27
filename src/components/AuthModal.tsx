"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, X, User as UserIcon, Sparkles } from 'lucide-react';

// ─── AuthModal ────────────────────────────────────────────────────────────────

export default function AuthModal() {
    const pathname = usePathname();
    if (pathname?.startsWith('/admin')) return null;
    return <AuthModalContent />;
}

function AuthModalContent() {
    const { isModalOpen, closeLoginModal, syncCustomerProfile } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const returnToRef = useRef<string>('/account');

    const [isSignUp, setIsSignUp]         = useState(false);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [message, setMessage]           = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // Capture returnTo from window when modal opens
    useEffect(() => {
        if (isModalOpen) {
            // Read from data attribute set by openLoginModal
            const attr = document.body.getAttribute('data-auth-return-to');
            if (attr) returnToRef.current = attr;
            setError(null);
            setMessage(null);
            setEmail('');
            setPassword('');
            setFullName('');
            setIsSignUp(false);
        }
    }, [isModalOpen]);

    // Escape key to close
    useEffect(() => {
        if (!isModalOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLoginModal();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isModalOpen, closeLoginModal]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    // ── Email Auth ────────────────────────────────────────────────────────────
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return setError('Please fill in all fields.');
        if (isSignUp && !fullName.trim()) return setError('Please enter your name.');
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { data, error: err } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } },
                });
                if (err) throw err;
                if (data.user) {
                    await syncCustomerProfile(data.user.id, email, '', fullName);
                }
                setMessage('Account created! Signing you in...');
                // Auto sign-in after signup
                const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
                if (signInErr) {
                    setMessage('Account created! Please sign in.');
                    setIsSignUp(false);
                    setLoading(false);
                    return;
                }
            } else {
                const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
                if (err) throw err;
                if (data.user) {
                    await syncCustomerProfile(data.user.id, email, '', '');
                }
            }

            // Auth state change in AuthContext will close modal
            // Navigate to returnTo or homepage if it was '/account' to continue seamless browsing
            let returnTo = returnToRef.current || '/';
            if (returnTo === '/account') {
                returnTo = '/';
            }
            
            // Clean up and clear active DOM trigger states
            returnToRef.current = '/';
            if (typeof document !== 'undefined') {
                document.body.removeAttribute('data-auth-return-to');
            }
            
            closeLoginModal();
            router.push(returnTo);
        } catch (err: any) {
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isModalOpen || pathname?.startsWith('/admin')) return null;

    // Portal render so it sits above everything
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Sign in to Deeprastore"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                onClick={closeLoginModal}
                aria-hidden="true"
            />

            {/* Modal Card */}
            <div
                className="relative z-10 w-full max-w-[400px] mx-4"
                style={{
                    animation: 'authModalIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                }}
            >
                <div className="bg-[#111111] border border-[#242424] rounded-sm shadow-2xl shadow-black/80 overflow-hidden">

                    {/* Header */}
                    <div className="relative px-8 pt-8 pb-6 text-center border-b border-[#1e1e1e]">
                        <button
                            onClick={closeLoginModal}
                            className="absolute top-4 right-4 text-zinc-600 hover:text-white transition-colors p-1 rounded-sm hover:bg-zinc-800"
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center justify-center gap-1.5 mb-2">
                            <Sparkles size={12} className="text-[#D4AF37]" />
                            <span className="text-[9px] text-[#D4AF37] uppercase tracking-[0.3em] font-bold">
                                Deeprastore Boutique
                            </span>
                            <Sparkles size={12} className="text-[#D4AF37]" />
                        </div>
                        <h2 className="text-white text-xl font-light tracking-[0.08em] font-display">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-[10px] text-zinc-500 mt-1 tracking-wider uppercase">
                            {isSignUp
                                ? 'Join our exclusive boutique circle'
                                : 'Sign in to continue your journey'}
                        </p>
                    </div>

                    {/* Body */}
                    <div className="px-8 py-7">
                        {/* Error / Message */}
                        {error && (
                            <div className="mb-4 bg-red-950/40 border border-red-900/50 text-red-400 p-3 text-[11px] rounded-sm text-center leading-relaxed">
                                {error}
                            </div>
                        )}
                        {message && !error && (
                            <div className="mb-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 p-3 text-[11px] rounded-sm text-center leading-relaxed">
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            {/* Full name (sign-up only) */}
                            {isSignUp && (
                                <div>
                                    <label className="block text-[9px] text-zinc-400 mb-1.5 uppercase tracking-widest font-bold">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-600" />
                                        <input
                                            type="text"
                                            autoComplete="name"
                                            placeholder="E.g. Priya Sharma"
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            className="w-full text-xs py-3.5 pl-10 pr-4 border border-[#2a2a2a] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all placeholder:text-zinc-700"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-[9px] text-zinc-400 mb-1.5 uppercase tracking-widest font-bold">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-600" />
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full text-xs py-3.5 pl-10 pr-4 border border-[#2a2a2a] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all placeholder:text-zinc-700"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[9px] text-zinc-400 mb-1.5 uppercase tracking-widest font-bold">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-600" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                        placeholder={isSignUp ? 'Create a secure password' : 'Enter your password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full text-xs py-3.5 pl-10 pr-10 border border-[#2a2a2a] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all placeholder:text-zinc-700"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3.5 top-3.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#D4AF37] hover:bg-[#b8952d] text-black font-bold uppercase text-[10px] tracking-[0.18em] py-3.5 px-4 rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-[#D4AF37]/10"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        {isSignUp ? 'Creating Account...' : 'Signing In...'}
                                    </span>
                                ) : (
                                    <>
                                        {isSignUp ? 'Create Account' : 'Sign In'}
                                        <ArrowRight size={13} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Toggle sign-up/sign-in */}
                        <div className="mt-5 text-center">
                            <button
                                type="button"
                                onClick={() => { setIsSignUp(v => !v); setError(null); setMessage(null); }}
                                className="text-[10px] text-zinc-500 hover:text-[#D4AF37] transition-colors uppercase tracking-wider"
                            >
                                {isSignUp
                                    ? 'Already have an account? Sign In'
                                    : 'New to Deeprastore? Create Account'}
                            </button>
                        </div>

                        {/* Trust line */}
                        <p className="mt-5 text-center text-[9px] text-zinc-700 leading-relaxed">
                            Your account remembers your measurements, orders,<br />
                            and tailoring history — seamlessly.
                        </p>
                    </div>
                </div>
            </div>

            {/* Keyframe animation */}
            <style>{`
                @keyframes authModalIn {
                    from { opacity: 0; transform: scale(0.94) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
}
