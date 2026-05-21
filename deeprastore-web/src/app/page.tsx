"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ProductCard } from '@/components/ProductCard';

const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1 }}
                    className="relative z-20"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-xs tracking-widest uppercase mb-6">
                        New Collection Arrival
                    </span>
                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold font-display leading-[1.1] mb-8 text-fg">
                        Timeless <br/> <span className="text-accent italic">Elegance.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted mb-12 max-w-lg leading-relaxed">
                        Discover the finest hand-woven fabrics, luxury lehengas, and premium Indian silhouettes. Reimagined for the modern luxury lifestyle.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-5">
                        <Link href="/collections" className="bg-accent text-white px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-accent/20 text-center">
                            Shop Collection
                        </Link>
                        <Link href="/custom-stitching" className="bg-white text-fg border border-border px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-colors text-center">
                            Custom Stitching
                        </Link>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative z-10 hidden lg:block"
                >
                    <div className="grid grid-cols-2 gap-6">
                        <img src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600" alt="Model 1" className="rounded-[2rem] object-cover aspect-[3/4] w-full shadow-2xl" />
                        <img src="https://images.unsplash.com/photo-1617175548912-f8702132e1b1?auto=format&fit=crop&q=80&w=600" alt="Model 2" className="rounded-[2rem] object-cover aspect-[3/4] w-full mt-16 shadow-2xl" />
                    </div>
                    <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-[2rem] shadow-xl border border-border flex items-center gap-4">
                        <div className="flex -space-x-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Customer" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="font-bold text-sm">Trusted by 10k+</p>
                            <p className="text-xs text-muted">Happy Customers</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};


const ProductGrid = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            const { data, error } = await supabase.from('products').select('*').limit(8);
            if (data) {
                setProducts(data);
            }
            setLoading(false);
        }
        fetchProducts();
    }, []);

    return (
        <section className="py-24 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">Trending Now</h2>
                    <div className="flex flex-wrap justify-center gap-8 border-b border-border mb-12">
                        {['Featured', 'Clothing', 'Fabrics', 'Sale'].map((tab, i) => (
                            <button key={tab} className={`pb-4 text-sm font-bold uppercase tracking-widest ${i === 0 ? 'border-b-2 border-accent text-accent' : 'text-muted'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {loading && <p className="col-span-4 text-center py-10 opacity-50">Loading collection...</p>}
                    {!loading && products.length === 0 && (
                        <p className="col-span-4 text-center py-10 opacity-50">No products found. Please add products to Supabase.</p>
                    )}
                    {!loading && products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const FabricShowcase = () => {
    return (
        <section className="py-24 bg-accent-emerald text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    <div className="aspect-[4/5] rounded-[3rem] overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1594932224828-b4b059b6f6f2?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Fabric details" />
                    </div>
                    <div className="absolute -bottom-10 -right-10 bg-accent p-8 rounded-[2rem] shadow-2xl max-w-[240px]">
                        <span className="block text-4xl font-bold mb-2">450+</span>
                        <span className="text-sm font-bold uppercase tracking-widest opacity-80 leading-tight block">Handpicked Fabrics from Artisans</span>
                    </div>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8 mt-10 md:mt-0"
                >
                    <span className="text-accent font-bold tracking-[0.2em] uppercase">Deepra Speciality</span>
                    <h2 className="text-5xl md:text-7xl font-bold font-display leading-tight">Mastery in <br/> <span className="italic">Every Thread.</span></h2>
                    <p className="text-lg opacity-80 leading-relaxed font-light max-w-lg">
                        We source directly from the heart of India's textile hubs. Our fabrics are curated for quality, GSM, and weave authenticity. From royal velvet to airy mulmul.
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { label: 'Authentic Weave', icon: '✨' },
                            { label: 'Artisan Sourced', icon: '🤝' },
                            { label: 'Custom Meters', icon: '📏' },
                            { label: 'Global Shipping', icon: '🌍' },
                        ].map(item => (
                            <li key={item.label} className="flex items-center gap-3 bg-white/10 premium-blur p-4 rounded-2xl">
                                <span className="text-2xl">{item.icon}</span>
                                <span className="font-bold text-sm tracking-wide uppercase">{item.label}</span>
                            </li>
                        ))}
                    </ul>
                    <Link href="/collections">
                        <button className="bg-white text-accent-emerald px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl mt-8">
                            Explore Fabric Store
                        </button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

const Testimonials = () => {
    return (
        <section className="py-24 px-6 bg-surface">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold font-display mb-16 italic">Words from our <span className="text-accent">Darlings.</span></h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i, index) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            key={i} 
                            className="bg-bg p-10 rounded-[2rem] border border-border text-left relative group hover:border-accent transition-colors"
                        >
                            <div className="flex gap-1 mb-6">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <svg key={s} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#facc15" className="text-yellow-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                ))}
                            </div>
                            <p className="text-lg italic mb-8 opacity-80">"The quality of the Banarasi silk I ordered for my wedding was beyond words. Deeprastore has truly mastered the art of premium fabrics."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-accent/20"></div>
                                <div>
                                    <h4 className="font-bold">Ananya Sharma</h4>
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted">Verified Buyer</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default function Storefront() {
    return (
        <main className="relative">
            <Navbar />
            <Hero />

            <ProductGrid />
            <FabricShowcase />
            <Testimonials />
            <Footer />
            <CartDrawer />
        </main>
    );
}
