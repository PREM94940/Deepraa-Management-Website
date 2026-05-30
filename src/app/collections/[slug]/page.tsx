"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useStorefrontCMS } from '@/hooks/useStorefrontCMS';
import { CollectionGrid } from '@/themes/editorial_boutique/components/CollectionGrid';

export default function DynamicCollection({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const [collection, setCollection] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Parse global settings from useStorefrontCMS
    const { globalSettings, loading: cmsLoading } = useStorefrontCMS('collection');

    useEffect(() => {
        async function fetchCollection() {
            setLoading(true);
            try {
                // 1. Fetch collection details
                const { data: coll, error: collError } = await supabase
                    .from('collections')
                    .select('*')
                    .eq('slug', slug)
                    .maybeSingle();

                if (coll) {
                    setCollection(coll);
                    
                    // 2. Fetch products for this collection
                    if (coll.collection_type === 'smart') {
                        // Smart collection logic: fetch based on rules (tags)
                        const tags = coll.rules?.tags || [];
                        let query = supabase.from('products').select('*, categories(name, slug)');
                        
                        const { data: allProds } = await query;
                        if (allProds) {
                            const filtered = allProds.filter(p => {
                                const productTags = p.tags || [];
                                return tags.some((t: string) => productTags.includes(t));
                            });
                            setProducts(filtered);
                        }
                    } else {
                        // Manual collection logic: fetch mapping table order
                        const { data: mappedProds, error: mapError } = await supabase
                            .from('collection_products')
                            .select('position, products(*, categories(name, slug))')
                            .eq('collection_id', coll.id)
                            .order('position', { ascending: true });

                        if (mappedProds) {
                            const ordered = mappedProds
                                .filter(item => item.products)
                                .map(item => item.products);
                            setProducts(ordered);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching collection data:", err);
            } finally {
                setLoading(false);
            }
        }
        if (slug) {
            fetchCollection();
        }
    }, [slug]);

    return (
        <main className="relative bg-surface min-h-screen w-full pb-16 md:pb-0">
            <Navbar globalSettings={globalSettings} />
            
            {loading || cmsLoading ? (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-pulse text-xl font-bold italic font-display text-muted">Preparing your luxury curation...</div>
                </div>
            ) : !collection ? (
                <div className="py-32 text-center max-w-xl mx-auto px-6">
                    <h1 className="text-4xl font-display font-bold text-fg mb-4">Collection Not Found</h1>
                    <p className="text-muted mb-8 leading-relaxed">The collection you are looking for has either been archived or does not exist.</p>
                    <a href="/" className="px-8 py-3 bg-black text-white hover:bg-gold transition-colors text-xs font-bold uppercase tracking-widest">
                        Return to Homepage
                    </a>
                </div>
            ) : (
                <>
                    {/* Dynamic Collection Banner */}
                    {collection.banner_image && (
                        <div className="relative w-full h-[60vh] bg-black">
                            <img 
                                src={collection.banner_image} 
                                alt={collection.name} 
                                className="w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 md:p-16 max-w-[1600px] mx-auto">
                                <span className="text-[10px] text-white/60 uppercase tracking-[0.25em] mb-2 font-semibold">Luxury Curation</span>
                                <h1 className="text-white text-4xl md:text-6xl font-display font-light mb-4">{collection.name}</h1>
                                {collection.description && (
                                    <p className="text-gray-300 text-sm md:text-lg max-w-2xl font-light leading-relaxed mb-6">{collection.description}</p>
                                )}
                                {collection.whatsapp_cta && (
                                    <a 
                                        href={`https://wa.me/${globalSettings?.whatsapp_number || '919876543210'}?text=${encodeURIComponent(collection.whatsapp_cta)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs tracking-widest px-6 py-3.5 w-fit rounded-sm transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.63 2.021 14.155.998 11.536.998c-5.442 0-9.866 4.372-9.87 9.802 0 1.714.46 3.393 1.332 4.883l-.991 3.62 3.73-.974zm12.385-6.52c-.322-.16-.1.258-2.607-1.027a.64.64 0 0 0-.912.09c-.393.475-.765.95-.938 1.134-.173.186-.347.208-.67.047-.322-.16-1.36-.5-2.593-1.6-1.002-.894-1.63-2.03-1.83-2.33-.203-.306-.024-.471.138-.63.146-.144.323-.377.485-.567.16-.19.213-.323.32-.538.107-.215.053-.404-.027-.566-.08-.16-.765-1.844-1.05-2.528-.276-.662-.554-.572-.764-.582a6.13 6.13 0 0 0-.554-.012c-.19 0-.494.07-.754.354-.26.282-.993.97-1.93.97-.936 0-1.78-.962-1.94-1.127-.16-.165-.32-.204-.64-.043z"/></svg>
                                        Order via WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-[#FCFBF8]">
                        {/* Dynamically Styled Grid */}
                        <CollectionGrid 
                            data={collection.layout_settings || {}}
                            products={products}
                            loading={loading}
                            categories={['All']}
                        />
                    </div>
                </>
            )}
            
            <Footer globalSettings={globalSettings} />
            <CartDrawer />
            <MobileBottomNav />
        </main>
    );
}
