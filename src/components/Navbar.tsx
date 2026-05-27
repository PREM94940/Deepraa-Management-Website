"use client";

import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { useNavigationManager } from '@/hooks/useCMSContent';

export const Navbar = ({ globalSettings }: { globalSettings?: any }) => {
    const { items, setIsOpen } = useCartStore();
    const { nav: headerNav } = useNavigationManager('header');
    
    // Determine menuItems dynamically from database or fallback to settings/defaults
    const menuItems = (headerNav && headerNav.items && headerNav.items.length > 0)
        ? headerNav.items.map((item: any) => ({ label: item.label, link: item.url }))
        : (globalSettings?.primary_menu || [
            { label: 'Collections', link: '/collections' },
            { label: 'Fabrics', link: '/collections?category=Fabric' },
            { label: 'Stitching', link: '/custom-stitching' },
            { label: 'Track Order', link: '/track' },
            { label: 'Support', link: '/support' }
        ]);
    
    // Calculate total quantity for the badge
    const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

    return (
        <div className="w-full relative z-50">
            {globalSettings?.announcement_text && (
                <div className="bg-black text-white text-[10px] md:text-xs font-bold uppercase tracking-widest text-center py-2 px-4">
                    {globalSettings.announcement_link ? (
                        <Link href={globalSettings.announcement_link} className="hover:text-gold transition-colors">
                            {globalSettings.announcement_text}
                        </Link>
                    ) : (
                        <span>{globalSettings.announcement_text}</span>
                    )}
                </div>
            )}
            <nav className="flex justify-between items-center p-4 md:p-6 lg:px-12 bg-surface sticky top-0 border-b border-border premium-blur">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        {globalSettings?.logo_url ? (
                            <img src={globalSettings.logo_url} alt="Logo" className="h-10 object-contain" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center cursor-pointer shadow-lg shadow-accent/20 hover:scale-105 transition-transform">
                                    <span className="text-white font-bold text-xl">D</span>
                                </div>
                                <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight uppercase cursor-pointer hidden md:block">Deeprastore</h1>
                            </div>
                        )}
                    </Link>
                </div>
                <div className="hidden md:flex gap-10 font-bold text-sm tracking-widest uppercase items-center">
                    {menuItems.map((item: any, idx: number) => (
                        <Link key={idx} href={item.link} className="hover:text-accent transition-colors">
                            {item.label}
                        </Link>
                    ))}
                <div className="h-4 w-[1px] bg-border mx-2"></div>
            </div>
            <div className="flex items-center gap-6">
                <Link href="/account" className="hover:text-accent transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </Link>
                <Link href="/wishlist" className="hover:text-accent transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </Link>
                <button className="hover:text-accent transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                </button>
                <button onClick={() => setIsOpen(true)} className="relative hover:text-accent transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {totalItems}
                        </span>
                    )}
                </button>
            </div>
        </nav>
        </div>
    );
};
