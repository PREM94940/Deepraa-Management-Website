import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/ProductCard';

export const CinematicHero = ({ data }: { data?: any }) => {
    const mediaUrl = data?.image_url || data?.media_url || "https://player.vimeo.com/external/494254644.hd.mp4?s=d703e73fb2a9dc6312a149c5e2efea5e0d473cf2&profile_id=175";
    const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('vimeo.com');

    return (
        <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-zinc-900" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}>
            <div className="absolute inset-0">
                {isVideo ? (
                    <video 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="w-full h-full object-cover opacity-90 transition-opacity duration-1000"
                        style={{ objectPosition: data?.focal_point || 'center' }}
                        src={mediaUrl}
                    ></video>
                ) : (
                    <Image
                        src={mediaUrl}
                        alt={data?.headline || "Hero Background"}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover opacity-90 transition-opacity duration-1000"
                        style={{ objectPosition: data?.focal_point || 'center' }}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70"></div>
            </div>
            
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6 pt-20">
                <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-gold font-semibold tracking-[0.2em] uppercase text-xs md:text-sm mb-4 md:mb-6"
                >
                    {data?.subheadline || "Deepra's Signature Collection"}
                </motion.span>
                
                <motion.h1 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-10 leading-[1.1] max-w-4xl"
                    dangerouslySetInnerHTML={{ __html: data?.headline || 'Wear Your <br class="hidden sm:block"/> <span class="italic font-light">Culture.</span>' }}
                />
                
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="flex flex-col w-full sm:w-auto sm:flex-row gap-4 mb-12"
                >
                    <Link href={data?.primary_cta_link || data?.cta_link || "/collections"} className="bg-white text-black border border-white px-10 py-4 text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-transparent hover:text-white transition-all duration-300 w-full sm:w-auto text-center">
                        {data?.primary_cta_text || data?.cta_text || "Shop The Look"}
                    </Link>
                    <Link href={data?.secondary_cta_link || data?.cta_link_secondary || "/custom-stitching"} className="bg-transparent border border-white text-white px-10 py-4 text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 w-full sm:w-auto">
                        {data?.secondary_cta_text || "Custom Orders"}
                    </Link>
                </motion.div>

                {/* Trust Strip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="flex flex-wrap justify-center gap-4 md:gap-8 items-center text-white/80 text-[10px] md:text-xs font-medium tracking-widest uppercase border-t border-white/20 pt-6 max-w-2xl w-full"
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 9.293a1 1 0 01-1.414 1.414L9 10.414l-1.293 1.293a1 1 0 01-1.414-1.414l2-2a1 1 0 011.414 0l3 3z" clipRule="evenodd"/></svg>
                        Authentic Heritage Silks
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/></svg>
                        Secure Checkout
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-3 h-3 text-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                        24/7 Styling Support
                    </span>
                </motion.div>
            </div>
        </section>
    );
};

export const FeaturedCategories = ({ data }: { data?: any }) => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCategories() {
            const { data: prods } = await supabase
                .from('products')
                .select('category, images')
                .eq('status', 'Active');
                
            if (prods) {
                const catMap = new Map();
                prods.forEach(p => {
                    if (p.category && !catMap.has(p.category)) {
                        catMap.set(p.category, p.images?.[0] || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600');
                    }
                });
                
                const formattedCats = Array.from(catMap.entries()).slice(0, 4).map(([name, image], idx) => {
                    // Extract the last part of Google Product Category
                    const displayName = name.includes('>') ? name.split('>').pop().trim() : name;
                    
                    let span = 'col-span-1 row-span-1';
                    if (data?.layout !== 'standard') {
                        // Bento layout (default)
                        if (idx === 0) span = 'col-span-2 row-span-2';
                        else if (idx === 3) span = 'col-span-2 row-span-1';
                    }
                    return { name: displayName, queryName: name, image, span };
                });
                
                setCategories(formattedCats);
            }
            setLoading(false);
        }
        fetchCategories();
    }, [data?.layout]);

    const getTextClass = () => {
        if (data?.text_size === 'small') return 'text-lg md:text-xl';
        if (data?.text_size === 'large') return 'text-3xl md:text-5xl';
        return 'text-2xl md:text-3xl'; // medium
    };

    return (
        <section className="py-8 md:py-12 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-5xl font-display text-fg mb-4" dangerouslySetInnerHTML={{ __html: data?.headline || 'Curated <span class="italic">Elegance</span>' }} />
                <div className="w-24 h-[2px] bg-gold mx-auto"></div>
                {data?.subheadline && <p className="text-muted mt-6 max-w-xl mx-auto">{data.subheadline}</p>}
            </div>
            {loading ? (
                <div className={`grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 md:gap-6 h-[80vh]`}>
                    <div className="col-span-2 row-span-2 bg-gray-100 animate-pulse rounded-sm"></div>
                    <div className="col-span-1 row-span-1 bg-gray-100 animate-pulse rounded-sm"></div>
                    <div className="col-span-1 row-span-1 bg-gray-100 animate-pulse rounded-sm"></div>
                    <div className="col-span-2 row-span-1 bg-gray-100 animate-pulse rounded-sm"></div>
                </div>
            ) : (
                <div className={`grid grid-cols-2 md:grid-cols-4 ${data?.layout === 'standard' ? 'grid-rows-1 h-[40vh] md:h-[60vh]' : 'grid-rows-2 h-[80vh]'} gap-4 md:gap-6`}>
                    {categories.map((cat, idx) => (
                        <Link href={`/collections?category=${encodeURIComponent(cat.queryName)}`} key={idx} className={`group relative overflow-hidden bg-gray-100 rounded-sm ${data?.layout === 'standard' ? 'col-span-1 row-span-1' : cat.span}`}>
                            <Image src={cat.image} alt={cat.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105" />
                            {!data?.hide_text && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <div className="absolute bottom-6 left-6 pr-4">
                                        <h3 className={`text-white font-display font-light tracking-wide mb-2 ${getTextClass()} leading-tight`}>{cat.name}</h3>
                                        <span className="text-gold text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0 block">
                                            Explore Now →
                                        </span>
                                    </div>
                                </>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
};

export const BestSellersSlider = ({ data }: { data?: any }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            let query = supabase.from('products').select('*').eq('status', 'Active');
            
            // Dynamic Merchandising Logic
            const category = data?.category;
            if (category) {
                query = query.eq('category', category).order('created_at', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }
            
            const { data: prods } = await query.limit(6);
            if (prods) setProducts(prods);
            setLoading(false);
        }
        fetchProducts();
    }, [data?.mode]);

    return (
        <section className="py-8 md:py-12 bg-bg overflow-hidden">
            <div className="px-6 max-w-7xl mx-auto mb-10 md:mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl md:text-5xl font-display text-fg mb-4" dangerouslySetInnerHTML={{ __html: data?.headline || 'Trending <span class="italic">Now</span>' }} />
                    <div className="w-16 h-[2px] bg-gold mb-4"></div>
                    <p className="text-muted max-w-md">{data?.subheadline || 'Our most coveted pieces, loved by brides and fashion enthusiasts globally.'}</p>
                </div>
                <Link href={data?.cta_link || "/collections"} className="hidden md:block border-b border-black pb-1 text-sm uppercase tracking-widest font-semibold hover:text-gold hover:border-gold transition-colors">
                    {data?.cta_text || 'View All'}
                </Link>
            </div>
            
            <div className="flex overflow-x-auto hide-scrollbar gap-8 px-6 pb-12 snap-x snap-mandatory">
                <div className="shrink-0 w-4 md:w-[calc((100vw-80rem)/2)]"></div>
                {loading ? (
                    <div className="w-full text-center py-20 text-muted">Loading collection...</div>
                ) : products.map(product => (
                    <div key={product.id} className="shrink-0 w-[280px] md:w-[320px] snap-start">
                        <ProductCard product={product} />
                    </div>
                ))}
                <div className="shrink-0 w-6"></div>
            </div>
        </section>
    );
};

export const BrandStory = ({ data }: { data?: any }) => {
    return (
        <section className="py-10 md:py-16 px-6 bg-surface text-fg relative overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-0">
                <div className="w-full md:w-1/2 relative z-10 md:pr-12">
                    <div className="aspect-[4/5] overflow-hidden relative group">
                        <Image 
                            src={data?.image_url || "https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=800"} 
                            alt="Brand Story" 
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition-transform duration-[10000ms] ease-linear group-hover:scale-110 origin-center" 
                            style={{ objectPosition: data?.focal_point || 'center' }}
                        />
                    </div>
                </div>
                <div className="w-full md:w-[55%] md:-ml-24 md:mt-16 z-20 relative bg-surface/95 premium-blur p-8 md:p-16 border border-border/50 shadow-2xl">
                    <span className="text-gold font-bold tracking-[0.2em] uppercase text-xs mb-6 block">{data?.tagline || 'The Deepra Journey'}</span>
                    <h2 className="text-3xl md:text-5xl font-display leading-[1.2] mb-8 text-fg" dangerouslySetInnerHTML={{ __html: data?.headline || "We don't just sell fabrics. <br/> <span class=\"italic font-light text-gold\">We weave emotions.</span>" }} />
                    <p className="text-base md:text-lg text-muted font-light leading-relaxed mb-10 max-w-lg" dangerouslySetInnerHTML={{ __html: data?.description || '<span class="text-4xl float-left mr-2 font-display text-fg leading-none pt-2">E</span>very piece at Deeprastore tells a story of Indian craftsmanship. From the intricate Zari work of Kanchipuram to the delicate flow of georgette, our boutique is a homage to the modern woman who cherishes her roots. Handloom weaving is a legacy passed down through generations, and we are proud to bring that heritage to your wardrobe.' }} />
                    <Link href={data?.cta_link || "/custom-stitching"} className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gold hover:border-gold transition-colors">
                        {data?.cta_text || 'Discover Our Craft'}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export const InstagramFeed = ({ data }: { data?: any }) => {
    const images = data?.images || [1, 2, 3, 4, 5, 6].map(i => `https://images.unsplash.com/photo-1617175548912-f8702132e1b${i}?auto=format&fit=crop&q=80&w=400`);
    
    return (
        <section className="py-8 md:py-12">
            <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-5xl font-display text-fg mb-4" dangerouslySetInnerHTML={{ __html: data?.headline || 'Join Our <span class="italic">Community</span>' }} />
                <div className="w-24 h-[2px] bg-gold mx-auto mb-4"></div>
                <p className="text-muted mb-6">{data?.handle || '@Deeprastore on Instagram'}</p>
                <Link href={data?.cta_link || "https://instagram.com"} target="_blank" className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gold transition-colors">
                    {data?.cta_text || 'Follow Us'}
                </Link>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-[2px] md:gap-2 px-[2px] md:px-2">
                {images.map((img: string, i: number) => (
                    <div key={i} className="relative aspect-[4/5] group overflow-hidden bg-gray-100">
                        <Image src={img} alt="Social Feed" fill sizes="(max-width: 768px) 33vw, 16vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export const ProductHero = ({ 
    data, 
    product, 
    mainImage, 
    setMainImage, 
    qty, 
    setQty, 
    needsStitching, 
    setNeedsStitching, 
    needsFallPico, 
    setNeedsFallPico, 
    selectedSize, 
    setSelectedSize, 
    handleAddToCart, 
    handleWhatsAppOrder 
}: { 
    data?: any, 
    product?: any, 
    mainImage?: string, 
    setMainImage?: (img: string) => void, 
    qty?: number, 
    setQty?: (qty: number) => void, 
    needsStitching?: boolean, 
    setNeedsStitching?: (n: boolean) => void, 
    needsFallPico?: boolean, 
    setNeedsFallPico?: (n: boolean) => void, 
    selectedSize?: string, 
    setSelectedSize?: (s: string) => void, 
    handleAddToCart?: () => void, 
    handleWhatsAppOrder?: () => void 
}) => {
    const mockProduct = {
        id: 'mock-product',
        title: 'The Royal Banarasi Silk Lehenga',
        price: 45000,
        compare_at_price: 55000,
        category: 'Lehengas',
        sku: 'DP-LHN-001',
        is_customizable: true,
        available_sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: '<p>A masterpiece of handloom weaving, crafted by our master weavers in Varanasi. Featuring intricate gold Zari work across premium raw silk, this bridal lehenga is a timeless celebration of Indian heritage and artisanal excellence.</p>',
        images: [
            'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=800'
        ]
    };

    const p = product || mockProduct;
    const [localMainImage, setLocalMainImage] = useState(p.images?.[0] || '');
    const [localQty, setLocalQty] = useState(1);
    const [localNeedsStitching, setLocalNeedsStitching] = useState(false);
    const [localNeedsFallPico, setLocalNeedsFallPico] = useState(false);
    const [localSelectedSize, setLocalSelectedSize] = useState('');

    const currentMainImage = mainImage !== undefined ? mainImage : localMainImage;
    const currentQty = qty !== undefined ? qty : localQty;
    const currentNeedsStitching = needsStitching !== undefined ? needsStitching : localNeedsStitching;
    const currentNeedsFallPico = needsFallPico !== undefined ? needsFallPico : localNeedsFallPico;
    const currentSelectedSize = selectedSize !== undefined ? selectedSize : localSelectedSize;

    const changeMainImage = setMainImage || setLocalMainImage;
    const changeQty = setQty || setLocalQty;
    const changeNeedsStitching = setNeedsStitching || setLocalNeedsStitching;
    const changeNeedsFallPico = setNeedsFallPico || setLocalNeedsFallPico;
    const changeSelectedSize = setSelectedSize || setLocalSelectedSize;

    useEffect(() => {
        if (!currentMainImage && p.images?.[0]) {
            changeMainImage(p.images[0]);
        }
    }, [p.images]);

    const onAddToCart = handleAddToCart || (() => {
        alert(`Added to cart: ${p.title} (Qty: ${currentQty})`);
    });

    const onWhatsAppOrder = handleWhatsAppOrder || (() => {
        const msg = `Hello, I want to order ${p.title} (SKU: ${p.sku})`;
        window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank');
    });

    const isSplit = data?.layout !== 'full';

    return (
        <section className={`py-12 md:py-20 px-6 max-w-7xl mx-auto ${isSplit ? 'grid lg:grid-cols-2 gap-16' : 'flex flex-col'}`}>
            <div className="space-y-6">
                <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative group rounded-sm border border-border">
                    <Image src={currentMainImage} alt={p.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                {p.images && p.images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                        {p.images.map((img: string, idx: number) => (
                            <button 
                                key={idx} 
                                onClick={() => changeMainImage(img)}
                                className={`relative w-20 h-28 flex-shrink-0 overflow-hidden transition-all border ${currentMainImage === img ? 'border-accent opacity-100 scale-102 shadow-sm' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            >
                                <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col">
                <div className="mb-8 border-b border-border pb-8">
                    <span className="text-accent font-bold tracking-widest uppercase text-xs mb-3 block">
                        {p.category || 'Premium Collection'}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-display leading-[1.2] mb-6 text-fg">
                        {p.title}
                    </h1>
                    <div className="flex items-end gap-3">
                        <p className="text-2xl text-fg font-light">
                            ₹{p.price.toLocaleString('en-IN')}
                        </p>
                        {p.compare_at_price && p.compare_at_price > p.price && (
                            <p className="text-lg text-muted line-through mb-1">
                                ₹{p.compare_at_price.toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>
                </div>

                {p.is_customizable ? (
                    <div className="mb-8 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Boutique Services</h3>
                        
                        <label className={`flex items-start gap-4 cursor-pointer group border p-4 transition-all ${currentNeedsStitching ? 'border-accent bg-accent/5' : 'border-border bg-white hover:border-gray-400'}`}>
                            <input 
                                type="checkbox"
                                checked={currentNeedsStitching}
                                onChange={(e) => changeNeedsStitching(e.target.checked)}
                                className="mt-1 accent-accent"
                            />
                            <div>
                                <div className="font-bold text-fg text-sm">Custom Stitching (+₹1,500)</div>
                                <div className="text-xs text-muted mt-1 font-light leading-relaxed">Tailored to your exact measurements via WhatsApp.</div>
                            </div>
                        </label>

                        <label className={`flex items-start gap-4 cursor-pointer group border p-4 transition-all ${currentNeedsFallPico ? 'border-accent bg-accent/5' : 'border-border bg-white hover:border-gray-400'}`}>
                            <input 
                                type="checkbox"
                                checked={currentNeedsFallPico}
                                onChange={(e) => changeNeedsFallPico(e.target.checked)}
                                className="mt-1 accent-accent"
                            />
                            <div>
                                <div className="font-bold text-fg text-sm">Fall & Pico (+₹300)</div>
                                <div className="text-xs text-muted mt-1 font-light leading-relaxed">Edges finished and fall attached.</div>
                            </div>
                        </label>
                    </div>
                ) : p.available_sizes && p.available_sizes.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-fg border-b border-border pb-2 mb-4">Select Size</h3>
                        <div className="flex flex-wrap gap-3">
                            {p.available_sizes.map((size: string) => (
                                <button 
                                    key={size}
                                    onClick={() => changeSelectedSize(size)}
                                    className={`px-6 py-3 border font-bold text-sm transition-colors ${currentSelectedSize === size ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-fg hover:border-black'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center border border-border h-14">
                            <button onClick={() => changeQty(Math.max(1, currentQty - 1))} className="px-4 hover:text-gold transition-colors">-</button>
                            <span className="w-8 text-center text-sm font-semibold">{currentQty}</span>
                            <button onClick={() => changeQty(currentQty + 1)} className="px-4 hover:text-gold transition-colors">+</button>
                        </div>
                        <button 
                            onClick={onAddToCart}
                            className="flex-1 bg-black text-white h-14 font-bold uppercase tracking-widest hover:bg-gold transition-colors">
                            Add to Cart
                        </button>
                    </div>
                    <button 
                        onClick={onWhatsAppOrder}
                        className="w-full bg-[#25D366] text-white h-14 font-bold uppercase tracking-widest hover:bg-[#1EBE5D] transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Order via WhatsApp
                    </button>
                </div>

                <div className="bg-[#25D366]/5 border border-[#25D366]/20 p-5 mb-8 flex gap-4 items-start rounded-sm">
                    <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-fg mb-1">Need Styling Advice?</p>
                        <p className="text-xs text-muted leading-relaxed mb-3">Our concierge is available to help you with measurements and styling.</p>
                        <button onClick={onWhatsAppOrder} className="text-xs font-bold uppercase tracking-widest text-[#25D366] hover:underline flex items-center gap-1">
                            Chat with Stylist →
                        </button>
                    </div>
                </div>

                <div className="prose prose-p:font-light prose-p:leading-relaxed text-fg text-sm" dangerouslySetInnerHTML={{ __html: p.description || '' }} />
            </div>
        </section>
    );
};

export const CollectionGrid = ({ 
    data, 
    products, 
    loading, 
    searchQuery, 
    setSearchQuery, 
    sortBy, 
    setSortBy, 
    selectedCategory, 
    setSelectedCategory, 
    priceRange, 
    setPriceRange, 
    categories 
}: { 
    data?: any, 
    products?: any[], 
    loading?: boolean, 
    searchQuery?: string, 
    setSearchQuery?: (q: string) => void, 
    sortBy?: string, 
    setSortBy?: (s: string) => void, 
    selectedCategory?: string, 
    setSelectedCategory?: (c: string) => void, 
    priceRange?: number, 
    setPriceRange?: (p: number) => void, 
    categories?: string[] 
}) => {
    const mockProducts = [
        { id: '1', title: 'Banarasi Raw Silk Saree', price: 18500, compare_at_price: 24000, images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600'], sku: 'DP-SAR-001', category: 'Sarees', status: 'Active' },
        { id: '2', title: 'Artisanal Banarasi Lehenga', price: 42000, compare_at_price: 49000, images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600'], sku: 'DP-LHN-002', category: 'Lehengas', status: 'Active' },
        { id: '3', title: 'Royal Zardozi Gown', price: 29000, images: ['https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=600'], sku: 'DP-GWN-003', category: 'Dresses', status: 'Active' },
        { id: '4', title: 'Zari Border Silk Fabric', price: 2400, images: ['https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=600'], sku: 'DP-FAB-004', category: 'Fabric', status: 'Active' }
    ];

    const localCategories = ['All', 'Sarees', 'Lehengas', 'Dresses', 'Jewellery', 'Fabric'];
    const [localProducts, setLocalProducts] = useState<any[]>(mockProducts);
    const [localLoading, setLocalLoading] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [localSortBy, setLocalSortBy] = useState('new');
    const [localSelectedCategory, setLocalSelectedCategory] = useState('All');
    const [localPriceRange, setLocalPriceRange] = useState(50000);

    const currentProducts = products !== undefined ? products : localProducts;
    const currentLoading = loading !== undefined ? loading : localLoading;
    const currentSearchQuery = searchQuery !== undefined ? searchQuery : localSearchQuery;
    const currentSortBy = sortBy !== undefined ? sortBy : localSortBy;
    const currentSelectedCategory = selectedCategory !== undefined ? selectedCategory : localSelectedCategory;
    const currentPriceRange = priceRange !== undefined ? priceRange : localPriceRange;
    const currentCategories = categories !== undefined ? categories : localCategories;

    const changeSearchQuery = setSearchQuery || setLocalSearchQuery;
    const changeSortBy = setSortBy || setLocalSortBy;
    const changeSelectedCategory = setSelectedCategory || setLocalSelectedCategory;
    const changePriceRange = setPriceRange || setLocalPriceRange;

    useEffect(() => {
        if (products === undefined) {
            setLocalLoading(true);
            let filtered = [...mockProducts];
            if (currentSelectedCategory !== 'All') {
                filtered = filtered.filter(p => p.category === currentSelectedCategory);
            }
            filtered = filtered.filter(p => p.price <= currentPriceRange);
            if (currentSearchQuery.trim() !== '') {
                filtered = filtered.filter(p => p.title.toLowerCase().includes(currentSearchQuery.toLowerCase()));
            }
            setLocalProducts(filtered);
            setLocalLoading(false);
        }
    }, [currentSelectedCategory, currentPriceRange, currentSearchQuery, products]);

    return (
        <section className="py-12 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
            {data?.show_filters !== false && (
                <aside className="w-full lg:w-64 shrink-0">
                    <div className="sticky top-24 space-y-10">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Search</h3>
                            <input 
                                type="text"
                                placeholder="Search products..."
                                value={currentSearchQuery}
                                onChange={(e) => changeSearchQuery(e.target.value)}
                                className="w-full border-b border-border py-2 bg-transparent focus:outline-none focus:border-black text-sm"
                            />
                        </div>

                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Category</h3>
                            <div className="space-y-3">
                                {currentCategories.map(cat => (
                                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            name="category" 
                                            value={cat} 
                                            checked={currentSelectedCategory === cat}
                                            onChange={() => changeSelectedCategory(cat)}
                                            className="hidden"
                                        />
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${currentSelectedCategory === cat ? 'border-accent' : 'border-gray-300 group-hover:border-black'}`}>
                                            {currentSelectedCategory === cat && <div className="w-2 h-2 rounded-full bg-accent"></div>}
                                        </div>
                                        <span className={`text-sm transition-colors ${currentSelectedCategory === cat ? 'text-accent font-medium' : 'text-gray-500 group-hover:text-black'}`}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Max Price: ₹{currentPriceRange.toLocaleString('en-IN')}</h3>
                            <input 
                                type="range" 
                                min="1000" 
                                max="50000" 
                                step="1000" 
                                value={currentPriceRange} 
                                onChange={(e) => changePriceRange(Number(e.target.value))}
                                className="w-full accent-accent"
                            />
                        </div>
                    </div>
                </aside>
            )}

            <div className="flex-1">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
                    <span className="text-sm text-muted">Showing {currentProducts.length} Products</span>
                    <select 
                        value={currentSortBy}
                        onChange={(e) => changeSortBy(e.target.value)}
                        className="bg-transparent text-sm font-bold uppercase tracking-widest focus:outline-none cursor-pointer"
                    >
                        <option value="new">Newest Arrivals</option>
                        <option value="best_seller">Best Sellers</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                    </select>
                </div>

                {currentLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[3/4] bg-gray-200 rounded-sm mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded-md mb-2 w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : currentProducts.length === 0 ? (
                    <div className="text-center py-20 bg-bg rounded-sm border border-border">
                        <h3 className="text-2xl font-bold font-display text-fg mb-2">No pieces found.</h3>
                        <p className="text-muted">Adjust your filters to discover more.</p>
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${data?.columns || 3} gap-x-8 gap-y-12`}>
                        {currentProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export const RelatedProducts = ({ data }: { data?: any }) => {
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        async function fetchRelated() {
            const { data: prods } = await supabase.from('products').select('*').eq('status', 'Active').limit(3);
            if (prods) setProducts(prods);
        }
        fetchRelated();
    }, []);

    return (
        <section className="py-8 md:py-12 bg-bg border-t border-border">
            <div className="max-w-7xl mx-auto px-6">
                <h3 className="text-2xl md:text-3xl font-display text-center mb-12" dangerouslySetInnerHTML={{ __html: data?.headline || 'You May Also <span class="italic">Like</span>' }} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export const SECTION_REGISTRY: Record<string, { component: React.FC<any>, capabilities?: any }> = {
    'cinematic_hero': { component: CinematicHero, capabilities: { allowedMedia: ['video/mp4', 'image/jpeg', 'image/webp'], aspectRatios: { desktop: '16:9', mobile: 'full-bleed' } } },
    'featured_collections': { component: FeaturedCategories, capabilities: {} },
    'trending_slider': { component: BestSellersSlider, capabilities: {} },
    'brand_story': { component: BrandStory, capabilities: { allowedMedia: ['image/jpeg', 'image/webp'], aspectRatios: { desktop: '4:5', mobile: '4:5' } } },
    'instagram_feed': { component: InstagramFeed, capabilities: {} },
    'product_hero': { component: ProductHero, capabilities: {} },
    'collection_grid': { component: CollectionGrid, capabilities: {} },
    'related_products': { component: RelatedProducts, capabilities: {} }
};
