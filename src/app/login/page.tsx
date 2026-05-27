"use client";
import React, { useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';

function LoginContent() {
    const { user, loading, openLoginModal } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/account';

    useEffect(() => {
        if (loading) return;
        if (user) {
            router.replace(returnTo);
        } else {
            openLoginModal(returnTo);
        }
    }, [user, loading, openLoginModal, router, returnTo]);

    return (
        <div className="text-center z-10 px-6">
            <div className="flex items-center justify-center gap-1.5 mb-3">
                <Sparkles size={14} className="text-[#D4AF37] animate-pulse" />
                <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.3em] font-bold">
                    Deeprastore Boutique
                </span>
                <Sparkles size={14} className="text-[#D4AF37] animate-pulse" />
            </div>
            <h1 className="text-white text-3xl font-light tracking-[0.1em] font-display mb-4">
                Authenticating
            </h1>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto uppercase tracking-wider leading-relaxed">
                Opening the secure boutique login portal. Please complete sign-in within the modal.
            </p>

            <button
                onClick={() => openLoginModal(returnTo)}
                className="mt-8 bg-transparent hover:bg-white/5 border border-zinc-800 text-zinc-400 hover:text-white font-bold uppercase text-[9px] tracking-[0.2em] py-3.5 px-6 rounded-sm transition-all inline-flex items-center gap-2"
            >
                Re-open Login Modal
                <ArrowRight size={12} className="text-[#D4AF37]" />
            </button>
        </div>
    );
}

export default function CustomerLogin() {
    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
            {/* Ambient luxury glow background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />

            <Suspense fallback={
                <div className="text-center z-10 px-6">
                    <div className="animate-pulse text-[10px] text-[#D4AF37] uppercase tracking-[0.3em] font-bold">
                        Loading Luxury Portal...
                    </div>
                </div>
            }>
                <LoginContent />
            </Suspense>
        </main>
    );
}
