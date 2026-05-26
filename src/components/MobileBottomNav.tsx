"use client";
import React from 'react';
import Link from 'next/link';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';

export const MobileBottomNav = () => {
    const pathname = usePathname();
    const { toggleCart, items } = useCartStore();

    const cartCount = items.reduce((total, item) => total + item.qty, 0);

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 z-50 md:hidden pb-safe">
            <div className="flex justify-around items-center h-16 px-4">
                <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === '/' ? 'text-black' : 'text-gray-400'}`}>
                    <Home size={22} strokeWidth={pathname === '/' ? 2.5 : 2} />
                    <span className="text-[10px] font-medium tracking-wide">Home</span>
                </Link>

                <Link href="/collections" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.includes('/collections') ? 'text-black' : 'text-gray-400'}`}>
                    <Search size={22} strokeWidth={pathname.includes('/collections') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium tracking-wide">Explore</span>
                </Link>

                <button 
                    onClick={toggleCart} 
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 relative"
                >
                    <div className="relative">
                        <ShoppingBag size={22} strokeWidth={2} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 bg-gold text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                                {cartCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium tracking-wide">Cart</span>
                </button>

                <Link href="/account" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.includes('/account') ? 'text-black' : 'text-gray-400'}`}>
                    <User size={22} strokeWidth={pathname.includes('/account') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium tracking-wide">Account</span>
                </Link>
            </div>
        </nav>
    );
};
