"use client";

import Link from 'next/link';

export const Footer = () => {
    return (
        <footer className="bg-fg text-white pt-24 pb-12 px-6">
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
                        <li><Link href="/lookbook" className="hover:text-accent transition-colors">Our Story & Lookbook</Link></li>
                        <li><Link href="/track" className="hover:text-accent transition-colors text-accent-emerald font-bold">Track Order</Link></li>
                        <li><Link href="/" className="hover:text-accent transition-colors">Artisans</Link></li>
                        <li><Link href="/" className="hover:text-accent transition-colors">Contact</Link></li>
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
            
        </footer>
    );
};
