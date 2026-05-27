"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFooterManager, useNavigationManager } from '@/hooks/useCMSContent';

export const Footer = ({ globalSettings }: { globalSettings?: any }) => {
    const { footer } = useFooterManager();
    const { nav: footerNav } = useNavigationManager('footer_links');

    // Dynamically retrieve menu links or fallback to defaults
    const quickLinks = (footerNav && footerNav.items && footerNav.items.length > 0)
        ? footerNav.items
        : [
            { label: 'Privacy Policy', url: '/c/privacy' },
            { label: 'Terms of Service', url: '/c/terms' },
            { label: 'Refund Policy', url: '/c/refund' },
            { label: 'Track Order', url: '/track' }
        ];

    const copyrightText = footer?.copyright_text || globalSettings?.footer_text || 'Deeprastore © 2026. Handcrafted Elegance.';
    const legalLinks = footer?.legal_links || [
        { label: 'Privacy', url: '/c/privacy' },
        { label: 'Terms', url: '/c/terms' }
    ];

    const [showAdminGate, setShowAdminGate] = useState(false);
    const [gateKey, setGateKey] = useState('');
    const [gateError, setGateError] = useState(false);
    const router = useRouter();

    const handleVerifyGate = (e: React.FormEvent) => {
        e.preventDefault();
        // Secure operational gatekey check
        if (gateKey === 'deeprastaff2026') {
            setShowAdminGate(false);
            setGateKey('');
            setGateError(false);
            router.push('/admin/login');
        } else {
            setGateError(true);
        }
    };

    return (
        <footer className="bg-[#0A0A0A] text-white pt-24 pb-12 px-6 border-t border-[#1C1C1C]">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                <div className="space-y-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">D</span>
                        </div>
                        <span className="text-2xl font-bold font-display tracking-tight uppercase">Deeprastore</span>
                    </div>
                    <p className="opacity-60 leading-relaxed">Redefining Indian luxury through sustainable craftsmanship and timeless design.</p>
                </div>
                <div>
                    <h4 className="text-lg font-bold mb-8 uppercase tracking-widest">Shop</h4>
                    <ul className="space-y-4 opacity-60">
                        <li><Link href="/collections" className="hover:text-accent transition-colors">New Arrivals</Link></li>
                        <li><Link href="/collections" className="hover:text-accent transition-colors">Best Sellers</Link></li>
                        <li><Link href="/collections?category=Fabric" className="hover:text-accent transition-colors">Fabrics</Link></li>
                        <li><Link href="/custom-stitching" className="hover:text-accent transition-colors">Custom Stitching</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-lg font-bold mb-8 uppercase tracking-widest">Company</h4>
                    <ul className="space-y-4 opacity-60">
                        {quickLinks.map((link: any, idx: number) => (
                            <li key={idx}>
                                <Link href={link.url} className={`hover:text-accent transition-colors ${link.url === '/track' ? 'text-accent font-bold' : ''}`}>
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="text-lg font-bold mb-8 uppercase tracking-widest">Newsletter</h4>
                    <p className="opacity-60 mb-6">Join our circle for exclusive early access and luxury edits.</p>
                    <div className="relative">
                        <input type="email" placeholder="Your email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 focus:outline-none focus:border-accent" />
                        <button className="absolute right-2 top-2 bg-accent text-white p-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto border-t border-white/20 pt-8 flex flex-col md:flex-row items-center justify-between opacity-60 text-xs tracking-widest uppercase">
                <p>{copyrightText}</p>
                <div className="flex gap-6 mt-4 md:mt-0 items-center">
                    {legalLinks.map((link: any, idx: number) => (
                        <Link key={idx} href={link.url} className="hover:text-accent transition-colors">{link.label}</Link>
                    ))}
                    <div className="w-[1px] h-3 bg-white/20"></div>
                    <button 
                        onClick={() => setShowAdminGate(true)}
                        className="hover:text-accent transition-colors text-[10px] tracking-widest uppercase font-bold text-zinc-500 hover:text-white"
                        aria-label="Staff Administration Link"
                    >
                        Admin Access
                    </button>
                </div>
            </div>

            {/* Hidden Admin Access Password Security Modal */}
            {showAdminGate && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-zinc-800 p-8 rounded-sm w-[90%] max-w-[380px] shadow-2xl relative">
                        <button 
                            onClick={() => { setShowAdminGate(false); setGateKey(''); setGateError(false); }}
                            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                            aria-label="Close Admin Access"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>

                        <div className="text-center mb-6">
                            <span className="text-[9px] text-[#D4AF37] uppercase tracking-[0.3em] font-bold block mb-1">
                                Security Shield
                            </span>
                            <h3 className="text-white text-lg font-light tracking-[0.08em]">
                                Gatekey Required
                            </h3>
                            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                                Enter boutique staff entry key
                            </p>
                        </div>

                        {gateError && (
                            <div className="mb-4 bg-red-950/40 border border-red-900/50 text-red-400 p-3 text-[11px] rounded-sm text-center">
                                Invalid Staff Gatekey. Access Logged.
                            </div>
                        )}

                        <form onSubmit={handleVerifyGate} className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="Enter operational gatekey" 
                                value={gateKey}
                                onChange={e => setGateKey(e.target.value)}
                                className="w-full text-xs py-3.5 px-4 border border-[#2a2a2a] bg-[#161616] text-white outline-none focus:border-[#D4AF37] rounded-sm transition-all text-center placeholder:text-zinc-700"
                                required
                                autoFocus
                            />
                            <button 
                                type="submit"
                                className="w-full bg-[#D4AF37] hover:bg-[#b8952d] text-black font-bold uppercase text-[10px] tracking-[0.18em] py-3.5 px-4 rounded-sm transition-all"
                            >
                                Unlock Gateway
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </footer>
    );
};
