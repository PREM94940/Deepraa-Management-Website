"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import Link from 'next/link';
import { Sparkles, ShoppingBag, Scissors, User, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [customerProfile, setCustomerProfile] = useState<any>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login?returnTo=/account');
        } else if (user) {
            fetchCustomerProfile();
        }
    }, [user, loading, router]);

    const fetchCustomerProfile = async () => {
        try {
            const { data } = await supabase
                .from('customers')
                .select('*')
                .eq('id', user?.id)
                .single();
            if (data) {
                setCustomerProfile(data);
            }
        } catch (error) {
            console.error("Error fetching customer profile:", error);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
                <div className="text-center text-[#D4AF37] animate-pulse text-[10px] uppercase tracking-[0.3em] font-bold">
                    Authenticating VIP Access...
                </div>
            </div>
        );
    }

    const navItems = [
        { name: 'Dashboard', path: '/account', icon: <User size={16} /> },
        { name: 'Order History', path: '/account/orders', icon: <ShoppingBag size={16} /> },
        { name: 'Bespoke Measurements', path: '/account/measurements', icon: <Scissors size={16} /> },
    ];

    return (
        <main className="relative bg-[#0F0F0F] text-white min-h-screen flex flex-col font-sans">
            <Navbar />
            
            <div className="flex-1 max-w-6xl mx-auto px-6 py-28 w-full flex flex-col md:flex-row gap-8">
                {/* Account Sidebar */}
                <aside className="w-full md:w-64 shrink-0">
                    <div className="bg-[#161616] border border-[#222] rounded p-6 shadow-xl sticky top-28">
                        <div className="flex items-center gap-2 mb-6 pb-6 border-b border-[#222]">
                            <div className="w-10 h-10 rounded bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 text-[#D4AF37] shrink-0 font-display text-xl">
                                {customerProfile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <h2 className="text-sm font-bold text-white truncate">{customerProfile?.full_name || 'VIP Client'}</h2>
                                <p className="text-[10px] text-[#A3A3A3] truncate">{user.email}</p>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-2">
                            {navItems.map(item => {
                                const isActive = pathname === item.path;
                                return (
                                    <Link 
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded text-[10px] font-extrabold uppercase tracking-widest transition-all ${isActive ? 'bg-[#D4AF37] text-black' : 'text-[#A3A3A3] hover:bg-[#222] hover:text-white'}`}
                                    >
                                        {item.icon} {item.name}
                                    </Link>
                                );
                            })}
                            
                            <button 
                                onClick={() => { signOut(); router.push('/'); }}
                                className="flex items-center gap-3 px-4 py-3 mt-4 rounded text-[10px] font-extrabold uppercase tracking-widest text-rose-500 hover:bg-rose-950/30 transition-all text-left"
                            >
                                <LogOut size={16} /> Secure Sign Out
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    {children}
                </div>
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
