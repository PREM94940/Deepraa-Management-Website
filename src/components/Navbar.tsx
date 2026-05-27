"use client";
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { useNavigationManager } from '@/hooks/useCMSContent';
import { useAuth } from '@/context/AuthContext';

export const Navbar = ({ globalSettings }: { globalSettings?: any }) => {
    const { items, setIsOpen } = useCartStore();
    const { nav: headerNav } = useNavigationManager('header');
    const { user, signOut, openLoginModal } = useAuth();
    
    // Required nav items that must always appear
    const REQUIRED_ITEMS = [
        { label: 'Track Order', link: '/track' },
        { label: 'Support', link: '/support' }
    ];

    // Determine menuItems dynamically from database or fallback to settings/defaults
    let menuItems = (headerNav && headerNav.items && headerNav.items.length > 0)
        ? headerNav.items.map((item: any) => ({ label: item.label, link: item.url }))
        : (globalSettings?.primary_menu || [
            { label: 'Collections', link: '/collections' },
            { label: 'Fabrics', link: '/collections?category=Fabric' },
            { label: 'Stitching', link: '/custom-stitching' },
            { label: 'Track Order', link: '/track' },
            { label: 'Support', link: '/support' }
        ]);
    
    // Ensure required items are always present (Track Order, Support)
    const existingLabels = menuItems.map((item: any) => item.label.toLowerCase());
    REQUIRED_ITEMS.forEach(req => {
        if (!existingLabels.includes(req.label.toLowerCase())) {
            menuItems = [...menuItems, req];
        }
    });
    
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
                {/* Account Trigger & Dropdown */}
                <div className="relative group py-2">
                    {user ? (
                        <div className="flex items-center gap-2 cursor-pointer hover:text-accent transition-colors">
                            <span className="text-xs md:text-sm font-semibold max-w-[120px] truncate">
                                {user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:rotate-180"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    ) : (
                        <button onClick={() => openLoginModal('/account')} className="hover:text-accent transition-colors cursor-pointer block">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </button>
                    )}

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-3 px-1 backdrop-blur-md">
                        {user ? (
                            <div className="flex flex-col gap-1">
                                <div className="px-3 py-2 border-b border-border mb-2">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Logged In As</p>
                                    <p className="text-sm font-semibold truncate text-gold">
                                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                </div>
                                <Link href="/account" className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm hover:bg-white/5 hover:text-accent rounded-lg transition-colors font-medium">
                                    Your Dashboard
                                </Link>
                                <Link href="/account" className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm hover:bg-white/5 hover:text-accent rounded-lg transition-colors font-medium">
                                    Your Orders
                                </Link>
                                <Link href="/wishlist" className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm hover:bg-white/5 hover:text-accent rounded-lg transition-colors font-medium">
                                    Your Wishlist
                                </Link>
                                <div className="h-[1px] bg-border my-2 mx-2"></div>
                                <button onClick={() => signOut()} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs md:text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium cursor-pointer">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 p-2">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-1 mb-1">Welcome</p>
                                <button onClick={() => openLoginModal('/account')} className="w-full text-center py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer">
                                    Sign In / Register
                                </button>
                            </div>
                        )}
                    </div>
                </div>
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
