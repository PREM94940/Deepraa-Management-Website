"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';

export const ProductCard = ({ product }: { product: any }) => {
    const { addItem } = useCartStore();

    const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); // prevent navigation to product detail
        addItem({
            id: product.id,
            name: product.name || product.title,
            price: product.price,
            qty: 1,
            img: product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600'
        });
    };

    const toggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        const inWishlist = isInWishlist(product.id);
        if (inWishlist) removeWishlist(product.id);
        else addWishlist({ 
            id: product.id, 
            name: product.name || product.title, 
            price: product.price, 
            img: product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600' 
        });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <Link href={`/product/${product.id}`} className="group block">
                <div className="aspect-[3/4] rounded-sm overflow-hidden bg-gray-50 mb-4 relative">
                    <Image src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600'} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" alt={product.name || product.title} />
                    {(product.movement_velocity && product.movement_velocity !== 'Normal') ? (
                        <span className="absolute top-4 left-4 bg-white/90 premium-blur px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-sm text-fg">
                            {product.movement_velocity}
                        </span>
                    ) : product.is_featured ? (
                        <span className="absolute top-4 left-4 bg-white/90 premium-blur px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-sm text-fg">
                            Bestseller
                        </span>
                    ) : product.is_new ? (
                        <span className="absolute top-4 left-4 bg-white/90 premium-blur px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest shadow-sm text-fg">
                            Just In
                        </span>
                    ) : null}
                    
                    <button 
                        onClick={toggleWishlist}
                        className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 translate-y-[-10px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? "#ef4444" : "none"} stroke={isInWishlist(product.id) ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </button>

                    <button 
                        onClick={handleAddToCart}
                        className="absolute bottom-4 right-4 bg-accent text-white p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/><path d="M12 8v6"/><path d="M9 11h6"/></svg>
                    </button>
                </div>
                <h3 className="text-base font-bold mb-1 group-hover:text-accent transition-colors truncate px-1">{product.name || product.title}</h3>
                <p className="text-muted font-medium px-1">₹{(product.price || 0).toLocaleString('en-IN')}</p>
                {product.compare_price && product.compare_price > product.price && (
                    <p className="text-xs text-muted line-through px-1">₹{product.compare_price.toLocaleString('en-IN')}</p>
                )}
            </Link>
        </motion.div>
    );
};
