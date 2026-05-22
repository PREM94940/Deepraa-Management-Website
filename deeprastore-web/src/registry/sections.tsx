import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/ProductCard';

export const CinematicHero = ({ data }: { data?: any }) => {
    return (
        <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden">
            <div className="absolute inset-0">
                <video 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    poster="https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=1200"
                    className="w-full h-full object-cover opacity-90 transition-opacity duration-1000"
                    style={{ objectPosition: data?.focal_point || 'center' }}
                    src="https://player.vimeo.com/external/494254644.hd.mp4?s=d703e73fb2a9dc6312a149c5e2efea5e0d473cf2&profile_id=175"
                ></video>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70"></div>
            </div>
            
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6 pt-20">
                <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-gold font-semibold tracking-[0.4em] uppercase text-xs md:text-sm mb-4 md:mb-6"
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
                    <Link href={data?.primary_cta_link || "/collections"} className="bg-white text-black px-10 py-4 text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-gold hover:text-white transition-all duration-300 w-full sm:w-auto">
                        {data?.primary_cta_text || "Shop The Look"}
                    </Link>
                    <Link href={data?.secondary_cta_link || "/custom-stitching"} className="bg-transparent border border-white text-white px-10 py-4 text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 w-full sm:w-auto">
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
        <section className="py-16 md:py-24 px-6 max-w-7xl mx-auto">
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
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105" />
                            {!data?.hide_text && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <div className="absolute bottom-6 left-6 pr-4">
                                        <h3 className={`text-white font-display font-light tracking-wide mb-2 ${getTextClass()} leading-tight`}>{cat.name}</h3>
                                        <span className="text-gold text-[10px] font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0 block">
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
            const mode = data?.mode || 'trending';
            switch (mode) {
                case 'new_arrivals':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'low_stock':
                    query = query.lt('inventory_count', 5).gt('inventory_count', 0).order('inventory_count', { ascending: true });
                    break;
                case 'ready_to_ship':
                    // Simulate checking a 'shipping_tier' or tag
                    query = query.contains('tags', ['ready_to_ship']);
                    break;
                case 'bridal':
                    query = query.eq('category', 'Bridal').order('created_at', { ascending: false });
                    break;
                case 'trending':
                default:
                    // Fallback to latest or a specific logic
                    query = query.order('created_at', { ascending: false });
                    break;
            }
            
            const { data: prods } = await query.limit(6);
            if (prods) setProducts(prods);
            setLoading(false);
        }
        fetchProducts();
    }, [data?.mode]);

    return (
        <section className="py-16 md:py-24 bg-bg overflow-hidden">
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
        <section className="py-16 md:py-32 px-6 bg-surface text-fg relative overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-0">
                <div className="w-full md:w-1/2 relative z-10 md:pr-12">
                    <div className="aspect-[4/5] overflow-hidden relative group">
                        <img 
                            src={data?.image_url || "https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=800"} 
                            alt="Brand Story" 
                            className="w-full h-full object-cover transition-transform duration-[10000ms] ease-linear group-hover:scale-110 origin-center" 
                            style={{ objectPosition: data?.focal_point || 'center' }}
                        />
                    </div>
                </div>
                <div className="w-full md:w-1/2 md:-ml-20 z-20 relative bg-surface/95 premium-blur p-8 md:p-16 border border-border/50 shadow-sm">
                    <span className="text-gold font-bold tracking-[0.3em] uppercase text-xs mb-6 block">{data?.tagline || 'The Deepra Journey'}</span>
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
        <section className="py-16 md:py-24">
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
                        <img src={img} alt="Social Feed" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export const ProductHero = ({ data, variant }: { data?: any, variant?: string }) => {
    return (
        <section className="py-12 md:py-24 px-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-12 border border-dashed border-gray-300 items-center justify-center bg-gray-50 min-h-[500px]">
            <div className="text-center">
                <h2 className="text-2xl font-bold font-display text-muted mb-2">Dynamic Product Hero Placeholder</h2>
                <p className="text-sm text-gray-400">In production, this automatically pulls context from /product/[slug]</p>
                {data?.layout && <p className="text-xs mt-4 text-gold font-bold uppercase">Layout: {data.layout}</p>}
            </div>
        </section>
    );
};

export const CollectionGrid = ({ data }: { data?: any }) => {
    return (
        <section className="py-16 px-6 max-w-7xl mx-auto border border-dashed border-gray-300 items-center justify-center bg-gray-50 min-h-[400px] flex flex-col">
            <div className="text-center">
                <h2 className="text-2xl font-bold font-display text-muted mb-2">Dynamic Collection Grid Placeholder</h2>
                <p className="text-sm text-gray-400">Automatically pulls products for the current category context</p>
                <p className="text-xs mt-4 text-gold font-bold uppercase">Columns: {data?.columns || 4} | Filters: {data?.show_filters ? 'Visible' : 'Hidden'}</p>
            </div>
        </section>
    );
};

export const RelatedProducts = ({ data }: { data?: any }) => {
    return (
        <section className="py-16 px-6 max-w-7xl mx-auto border border-dashed border-gray-300 items-center justify-center bg-gray-50 min-h-[300px] flex flex-col">
            <div className="text-center">
                <h2 className="text-2xl font-bold font-display text-muted mb-2">Related Products Placeholder</h2>
                <p className="text-sm text-gray-400">Displays cross-sells based on current product tags</p>
                <p className="text-xs mt-4 text-gold font-bold uppercase">Heading: {data?.headline || 'You May Also Like'}</p>
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
