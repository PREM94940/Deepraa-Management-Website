"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWishlistStore } from '@/store/useWishlistStore';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useStorefrontCMS } from '@/hooks/useStorefrontCMS';
import { SECTION_REGISTRY } from '@/registry/sections';

export default function Collections() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('new');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [priceRange, setPriceRange] = useState<number>(50000);
    
    const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore();

    const categories = ['All', 'Sarees', 'Lehengas', 'Dresses', 'Jewellery', 'Fabric'];

    const { sections, globalSettings, loading: cmsLoading } = useStorefrontCMS('collection');

    // Parse category from URL query parameters on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const cat = params.get('category');
            if (cat) {
                // Find matching category case insensitively
                const matched = categories.find(c => c.toLowerCase() === cat.toLowerCase());
                if (matched) {
                    setSelectedCategory(matched);
                }
            }
        }
    }, []);

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            let query = supabase.from('products').select('*').eq('status', 'Active');
            
            if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
            else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
            else if (sortBy === 'best_seller') query = query.order('movement_velocity', { ascending: false });
            else query = query.order('created_at', { ascending: false });

            const { data } = await query;
            if (data) {
                let filteredData = data;

                // Category
                if (selectedCategory !== 'All') {
                    filteredData = filteredData.filter(p => {
                        const t = p.title?.toLowerCase() || '';
                        const c = p.category?.toLowerCase() || '';
                        if (selectedCategory === 'Sarees') return t.includes('saree') || c.includes('sari');
                        if (selectedCategory === 'Lehengas') return t.includes('lehenga') || c.includes('lehenga');
                        if (selectedCategory === 'Dresses') return t.includes('dress') || c.includes('dress');
                        if (selectedCategory === 'Jewellery') return t.includes('necklace') || t.includes('earring') || c.includes('jewel') || p.sku?.startsWith('SB');
                        if (selectedCategory === 'Fabric') return t.includes('fabric') || c.includes('fabric');
                        return true;
                    });
                }

                // Price Slider (Filter products with price <= slider value)
                filteredData = filteredData.filter(p => p.price <= priceRange);

                // Search
                if (searchQuery.trim() !== '') {
                    const lowerQuery = searchQuery.toLowerCase().trim();
                    filteredData = filteredData.filter(p => 
                        p.sku?.toLowerCase().includes(lowerQuery) || 
                        p.title?.toLowerCase().includes(lowerQuery)
                    );
                }

                setProducts(filteredData);
            }
            setLoading(false);
        }
        fetchProducts();
    }, [selectedCategory, priceRange, sortBy, searchQuery]);

    if (cmsLoading) {
        return (
            <main className="min-h-screen bg-surface flex items-center justify-center">
                <div className="animate-pulse text-xl font-bold italic font-display text-muted">Preparing your luxury collection...</div>
            </main>
        );
    }

    return (
        <main className="relative bg-surface min-h-screen w-full">
            <Navbar globalSettings={globalSettings} />
            
            <div className="flex flex-col">
                {sections.length > 0 ? (
                    sections.map((section, idx) => {
                        const ComponentMap = SECTION_REGISTRY[section.type];
                        if (!ComponentMap) {
                            console.warn(`Unknown section type: ${section.type}`);
                            return null;
                        }
                        
                        const Component = ComponentMap.component;
                        
                        // Pass active state handlers to CollectionGrid dynamically
                        const extraProps = section.type === 'collection_grid' ? {
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
                        } : {};

                        // Visibility Controls
                        let visibilityClass = '';
                        if (section.settings?.visibility === 'desktop_only') visibilityClass = 'hidden md:block';
                        if (section.settings?.visibility === 'mobile_only') visibilityClass = 'block md:hidden';

                        // Spacing Controls
                        let spacingClass = '';
                        if (section.settings?.padding === 'none') spacingClass = '!py-0';
                        else if (section.settings?.padding === 'small') spacingClass = '!py-8 md:!py-12';
                        else if (section.settings?.padding === 'large') spacingClass = '!py-32 md:!py-48';

                        return (
                            <div key={idx} id={`section-${section.type}`} className={`${visibilityClass} ${spacingClass}`}>
                                <Component data={section.settings} {...extraProps} />
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center text-muted">No sections configured for this template.</div>
                )}
            </div>

            <Footer globalSettings={globalSettings} />
            <CartDrawer />
        </main>
    );
}
