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
                        <li><Link href="/" className="hover:text-accent transition-colors">Our Story</Link></li>
                        <li><Link href="/" className="hover:text-accent transition-colors">Artisans</Link></li>
                        <li><Link href="/" className="hover:text-accent transition-colors">Sustainability</Link></li>
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
            
            {/* WhatsApp CTA */}
            <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="fixed bottom-8 right-8 bg-[#25D366] text-white p-4 rounded-2xl shadow-2xl hover:scale-110 transition-transform z-50 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                <span className="font-bold">Chat with Style Expert</span>
            </a>
        </footer>
    );
};
