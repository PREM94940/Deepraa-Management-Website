"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Phone, Mail, Lock, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CustomerLogin() {
    const router = useRouter();
    const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    
    // Form Inputs
    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // OAuth: Continue with Google
    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error: err } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/account`
                }
            });
            if (err) throw err;
        } catch (err: any) {
            const isUnsupported = err.message?.includes('provider') || err.message?.includes('not enabled');
            setError(isUnsupported 
                ? 'Google Login is not enabled on this environment yet. Please use the Email & Password fallback below.' 
                : (err.message || 'Google Auth initiation failed.'));
            setLoading(false);
        }
    };

    // OTP: Send Phone Code
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone) return setError('Please enter a valid phone number.');
        setLoading(true);
        setError(null);
        try {
            // E.164 formatting fallback
            let formattedPhone = phone.trim();
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = `+91${formattedPhone.replace(/\D/g, '')}`;
            }
            const { error: err } = await supabase.auth.signInWithOtp({
                phone: formattedPhone,
            });
            if (err) throw err;
            setOtpSent(true);
            setMessage('Verification OTP sent successfully!');
        } catch (err: any) {
            const isUnsupported = err.message?.includes('provider') || err.message?.includes('not enabled') || err.message?.includes('phone');
            setError(isUnsupported 
                ? 'Phone SMS OTP provider is not enabled on this environment yet. Please use the Email & Password fallback below.' 
                : (err.message || 'Error sending OTP verification code.'));
        } finally {
            setLoading(false);
        }
    };

    // OTP: Verify OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode) return setError('Please enter the OTP verification code.');
        setLoading(true);
        setError(null);
        try {
            let formattedPhone = phone.trim();
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = `+91${formattedPhone.replace(/\D/g, '')}`;
            }
            const { error: err } = await supabase.auth.verifyOtp({
                phone: formattedPhone,
                token: otpCode,
                type: 'sms'
            });
            if (err) throw err;
            
            // Check if profile exists, if not create one
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await syncCustomerProfile(user.id, user.email || '', formattedPhone, fullName || 'New Customer');
            }

            router.push('/account');
        } catch (err: any) {
            setError(err.message || 'Invalid or expired OTP code.');
        } finally {
            setLoading(false);
        }
    };

    // Email Credentials Login / Register
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return setError('Please fill in all email and password fields.');
        setLoading(true);
        setError(null);
        try {
            if (isSignUp) {
                const { data, error: err } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });
                if (err) throw err;
                if (data.user) {
                    await syncCustomerProfile(data.user.id, email, '', fullName);
                }
                setMessage('Registration successful! Please log in.');
                setIsSignUp(false);
            } else {
                const { data, error: err } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (err) throw err;
                if (data.user) {
                    await syncCustomerProfile(data.user.id, email, '', '');
                }
                router.push('/account');
            }
        } catch (err: any) {
            setError(err.message || 'Credentials authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    // Helpers to write to public.customers table
    const syncCustomerProfile = async (id: string, email: string, phone: string, name: string) => {
        try {
            const { data } = await supabase.from('customers').select('id').eq('id', id).maybeSingle();
            if (!data) {
                await supabase.from('customers').insert({
                    id: id,
                    email: email || undefined,
                    phone_number: phone || undefined,
                    full_name: name || email.split('@')[0] || 'Customer',
                    created_at: new Date().toISOString(),
                    total_orders: 0,
                    total_spent: 0,
                    complaint_count: 0,
                    refund_count: 0,
                    risk_level: 'Low',
                    loyalty_level: 'Bronze'
                });
            }
        } catch (err) {
            console.error('Failed to sync customer profile:', err);
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
            {/* Elegant Luxury Background Glows */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-zinc-500/5 blur-[120px]" />
            
            <div className="w-full max-w-[420px] bg-[#121212] border border-[#222] p-8 md:p-10 rounded-sm shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <h1 className="font-display text-2xl md:text-3xl font-light text-white tracking-[0.1em] mb-2">
                        DEEPRA<span className="text-[#D4AF37] font-normal">STORE</span>
                    </h1>
                    <p className="text-[10px] text-[#8C8C8C] uppercase tracking-[0.2em]">Customer Account Access</p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-950/30 border border-red-900/50 text-red-400 p-3 text-xs rounded-sm text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 p-3 text-xs rounded-sm text-center">
                        {message}
                    </div>
                )}

                {/* Primary login CTA (Google) */}
                {!otpSent && (
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-200 text-black font-bold uppercase text-[10px] tracking-[0.15em] py-3.5 px-4 rounded-sm transition-all mb-4"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>
                )}

                {/* Separator */}
                {!otpSent && (
                    <div className="flex items-center my-6">
                        <div className="flex-1 h-[1px] bg-zinc-800" />
                        <span className="mx-4 text-[9px] text-[#555] uppercase tracking-widest">Or login via</span>
                        <div className="flex-1 h-[1px] bg-zinc-800" />
                    </div>
                )}

                {/* Login Method Forms */}
                {!otpSent ? (
                    loginMethod === 'phone' ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div>
                                <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Phone Number</label>
                                <div className="relative">
                                    <Phone className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-500" />
                                    <input 
                                        type="tel"
                                        placeholder="Enter mobile number" 
                                        className="w-full text-xs py-3.5 pl-10 pr-4 border border-[#222] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-[#D4AF37] hover:bg-[#B8962B] text-black font-bold uppercase text-[10px] tracking-[0.15em] py-3.5 px-4 rounded-sm transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Sending...' : 'Request OTP Code'}
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setLoginMethod('email')}
                                className="w-full text-center text-[9px] text-zinc-500 hover:text-white uppercase tracking-wider transition-colors pt-2"
                            >
                                Use Email & Password
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            {isSignUp && (
                                <div>
                                    <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Full Name</label>
                                    <input 
                                        type="text"
                                        placeholder="E.g. Priya Sharma" 
                                        className="w-full text-xs py-3.5 px-4 border border-[#222] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Email Address</label>
                                <div className="relative">
                                    <Mail className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-500" />
                                    <input 
                                        type="email"
                                        placeholder="Enter email address" 
                                        className="w-full text-xs py-3.5 pl-10 pr-4 border border-[#222] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Password</label>
                                <div className="relative">
                                    <Lock className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-500" />
                                    <input 
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter password" 
                                        className="w-full text-xs py-3.5 pl-10 pr-10 border border-[#222] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-[#D4AF37] hover:bg-[#B8962B] text-black font-bold uppercase text-[10px] tracking-[0.15em] py-3.5 px-4 rounded-sm transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex flex-col gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-center text-[9px] text-[#D4AF37] hover:underline uppercase tracking-wider transition-all"
                                >
                                    {isSignUp ? 'Already have an account? Sign In' : 'New Customer? Create Account'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLoginMethod('phone')}
                                    className="text-center text-[9px] text-zinc-500 hover:text-white uppercase tracking-wider transition-colors"
                                >
                                    Use Phone OTP Login
                                </button>
                            </div>
                        </form>
                    )
                ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div>
                            <label className="block text-[8px] text-[#A3A3A3] mb-1.5 uppercase font-bold tracking-widest">Verify OTP Code</label>
                            <div className="relative">
                                <ShieldCheck className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-zinc-500" />
                                <input 
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter 6-digit code" 
                                    className="w-full text-xs py-3.5 pl-10 pr-4 border border-[#222] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all tracking-[0.5em] text-center font-bold"
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value)}
                                />
                            </div>
                            <p className="text-[9px] text-zinc-500 mt-2 text-center">We sent a verification SMS OTP code to your number.</p>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-[#D4AF37] hover:bg-[#B8962B] text-black font-bold uppercase text-[10px] tracking-[0.15em] py-3.5 px-4 rounded-sm transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setOtpSent(false)}
                            className="w-full text-center text-[9px] text-zinc-500 hover:text-white uppercase tracking-wider transition-colors pt-2"
                        >
                            Back to Login
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
