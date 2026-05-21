"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ProductCard } from '@/components/ProductCard';
import { motion } from 'framer-motion';

export default function Collections() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('new');

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            let query = supabase.from('products').select('*');
            
            // Sorting
            if (sortBy === 'price_asc') {
                query = query.order('price', { ascending: true });
            } else if (sortBy === 'price_desc') {
                query = query.order('price', { ascending: false });
            } else if (sortBy === 'best_seller') {
                // Fake best sellers by ordering by movement_velocity
                query = query.order('movement_velocity', { ascending: false });
            } else {
                // New Collections
                query = query.order('sku', { ascending: false });
            }

            const { data, error } = await query;
            if (data) {
                let filteredData = data;

                // Category Filtering based on title/category matches (since shopify categories are long strings)
                if (filter === 'Sarees') {
                    filteredData = filteredData.filter(p => p.title?.toLowerCase().includes('saree') || p.category?.toLowerCase().includes('sari'));
                } else if (filter === 'Lehengas') {
                    filteredData = filteredData.filter(p => p.title?.toLowerCase().includes('lehenga') || p.category?.toLowerCase().includes('lehenga'));
                } else if (filter === 'Dresses') {
                    filteredData = filteredData.filter(p => p.title?.toLowerCase().includes('dress') || p.category?.toLowerCase().includes('dress'));
                } else if (filter === 'Jewellery') {
                    filteredData = filteredData.filter(p => p.title?.toLowerCase().includes('necklace') || p.title?.toLowerCase().includes('earring') || p.category?.toLowerCase().includes('jewel') || p.sku?.startsWith('SB'));
                } else if (filter === 'Fabric') {
                    filteredData = filteredData.filter(p => p.title?.toLowerCase().includes('fabric') || p.category?.toLowerCase().includes('fabric'));
                }

                // SKU/Title Search Filtering
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
    }, [filter, sortBy, searchQuery]);

    return (
        <main className="relative bg-surface">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-bold font-display mb-6 italic text-fg"
                    >
                        Our <span className="text-accent">Collections.</span>
                    </motion.h1>
                    <p className="text-muted text-lg max-w-2xl mx-auto">
                        Explore our curated selection of premium Indian fabrics, handcrafted sarees, and luxury ready-to-wear pieces.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        {['All', 'Sarees', 'Lehengas', 'Dresses', 'Jewellery', 'Fabric'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-5 py-2 rounded-full font-bold text-xs tracking-widest uppercase transition-all ${filter === cat ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'bg-white text-muted hover:bg-gray-50 border border-border'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search by Code or Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-accent w-full sm:w-64"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-3.5 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                        </div>
                        
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 rounded-xl border border-border bg-white text-sm font-bold text-fg focus:outline-none focus:border-accent w-full sm:w-auto"
                        >
                            <option value="new">New Collections</option>
                            <option value="best_seller">Best Sellers</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[3/4] bg-gray-200 rounded-2xl mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded-md mb-2 w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-border">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-fg mb-2">No products found.</h3>
                        <p className="text-muted mb-6">We couldn't find anything matching your filters or search.</p>
                        <button 
                            onClick={() => { setFilter('All'); setSearchQuery(''); }}
                            className="text-accent font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10"
                    >
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </motion.div>
                )}
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
