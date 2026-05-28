"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getCurrentUserRoleAction } from '@/lib/actions/auth';
import { supabase } from '@/lib/supabase';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const OperationalShortcut = () => {
    const [isStaff, setIsStaff] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const checkStaffRole = useCallback(async () => {
        try {
            const { success, role } = await getCurrentUserRoleAction();
            if (success && (role === 'Staff' || role === 'Manager')) {
                setIsStaff(true);
            } else {
                setIsStaff(false);
            }
        } catch (err) {
            setIsStaff(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsStaff(false);
        setIsVisible(false);
        await supabase.auth.signOut();
        window.location.reload();
    }, []);

    const resetIdleTimer = useCallback(() => {
        if (!isStaff) return;
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }
        idleTimerRef.current = setTimeout(() => {
            logout();
        }, IDLE_TIMEOUT_MS);
    }, [isStaff, logout]);

    useEffect(() => {
        checkStaffRole();
        
        // Listen for auth state changes to dynamically show/hide the button
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                checkStaffRole();
            } else if (event === 'SIGNED_OUT') {
                setIsStaff(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [checkStaffRole]);

    useEffect(() => {
        if (isStaff) {
            resetIdleTimer();
            const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
            const handleActivity = () => resetIdleTimer();
            
            events.forEach(event => document.addEventListener(event, handleActivity));
            
            return () => {
                events.forEach(event => document.removeEventListener(event, handleActivity));
                if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            };
        }
    }, [isStaff, resetIdleTimer]);

    // Delay visibility to prevent SSR hydration mismatch & flickering
    useEffect(() => {
        setIsVisible(true);
    }, []);

    if (!isVisible || !isStaff) return null;

    // Do not show the shortcut if we are already in the admin panel
    if (pathname?.startsWith('/admin')) return null;

    return (
        <button
            onClick={() => router.push('/admin')}
            className="fixed bottom-[90px] right-6 z-[9999] bg-[#D4AF37] hover:bg-[#B8962B] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-[#FFE066]/30 group transform hover:scale-105"
            aria-label="Staff Console Shortcut"
        >
            <ShieldCheck className="w-5 h-5 text-black" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest hidden sm:block group-hover:block transition-all max-w-0 sm:max-w-xs group-hover:max-w-xs overflow-hidden whitespace-nowrap">
                Staff Console
            </span>
        </button>
    );
};
