"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/ProductCard';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';

const CinematicHero = () => {
    return (
        <section className="relative w-full h-screen overflow-hidden">
            <div className="absolute inset-0">
                <video 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    className="w-full h-full object-cover opacity-80"
                    src="https://player.vimeo.com/external/494254644.hd.mp4?s=d703e73fb2a9dc6312a149c5e2efea5e0d473cf2&profile_id=175"
                ></video>
                <div className="absolute inset-0 bg-black/40"></div>
            </div>
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
                <motion.span 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-gold font-bold tracking-[0.3em] uppercase text-sm mb-6"
                >
                    Deepra's Signature Collection
                </motion.span>
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-8 leading-tight"
                >
                    Wear Your <br/> <span className="italic font-light">Culture.</span>
                </motion.h1>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-6"
                >
                    <Link href="/collections" className="bg-white text-black px-12 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gold hover:text-white transition-all duration-300">
                        Shop The Look
                    </Link>
                    <Link href="/custom-stitching" className="bg-transparent border border-white text-white px-12 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300">
                        Custom Orders
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

const FeaturedCategories = () => {
    const categories = [
        { name: 'Bridal', image: 'https://images.unsplash.com/photo-1595954422409-17d4db567995?auto=format&fit=crop&q=80&w=600', span: 'col-span-2 row-span-2' },
        { name: 'Half Sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600', span: 'col-span-1 row-span-1' },
        { name: 'Fabrics', image: 'https://images.unsplash.com/photo-1594932224828-b4b059b6f6f2?auto=format&fit=crop&q=80&w=600', span: 'col-span-1 row-span-1' },
        { name: 'Ready to Ship', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600', span: 'col-span-2 row-span-1' },
    ];

    return (
        <section className="py-24 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-display text-fg mb-4">Curated <span className="italic">Elegance</span></h2>
                <div className="w-24 h-1 bg-gold mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 md:gap-6 h-[80vh]">
                {categories.map((cat, idx) => (
                    <Link href="/collections" key={idx} className={`group relative overflow-hidden ${cat.span}`}>
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-8 left-8">
                            <h3 className="text-white text-2xl md:text-3xl font-display mb-2">{cat.name}</h3>
                            <span className="text-gold text-xs font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                Explore Now →
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

const BestSellersSlider = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            const { data } = await supabase.from('products').select('*').limit(6);
            if (data) setProducts(data);
            setLoading(false);
        }
        fetchProducts();
    }, []);

    return (
        <section className="py-24 bg-bg overflow-hidden">
            <div className="px-6 max-w-7xl mx-auto mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl md:text-5xl font-display text-fg mb-4">Trending <span className="italic">Now</span></h2>
                    <p className="text-muted max-w-md">Our most coveted pieces, loved by brides and fashion enthusiasts globally.</p>
                </div>
                <Link href="/collections" className="hidden md:block border-b border-black pb-1 text-sm uppercase tracking-widest font-semibold hover:text-gold hover:border-gold transition-colors">
                    View All
                </Link>
            </div>
            
            {/* Horizontal Scroll Container */}
            <div className="flex overflow-x-auto hide-scrollbar gap-8 px-6 pb-12 snap-x snap-mandatory">
                {/* Empty padding block for start */}
                <div className="shrink-0 w-4 md:w-[calc((100vw-80rem)/2)]"></div>
                
                {loading ? (
                    <div className="w-full text-center py-20 text-muted">Loading collection...</div>
                ) : products.map(product => (
                    <div key={product.id} className="shrink-0 w-[280px] md:w-[320px] snap-start">
                        <ProductCard product={product} />
                    </div>
                ))}
                
                {/* Empty padding block for end */}
                <div className="shrink-0 w-6"></div>
            </div>
        </section>
    );
};

const BrandStory = () => {
    return (
        <section className="py-32 px-6 bg-fg text-bg relative overflow-hidden">
            <div className="absolute -right-40 -top-40 opacity-10">
                <svg width="600" height="600" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="#D4AF37" strokeWidth="1" fill="none"/></svg>
            </div>
            <div className="max-w-4xl mx-auto text-center relative z-10">
                <span className="text-gold font-bold tracking-[0.3em] uppercase text-xs mb-8 block">The Deepra Journey</span>
                <h2 className="text-4xl md:text-6xl font-display leading-[1.3] mb-10">
                    We don't just sell fabrics. <br/>
                    <span className="italic font-light text-gold">We weave emotions.</span>
                </h2>
                <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed mb-12 max-w-2xl mx-auto">
                    Every piece at Deeprastore tells a story of Indian craftsmanship. From the intricate Zari work of Kanchipuram to the delicate flow of georgette, our boutique is a homage to the modern woman who cherishes her roots.
                </p>
                <img src="https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=800" alt="Artisan Work" className="w-full max-w-2xl mx-auto aspect-[16/9] object-cover mb-12 shadow-2xl" />
                <Link href="/custom-stitching" className="bg-gold text-fg px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white transition-colors">
                    Discover Our Craft
                </Link>
            </div>
        </section>
    );
};

const InstagramFeed = () => {
    return (
        <section className="py-24">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-display text-fg mb-4">Join Our <span className="italic">Community</span></h2>
                <p className="text-muted mb-6">@Deeprastore on Instagram</p>
                <Link href="https://instagram.com" target="_blank" className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gold transition-colors">
                    Follow Us
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 px-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="relative aspect-[4/5] group overflow-hidden bg-gray-100">
                        <img src={`https://images.unsplash.com/photo-1617175548912-f8702132e1b${i}?auto=format&fit=crop&q=80&w=400`} alt="Social Feed" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default function Home() {
    return (
        <main className="w-full">
            <Navbar />
            <CinematicHero />
            <FeaturedCategories />
            <BestSellersSlider />
            <BrandStory />
            <InstagramFeed />
            <Footer />
            <CartDrawer />
        </main>
    );
}
