"use client";

import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';

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
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
        <section className="py-12 md:py-20 px-6 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 xl:gap-24">
            
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex items-center justify-between pb-4 border-b border-border">
                <button 
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-fg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    Filter & Sort
                </button>
                <span className="text-xs font-medium text-muted tracking-widest uppercase">{currentProducts.length} Results</span>
            </div>

            {/* Sidebar Filters */}
            {data?.show_filters !== false && (
                <aside className={`fixed inset-0 z-50 bg-white transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileFiltersOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0 lg:w-64 xl:w-72 lg:shrink-0 lg:bg-transparent lg:z-auto`}>
                    
                    {/* Mobile Filter Header */}
                    <div className="lg:hidden flex items-center justify-between p-6 border-b border-border">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-fg">Filters</h2>
                        <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 -mr-2 text-muted hover:text-black">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="p-6 lg:p-0 h-full overflow-y-auto lg:overflow-visible lg:sticky lg:top-32 space-y-12 pb-32 lg:pb-0">
                        {/* Search */}
                        <div className="group">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-4 group-hover:text-black transition-colors">Search</h3>
                            <div className="relative">
                                <input 
                                    type="text"
                                    placeholder="Search pieces..."
                                    value={currentSearchQuery}
                                    onChange={(e) => changeSearchQuery(e.target.value)}
                                    className="w-full border-b border-border py-3 pl-8 bg-transparent focus:outline-none focus:border-black text-sm transition-colors"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-0 top-1/2 -translate-y-1/2 text-muted"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-5">Curations</h3>
                            <div className="space-y-4">
                                {currentCategories.map(cat => (
                                    <label key={cat} className="flex items-center gap-4 cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            name="category" 
                                            value={cat} 
                                            checked={currentSelectedCategory === cat}
                                            onChange={() => changeSelectedCategory(cat)}
                                            className="hidden"
                                        />
                                        <span className={`text-sm tracking-wide transition-colors ${currentSelectedCategory === cat ? 'text-black font-semibold' : 'text-gray-500 group-hover:text-black'}`}>{cat}</span>
                                        {currentSelectedCategory === cat && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black"></span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Max Price */}
                        <div>
                            <div className="flex justify-between items-end mb-5">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Max Price</h3>
                                <span className="text-xs font-medium tracking-wider">₹{currentPriceRange.toLocaleString('en-IN')}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1000" 
                                max="150000" 
                                step="1000" 
                                value={currentPriceRange} 
                                onChange={(e) => changePriceRange(Number(e.target.value))}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                        </div>
                        
                        {/* Mobile Sort */}
                        <div className="lg:hidden border-t border-border pt-8 mt-8">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-5">Sort By</h3>
                            <select 
                                value={currentSortBy}
                                onChange={(e) => changeSortBy(e.target.value)}
                                className="w-full bg-transparent border border-border p-4 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-black cursor-pointer appearance-none"
                            >
                                <option value="new">Newest Arrivals</option>
                                <option value="best_seller">Best Sellers</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Mobile View Results Button */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border">
                        <button 
                            onClick={() => setIsMobileFiltersOpen(false)}
                            className="w-full bg-black text-white h-14 font-bold text-xs uppercase tracking-widest"
                        >
                            View {currentProducts.length} Results
                        </button>
                    </div>
                </aside>
            )}

            <div className="flex-1">
                <div className="hidden lg:flex justify-between items-center mb-10 pb-6 border-b border-border">
                    <span className="text-xs font-medium text-muted tracking-widest uppercase">{currentProducts.length} Results</span>
                    <select 
                        value={currentSortBy}
                        onChange={(e) => changeSortBy(e.target.value)}
                        className="bg-transparent text-xs font-bold uppercase tracking-widest focus:outline-none cursor-pointer text-right appearance-none hover:text-black transition-colors"
                        style={{ textAlignLast: 'right' }}
                    >
                        <option value="new">Sort: Newest Arrivals</option>
                        <option value="best_seller">Sort: Best Sellers</option>
                        <option value="price_asc">Sort: Price (Low to High)</option>
                        <option value="price_desc">Sort: Price (High to Low)</option>
                    </select>
                </div>

                {currentLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="animate-pulse flex flex-col">
                                <div className="aspect-[3/4] bg-gray-100 rounded-sm mb-6"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4 mt-auto"></div>
                            </div>
                        ))}
                    </div>
                ) : currentProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-6"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <h3 className="text-2xl font-medium font-display text-fg mb-3">No curations match your criteria</h3>
                        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">We couldn't find any pieces matching your current filters. Please try adjusting your selections to discover more from our collection.</p>
                        <button 
                            onClick={() => {
                                changeSearchQuery('');
                                changeSelectedCategory('All');
                                changePriceRange(150000);
                            }}
                            className="mt-8 border-b border-black pb-1 text-xs font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${data?.columns || 3} xl:grid-cols-${(data?.columns || 3) === 3 ? 4 : data?.columns} gap-x-8 gap-y-16`}>
                        {currentProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
