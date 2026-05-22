"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWishlistStore } from '@/store/useWishlistStore';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ProductCard } from '@/components/ProductCard';
import { motion } from 'framer-motion';

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

    return (
        <main className="relative bg-surface min-h-screen">
            <Navbar />
            
            {/* Header */}
            <div className="bg-bg py-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-bold font-display mb-6 italic text-fg"
                    >
                        The <span className="text-accent">Collection</span>
                    </motion.h1>
                    <p className="text-muted text-lg max-w-2xl mx-auto font-light">
                        Curated elegance for the modern Indian woman.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-64 shrink-0">
                    <div className="sticky top-24 space-y-10">
                        
                        {/* Search */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Search</h3>
                            <input 
                                type="text"
                                placeholder="Search SKUs or names..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border-b border-border py-2 bg-transparent focus:outline-none focus:border-black text-sm"
                            />
                        </div>

                        {/* Categories */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Category</h3>
                            <div className="space-y-3">
                                {categories.map(cat => (
                                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            name="category" 
                                            value={cat} 
                                            checked={selectedCategory === cat}
                                            onChange={() => setSelectedCategory(cat)}
                                            className="hidden"
                                        />
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedCategory === cat ? 'border-accent' : 'border-gray-300 group-hover:border-black'}`}>
                                            {selectedCategory === cat && <div className="w-2 h-2 rounded-full bg-accent"></div>}
                                        </div>
                                        <span className={`text-sm transition-colors ${selectedCategory === cat ? 'text-accent font-medium' : 'text-gray-500 group-hover:text-black'}`}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Range Slider */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Max Price: ₹{priceRange.toLocaleString('en-IN')}</h3>
                            <input 
                                type="range" 
                                min="1000" 
                                max="50000" 
                                step="1000" 
                                value={priceRange} 
                                onChange={(e) => setPriceRange(Number(e.target.value))}
                                className="w-full accent-accent"
                            />
                        </div>

                    </div>
                </aside>

                {/* Product Grid */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
                        <span className="text-sm text-muted">Showing {products.length} Products</span>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent text-sm font-bold uppercase tracking-widest focus:outline-none cursor-pointer"
                        >
                            <option value="new">Newest Arrivals</option>
                            <option value="best_seller">Best Sellers</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-pulse">
                                    <div className="aspect-[3/4] bg-gray-200 rounded-2xl mb-4"></div>
                                    <div className="h-6 bg-gray-200 rounded-md mb-2 w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 bg-bg rounded-3xl">
                            <h3 className="text-2xl font-bold font-display text-fg mb-2">No pieces found.</h3>
                            <p className="text-muted mb-6">Try adjusting your filters to discover more.</p>
                            <button 
                                onClick={() => { setSelectedCategory('All'); setPriceRange(50000); setSearchQuery(''); }}
                                className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-accent hover:border-accent transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
                        >
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
