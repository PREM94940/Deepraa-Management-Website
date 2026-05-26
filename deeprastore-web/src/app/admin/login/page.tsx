"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return setError('Please enter both email and password.');
        setLoading(true);
        setError(null);

        try {
            // Sign in
            const { data, error: err } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (err) throw err;

            if (data.user) {
                // Check if user has an admin role in 'staff_roles' table
                const { data: roleData, error: roleErr } = await supabase
                    .from('staff_roles')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (roleErr || !roleData || !['Staff', 'Manager'].includes(roleData.role)) {
                    // Sign out immediately if not authorized
                    await supabase.auth.signOut();
                    throw new Error("Access Denied: You do not have Staff or Manager privileges.");
                }

                // Redirect to admin dashboard
                router.push('/admin');
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed. Please verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#060606] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
            {/* Admin Luxury Deep Indigo/Gold Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#1C1509] blur-[150px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#0E1510] blur-[150px]" />

            <div className="w-full max-w-[400px] bg-[#0E0E0E] border border-zinc-800 p-8 rounded-sm shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <h1 className="font-display text-xl md:text-2xl font-light text-white tracking-[0.15em] mb-2 flex items-center justify-center gap-2">
                        <Shield className="w-5 h-5 text-[#D4AF37]" />
                        DEEPRA<span className="text-[#D4AF37] font-normal">ADMIN</span>
                    </h1>
                    <p className="text-[9px] text-[#A3A3A3] uppercase tracking-[0.25em]">Portal Access Control</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-950/40 border border-red-900/60 text-red-400 p-3.5 text-xs rounded-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div>
                        <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Admin Email</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                            <input 
                                type="email"
                                placeholder="name@deeprastore.com" 
                                className="w-full text-xs py-3.5 pl-10 pr-4 border border-zinc-800 bg-[#0A0A0A] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                            <input 
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••" 
                                className="w-full text-xs py-3.5 pl-10 pr-10 border border-zinc-800 bg-[#0A0A0A] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-[#D4AF37] hover:bg-[#B8962B] text-black font-bold uppercase text-[10px] tracking-[0.15em] py-3.5 px-4 rounded-sm transition-all flex items-center justify-center gap-2 mt-2 border-none"
                    >
                        {loading ? 'Authenticating...' : 'Sign In To Panel'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </main>
    );
}
