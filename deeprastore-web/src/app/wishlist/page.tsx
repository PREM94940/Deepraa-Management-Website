"use client";
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Wishlist() {
    const { items, removeItem } = useWishlistStore();
    const { addItem } = useCartStore();

    return (
        <main className="relative bg-surface min-h-screen flex flex-col">
            <Navbar />
            
            <div className="flex-1 max-w-7xl mx-auto px-6 py-32 w-full">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Your Wishlist</h1>
                    <p className="text-muted max-w-lg mx-auto">
                        Curated pieces waiting to become part of your collection.
                    </p>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                        </div>
                        <h2 className="text-2xl font-bold font-display mb-2">Your wishlist is empty</h2>
                        <p className="text-muted mb-8">Explore our collections to add items you love.</p>
                        <Link href="/collections" className="bg-black text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gold transition-colors">
                            Discover Collections
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {items.map((item, idx) => (
                            <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group cursor-pointer flex flex-col"
                            >
                                <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 relative mb-4">
                                    <img src={item.img} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <button 
                                        onClick={(e) => { e.preventDefault(); removeItem(item.id); }}
                                        className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                                    </button>
                                </div>
                                
                                <Link href={`/product/${item.id}`} className="flex-1">
                                    <h3 className="font-bold font-display text-lg mb-1 group-hover:text-accent transition-colors line-clamp-2">{item.name}</h3>
                                    <p className="text-muted mb-4">₹{item.price.toLocaleString('en-IN')}</p>
                                </Link>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        addItem({ id: item.id, name: item.name, price: item.price, img: item.img, qty: 1 });
                                    }}
                                    className="w-full py-3 border border-black font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-colors"
                                >
                                    Add to Cart
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
