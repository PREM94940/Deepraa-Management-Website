"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isModalOpen: boolean;
    openLoginModal: (returnTo?: string) => void;
    closeLoginModal: () => void;
    signOut: () => Promise<void>;
    syncCustomerProfile: (id: string, email: string, phone: string, name: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
    user: null,
    session: null,
    loading: true,
    isModalOpen: false,
    openLoginModal: () => {},
    closeLoginModal: () => {},
    signOut: async () => {},
    syncCustomerProfile: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser]           = useState<User | null>(null);
    const [session, setSession]     = useState<Session | null>(null);
    const [loading, setLoading]     = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const returnToRef               = useRef<string>('/account');

    // ── Sync customer profile to public.customers table ──
    const syncCustomerProfile = useCallback(async (
        id: string,
        email: string,
        phone: string,
        name: string
    ) => {
        try {
            const { data } = await supabase
                .from('customers')
                .select('id')
                .eq('id', id)
                .maybeSingle();

            if (!data) {
                await supabase.from('customers').insert({
                    id,
                    email: email || undefined,
                    phone_number: phone || undefined,
                    full_name: name || (email ? email.split('@')[0] : 'Customer'),
                    created_at: new Date().toISOString(),
                    total_orders: 0,
                    total_spent: 0,
                    complaint_count: 0,
                    refund_count: 0,
                    risk_level: 'Low',
                    loyalty_level: 'Bronze',
                });
            }
        } catch (err) {
            console.error('[AuthContext] Failed to sync customer profile:', err);
        }
    }, []);

    // ── Bootstrap session on mount + listen for changes ──
    useEffect(() => {
        let mounted = true;
        // Get existing session immediately
        supabase.auth.getSession()
            .then(({ data: { session: s } }) => {
                if (!mounted) return;
                setSession(s);
                setUser(s?.user ?? null);
                setLoading(false);
            })
            .catch((err) => {
                console.error('[AuthContext] getSession error:', err);
                if (mounted) setLoading(false);
            });        // Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, s) => {
                if (!mounted) return;
                setSession(s);
                setUser(s?.user ?? null);
                setLoading(false);

                // On new sign-in, sync customer profile
                if (event === 'SIGNED_IN' && s?.user) {
                    const u = s.user;
                    await syncCustomerProfile(
                        u.id,
                        u.email ?? '',
                        u.phone ?? '',
                        u.user_metadata?.full_name ?? ''
                    );
                    // Close modal and navigate back to returnTo
                    setIsModalOpen(false);
                }

                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setSession(null);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [syncCustomerProfile]);

    // ── Modal controls ──
    const openLoginModal = useCallback((returnTo: string = '/account') => {
        returnToRef.current = returnTo;
        // Store returnTo in body data attribute so AuthModal can read it
        if (typeof document !== 'undefined') {
            document.body.setAttribute('data-auth-return-to', returnTo);
        }
        setIsModalOpen(true);
    }, []);

    const closeLoginModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    // ── Sign out ──
    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            isModalOpen,
            openLoginModal,
            closeLoginModal,
            signOut,
            syncCustomerProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
    return useContext(AuthContext);
}

// Export returnTo ref accessor for AuthModal
export { AuthContext };
