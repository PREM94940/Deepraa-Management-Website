"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useCartStore } from '@/store/useCartStore';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';

export default function ProductDetails() {
    const params = useParams();
    const id = params.id as string;

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState<string>('');
    const [qty, setQty] = useState(1);
    
    const { addItem } = useCartStore();

    useEffect(() => {
        async function fetchProduct() {
            if (!id) return;
            const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
            if (data) {
                setProduct(data);
                if (data.images && data.images.length > 0) {
                    setMainImage(data.images[0]);
                }
            }
            setLoading(false);
        }
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        if (!product) return;
        addItem({
            id: product.id,
            name: product.title,
            price: product.price,
            qty: qty,
            img: mainImage || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600'
        });
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-surface flex items-center justify-center">
                <div className="animate-pulse text-xl font-bold italic font-display text-muted">Loading luxury...</div>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="min-h-screen">
                <Navbar />
                <div className="py-32 text-center">
                    <h1 className="text-4xl font-display font-bold">Product Not Found</h1>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="relative bg-surface">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16">
                {/* Images Section */}
                <div className="space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="aspect-[3/4] rounded-3xl overflow-hidden bg-white shadow-xl"
                    >
                        <img src={mainImage} alt={product.title} className="w-full h-full object-cover" />
                    </motion.div>
                    
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                            {product.images.map((img: string, idx: number) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setMainImage(img)}
                                    className={`w-24 h-32 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${mainImage === img ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col justify-center"
                >
                    <div className="mb-8">
                        {product.vendor && (
                            <span className="text-accent font-bold tracking-widest uppercase text-xs mb-2 block">
                                {product.vendor}
                            </span>
                        )}
                        <h1 className="text-4xl md:text-5xl font-bold font-display leading-tight mb-4 text-fg">
                            {product.title}
                        </h1>
                        <p className="text-2xl text-muted font-medium">
                            ₹{product.price}
                        </p>
                    </div>

                    <div className="prose prose-lg text-muted mb-10" dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }} />

                    <div className="flex items-center gap-6 mb-12">
                        <div className="flex items-center border border-border rounded-xl px-4 py-3 bg-white">
                            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 font-bold text-lg">-</button>
                            <span className="px-6 font-bold text-lg min-w-[3rem] text-center">{qty}</span>
                            <button onClick={() => setQty(qty + 1)} className="px-4 font-bold text-lg">+</button>
                        </div>
                        <button 
                            onClick={handleAddToCart}
                            className="flex-1 bg-accent text-white py-5 rounded-xl font-bold text-lg shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all">
                            Add to Cart
                        </button>
                    </div>

                    {/* Product Metadata */}
                    <div className="border-t border-border pt-8 space-y-4 text-sm">
                        {product.sku && (
                            <div className="flex">
                                <span className="w-32 font-bold uppercase tracking-widest text-muted text-xs">SKU</span>
                                <span className="font-medium">{product.sku}</span>
                            </div>
                        )}
                        <div className="flex">
                            <span className="w-32 font-bold uppercase tracking-widest text-muted text-xs">Availability</span>
                            <span className="font-medium text-accent-emerald">
                                {product.status === 'Active' ? 'In Stock - Ready to Ship' : 'Out of Stock'}
                            </span>
                        </div>
                        {product.movement_velocity && (
                            <div className="flex">
                                <span className="w-32 font-bold uppercase tracking-widest text-muted text-xs">Demand</span>
                                <span className="font-medium">
                                    {product.movement_velocity === 'Fast' ? 'High Demand 🔥' : 'Steady'}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
