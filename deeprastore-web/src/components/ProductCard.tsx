"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/useCartStore';

export const ProductCard = ({ product }: { product: any }) => {
    const { addItem } = useCartStore();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); // prevent navigation to product detail
        addItem({
            id: product.id,
            name: product.title,
            price: product.price,
            qty: 1,
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
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 mb-6 relative">
                    <img src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.title} />
                    {product.movement_velocity && product.movement_velocity !== 'Normal' && (
                        <span className="absolute top-4 left-4 bg-white/90 premium-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm text-fg">
                            {product.movement_velocity}
                        </span>
                    )}
                    <button 
                        onClick={handleAddToCart}
                        className="absolute bottom-4 right-4 bg-accent text-white p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/><path d="M12 8v6"/><path d="M9 11h6"/></svg>
                    </button>
                </div>
                <h3 className="text-lg font-bold mb-1 group-hover:text-accent transition-colors">{product.title}</h3>
                <p className="text-muted font-medium">₹{product.price}</p>
            </Link>
        </motion.div>
    );
};
