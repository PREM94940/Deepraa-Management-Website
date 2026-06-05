"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { generateRecommendation } from '@/lib/recommendationEngine';
import { Search, Filter, SortAsc, ChevronLeft, ChevronRight } from 'lucide-react';

type Product = {
    id: string;
    sku: string;
    title: string;
    images: string[];
    business_category: string | null;
    business_subcategory: string | null;
    fulfillment_model: string | null;
    display_order: number;
    is_featured: boolean;
    is_best_seller: boolean;
    is_new_arrival: boolean;
    is_hidden: boolean;
    seo_title: string | null;
    seo_description: string | null;
    canonical_url: string | null;
    created_at?: string;
};

type Collection = {
    id: string;
    name: string;
};

const CATEGORIES = ['Half Sarees', 'Sarees', 'Lehengas', 'Dresses', 'Fabric'];
const SUBCATEGORIES: Record<string, string[]> = {
    'Half Sarees': ['Ready To Wear Half Sarees', 'Custom Made Half Sarees', 'Bridal Half Sarees', 'Kids Half Sarees'],
    'Sarees': ['Ready To Wear Sarees', 'Custom Sarees', 'Party Wear Sarees', 'Bridal Sarees'],
    'Lehengas': ['Bridal Lehengas', 'Party Wear Lehengas', 'Custom Lehengas'],
    'Dresses': ['Party Wear Dresses', 'Casual Dresses'],
    'Fabric': ['Unstitched Fabric', 'Premium Silks']
};
const MODELS = ['Ready To Ship', 'Custom Made', 'Made To Order'];

export default function AdminCatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [productCollections, setProductCollections] = useState<Record<string, Set<string>>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});

    // Staged Updates State for local edits (Phase E)
    const [stagedUpdates, setStagedUpdates] = useState<Record<string, Partial<Product>>>({});
    const [stagedCollections, setStagedCollections] = useState<Record<string, Set<string>>>({});
    
    // Staged Telemetry Data
    const [telemetryQueue, setTelemetryQueue] = useState<any[]>([]);

    // Filter, Sort, and Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [collectionFilter, setCollectionFilter] = useState('all');
    const [sortOption, setSortOption] = useState('date_desc');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Async Recommendations State to fix INP (Interaction to Next Paint) issue
    const [recommendations, setRecommendations] = useState<Record<string, any>>({});
    const [isComputingRecs, setIsComputingRecs] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: pData, error: pError } = await supabase
                .from('products')
                .select('*')
                .eq('is_test_data', false)
                .order('created_at', { ascending: false });
                
            if (pError) throw pError;
            
            const { data: cData, error: cError } = await supabase
                .from('collections')
                .select('id, name')
                .order('name');
                
            if (cError) throw cError;

            const { data: pcData, error: pcError } = await supabase
                .from('product_collections')
                .select('product_id, collection_id');
                
            if (pcError && pcError.code !== '42P01') { 
                throw pcError;
            }

            const pcMap: Record<string, Set<string>> = {};
            if (pcData) {
                pcData.forEach((row: any) => {
                    if (!pcMap[row.product_id]) pcMap[row.product_id] = new Set();
                    pcMap[row.product_id].add(row.collection_id);
                });
            }

            setProducts(pData as Product[] || []);
            setCollections(cData as Collection[] || []);
            setProductCollections(pcMap);
        } catch (error) {
            console.error('Error fetching catalog data:', error);
            alert('Failed to load catalog data.');
        } finally {
            setLoading(false);
        }
    };

    // Calculate fully classified products for the engine's training set
    const classifiedProducts = useMemo(() => {
        return products.filter(p => p.business_category && p.business_subcategory && p.fulfillment_model);
    }, [products]);

    // Handle local field change
    const handleLocalUpdate = (productId: string, field: keyof Product, value: any) => {
        setStagedUpdates(prev => {
            const currentProductStaged = prev[productId] || {};
            const updatePayload: any = { ...currentProductStaged, [field]: value };
            if (field === 'business_category') {
                updatePayload['business_subcategory'] = null;
            }
            return { ...prev, [productId]: updatePayload };
        });
    };

    const handleLocalCollectionToggle = (productId: string, collectionId: string, isCurrentlySelected: boolean) => {
        setStagedCollections(prev => {
            const currentSet = new Set(prev[productId] || productCollections[productId] || new Set());
            if (isCurrentlySelected) {
                currentSet.delete(collectionId);
            } else {
                currentSet.add(collectionId);
            }
            return { ...prev, [productId]: currentSet };
        });
    };

    const getDisplayValue = (productId: string, field: keyof Product) => {
        const product = products.find(p => p.id === productId);
        if (stagedUpdates[productId] && stagedUpdates[productId][field] !== undefined) {
            return stagedUpdates[productId][field];
        }
        return product ? product[field] : null;
    };

    const getDisplayCollections = (productId: string) => {
        if (stagedCollections[productId]) return stagedCollections[productId];
        return productCollections[productId] || new Set();
    };

    const handleAcceptRecommendation = (productId: string, rec: any) => {
        if (!rec) return;
        setTelemetryQueue(prev => {
            const next = [...prev.filter(t => t.productId !== productId)];
            next.push({ productId, recommended_state: rec });
            return next;
        });
        setStagedUpdates(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                business_category: rec.category,
                business_subcategory: rec.subcategory,
                fulfillment_model: rec.fulfillment
            }
        }));
        setStagedCollections(prev => ({
            ...prev,
            [productId]: rec.collections
        }));
    };

    const handleSaveProduct = async (productId: string) => {
        setSaving(prev => ({ ...prev, [productId]: true }));
        try {
            const updates = stagedUpdates[productId];
            const updatedCollections = stagedCollections[productId];
            
            if (updates && Object.keys(updates).length > 0) {
                const { error } = await supabase.from('products').update(updates).eq('id', productId);
                if (error) throw error;
                setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updates } : p));
            }
            
            if (updatedCollections) {
                await supabase.from('product_collections').delete().eq('product_id', productId);
                const inserts = Array.from(updatedCollections).map(cid => ({ product_id: productId, collection_id: cid }));
                if (inserts.length > 0) {
                    await supabase.from('product_collections').insert(inserts);
                }
                setProductCollections(prev => ({ ...prev, [productId]: updatedCollections }));
            }
            
            setStagedUpdates(prev => { const next = { ...prev }; delete next[productId]; return next; });
            setStagedCollections(prev => { const next = { ...prev }; delete next[productId]; return next; });
            
        } catch (error) {
            console.error('Update error:', error);
            alert(`Failed to save product.`);
        } finally {
            setSaving(prev => ({ ...prev, [productId]: false }));
        }
    };

    const handleBulkAcceptAll = () => {
        const recsToApply = Object.entries(recommendations)
            .filter(([id, rec]) => rec !== null && paginatedProducts.find(p => p.id === id))
            .map(([id, rec]) => ({ id, rec }));

        if (recsToApply.length === 0) {
            return alert(isComputingRecs ? "Still computing recommendations, please wait a second..." : "No AI recommendations available for the current page.");
        }
        
        if (confirm(`Apply AI recommendations to ${recsToApply.length} products on this page?`)) {
            recsToApply.forEach(({ id, rec }) => handleAcceptRecommendation(id, rec));
        }
    };

    const handleBulkSave = async () => {
        const productIdsToSave = new Set([...Object.keys(stagedUpdates), ...Object.keys(stagedCollections)]);
        if (productIdsToSave.size === 0) return;
        const confirmSave = confirm(`Are you sure you want to save changes for ${productIdsToSave.size} products?`);
        if (!confirmSave) return;
        for (const id of Array.from(productIdsToSave)) {
            await handleSaveProduct(id);
        }
        alert('Bulk save completed!');
    };

    // Filter and Sort Logic
    const processedProducts = useMemo(() => {
        let result = [...products];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => 
                (p.title && p.title.toLowerCase().includes(q)) || 
                (p.sku && p.sku.toLowerCase().includes(q))
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(p => {
                const isFullyClassified = p.business_category && p.business_subcategory && p.fulfillment_model;
                if (statusFilter === 'classified') return isFullyClassified;
                if (statusFilter === 'unclassified') return !isFullyClassified;
                return true;
            });
        }

        if (collectionFilter !== 'all') {
            result = result.filter(p => {
                const dbCols = productCollections[p.id] || new Set();
                return dbCols.has(collectionFilter);
            });
        }

        result.sort((a, b) => {
            if (sortOption === 'date_desc') return (b.created_at || '').localeCompare(a.created_at || '');
            if (sortOption === 'date_asc') return (a.created_at || '').localeCompare(b.created_at || '');
            if (sortOption === 'alpha_asc') return (a.title || '').localeCompare(b.title || '');
            if (sortOption === 'alpha_desc') return (b.title || '').localeCompare(a.title || '');
            if (sortOption === 'sku_asc') return (a.sku || '').localeCompare(b.sku || '');
            if (sortOption === 'sku_desc') return (b.sku || '').localeCompare(a.sku || '');
            return 0;
        });

        return result;
    }, [products, searchQuery, statusFilter, collectionFilter, sortOption, productCollections]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, collectionFilter, sortOption]);

    const totalPages = Math.ceil(processedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = processedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Compute recommendations asynchronously to prevent blocking the main thread (Fixes INP issue)
    useEffect(() => {
        let isMounted = true;
        
        const computeRecommendationsAsync = async () => {
            setIsComputingRecs(true);
            const newRecs: Record<string, any> = {};
            
            for (let i = 0; i < paginatedProducts.length; i++) {
                if (!isMounted) return;
                
                const p = paginatedProducts[i];
                const hasStaged = !!stagedUpdates[p.id] || !!stagedCollections[p.id];
                const isFullyClassified = p.business_category && p.business_subcategory && p.fulfillment_model;
                
                if (!isFullyClassified && !hasStaged) {
                    newRecs[p.id] = generateRecommendation(p, classifiedProducts, collections, productCollections);
                }
                
                // Yield to the main thread every 5 items to keep the UI perfectly responsive
                if (i % 5 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }
            
            if (isMounted) {
                setRecommendations(newRecs);
                setIsComputingRecs(false);
            }
        };

        computeRecommendationsAsync();
        
        return () => { isMounted = false; };
    }, [paginatedProducts, classifiedProducts, collections, productCollections, stagedUpdates, stagedCollections]);

    if (loading) return <div className="p-8 text-center">Loading catalog...</div>;

    const stagedCount = Object.keys(stagedUpdates).length + Object.keys(stagedCollections).length;

    return (
        <div className="min-h-screen bg-bg p-4 md:p-8">
            <div className="max-w-screen-2xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display italic">Catalog <span className="text-accent">Manager.</span></h1>
                        <p className="text-muted mt-2 text-sm">Manually classify products. Staged changes require explicit save.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={handleBulkAcceptAll}
                            disabled={isComputingRecs}
                            className="text-xs md:text-sm font-bold bg-accent/10 px-4 py-2 rounded-xl text-accent border border-accent/20 hover:bg-accent/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isComputingRecs ? (
                                <><span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></span> Computing...</>
                            ) : (
                                <>✨ Auto-Fill Page</>
                            )}
                        </button>
                        {stagedCount > 0 && (
                            <button 
                                onClick={handleBulkSave}
                                className="text-xs md:text-sm font-bold bg-accent px-4 py-2 rounded-xl text-white hover:opacity-90 shadow-lg shadow-accent/20 transition-all"
                            >
                                💾 Save {stagedCount} Pending
                            </button>
                        )}
                        <div className="text-xs md:text-sm font-bold bg-surface px-4 py-2 rounded-xl text-accent border border-border">
                            {products.length} Total
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-border flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full lg:w-96 flex-shrink-0">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input 
                            type="text" 
                            placeholder="Search by Title or SKU..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
                            <Filter className="w-4 h-4 text-muted" />
                            <select 
                                value={statusFilter} 
                                onChange={e => setStatusFilter(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-fg focus:outline-none cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="unclassified">Unclassified Only</option>
                                <option value="classified">Fully Classified</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
                            <select 
                                value={collectionFilter} 
                                onChange={e => setCollectionFilter(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-fg focus:outline-none cursor-pointer max-w-[150px] truncate"
                            >
                                <option value="all">All Collections</option>
                                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
                            <SortAsc className="w-4 h-4 text-muted" />
                            <select 
                                value={sortOption} 
                                onChange={e => setSortOption(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-fg focus:outline-none cursor-pointer"
                            >
                                <option value="date_desc">Newest First</option>
                                <option value="date_asc">Oldest First</option>
                                <option value="alpha_asc">Title A-Z</option>
                                <option value="alpha_desc">Title Z-A</option>
                                <option value="sku_asc">SKU A-Z</option>
                                <option value="sku_desc">SKU Z-A</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-black/5 overflow-hidden border border-border">
                    <div className="overflow-x-auto h-[65vh] overflow-y-auto relative">
                        <table className="w-full text-left text-sm relative">
                            <thead className="bg-surface text-muted uppercase tracking-widest text-xs border-b border-border sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="p-4 font-bold bg-surface">Product</th>
                                    <th className="p-4 font-bold bg-surface">Classification</th>
                                    <th className="p-4 font-bold bg-surface">Collections</th>
                                    <th className="p-4 font-bold bg-surface">Business Controls</th>
                                    <th className="p-4 font-bold text-center bg-surface">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {paginatedProducts.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted italic">No products found matching filters.</td></tr>
                                ) : paginatedProducts.map(product => {
                                    const hasStaged = !!stagedUpdates[product.id] || !!stagedCollections[product.id];
                                    const isFullyClassified = product.business_category && product.business_subcategory && product.fulfillment_model;
                                    let recommendation: any = recommendations[product.id] || null;

                                    return (
                                        <tr key={product.id} className={`transition-colors ${hasStaged ? 'bg-amber-50/50' : 'hover:bg-surface/50'}`}>
                                            <td className="p-4 align-top w-64">
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-20 bg-surface rounded-lg overflow-hidden border border-border flex-shrink-0 relative">
                                                        {product.images?.[0] ? (
                                                            <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted">No Img</div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-fg line-clamp-2">{product.title}</span>
                                                        <span className="text-xs text-muted font-mono">{product.sku || 'NO-SKU'}</span>
                                                        {saving[product.id] && <span className="text-xs text-accent-emerald font-bold animate-pulse">Saving...</span>}
                                                        {hasStaged && <span className="text-[10px] uppercase tracking-wider text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded w-fit">Unsaved Changes</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="p-4 align-top w-72 space-y-3 relative">
                                                {recommendation && (
                                                    <div className="absolute inset-0 z-10 bg-blue-50/95 border border-blue-200 rounded-lg p-3 m-2 flex flex-col justify-between shadow-sm">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">✨ AI Suggestion</span>
                                                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{recommendation.confidence}% Match</span>
                                                            </div>
                                                            <div className="text-xs text-blue-900 mb-1"><span className="opacity-70">Category:</span> <b>{recommendation.category}</b></div>
                                                            <div className="text-xs text-blue-900 mb-1"><span className="opacity-70">Subcat:</span> <b>{recommendation.subcategory || '?'}</b></div>
                                                            <div className="text-xs text-blue-900 mb-2"><span className="opacity-70">Model:</span> <b>{recommendation.fulfillment}</b></div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleAcceptRecommendation(product.id, recommendation)}
                                                            className="w-full mt-2 bg-blue-600 text-white text-xs font-bold py-1.5 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                                                        >
                                                            Accept Suggestion
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                <div className={`flex flex-col gap-1 ${recommendation ? 'opacity-20 pointer-events-none' : ''}`}>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Category</label>
                                                    <select 
                                                        value={(getDisplayValue(product.id, 'business_category') as string) || ''}
                                                        onChange={(e) => handleLocalUpdate(product.id, 'business_category', e.target.value || null)}
                                                        className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
                                                    >
                                                        <option value="">Select Category</option>
                                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                
                                                <div className={`flex flex-col gap-1 ${recommendation ? 'opacity-20 pointer-events-none' : ''}`}>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Subcategory</label>
                                                    <select 
                                                        value={(getDisplayValue(product.id, 'business_subcategory') as string) || ''}
                                                        onChange={(e) => handleLocalUpdate(product.id, 'business_subcategory', e.target.value || null)}
                                                        disabled={!getDisplayValue(product.id, 'business_category')}
                                                        className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent disabled:opacity-50"
                                                    >
                                                        <option value="">Select Subcategory</option>
                                                        {getDisplayValue(product.id, 'business_category') && SUBCATEGORIES[getDisplayValue(product.id, 'business_category') as string]?.map(sc => (
                                                            <option key={sc} value={sc}>{sc}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className={`flex flex-col gap-1 ${recommendation ? 'opacity-20 pointer-events-none' : ''}`}>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Model</label>
                                                    <select 
                                                        value={(getDisplayValue(product.id, 'fulfillment_model') as string) || ''}
                                                        onChange={(e) => handleLocalUpdate(product.id, 'fulfillment_model', e.target.value || null)}
                                                        className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
                                                    >
                                                        <option value="">Select Model</option>
                                                        {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                            </td>

                                            <td className="p-4 align-top w-64">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Marketing Collections</label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {collections.map(c => {
                                                            const displayedCols = getDisplayCollections(product.id);
                                                            const isSelected = displayedCols.has(c.id);
                                                            return (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => handleLocalCollectionToggle(product.id, c.id, isSelected)}
                                                                    className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider transition-colors border ${
                                                                        isSelected 
                                                                            ? 'bg-accent/10 border-accent text-accent' 
                                                                            : 'bg-surface border-border text-muted hover:border-accent/50'
                                                                    }`}
                                                                >
                                                                    {c.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4 align-top space-y-3 w-48">
                                                <div className="flex flex-col gap-2">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={!!getDisplayValue(product.id, 'is_featured')} onChange={(e) => handleLocalUpdate(product.id, 'is_featured', e.target.checked)} className="accent-accent w-4 h-4 rounded" />
                                                        <span className="text-xs font-bold text-fg group-hover:text-accent transition-colors">Featured</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={!!getDisplayValue(product.id, 'is_best_seller')} onChange={(e) => handleLocalUpdate(product.id, 'is_best_seller', e.target.checked)} className="accent-accent w-4 h-4 rounded" />
                                                        <span className="text-xs font-bold text-fg group-hover:text-accent transition-colors">Best Seller</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={!!getDisplayValue(product.id, 'is_new_arrival')} onChange={(e) => handleLocalUpdate(product.id, 'is_new_arrival', e.target.checked)} className="accent-accent w-4 h-4 rounded" />
                                                        <span className="text-xs font-bold text-fg group-hover:text-accent transition-colors">New Arrival</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group mt-2 pt-2 border-t border-border">
                                                        <input type="checkbox" checked={!!getDisplayValue(product.id, 'is_hidden')} onChange={(e) => handleLocalUpdate(product.id, 'is_hidden', e.target.checked)} className="accent-red-500 w-4 h-4 rounded" />
                                                        <span className="text-xs font-bold text-red-500 transition-colors">Hidden / Draft</span>
                                                    </label>
                                                </div>
                                            </td>

                                            <td className="p-4 align-top w-32 text-center">
                                                {hasStaged ? (
                                                    <button 
                                                        onClick={() => handleSaveProduct(product.id)}
                                                        disabled={saving[product.id]}
                                                        className="w-full bg-accent text-white font-bold text-xs px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 shadow-sm"
                                                    >
                                                        {saving[product.id] ? 'Saving...' : '💾 Save'}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-muted font-bold block mt-2">Up to date</span>
                                                )}
                                                {hasStaged && (
                                                    <button 
                                                        onClick={() => {
                                                            setStagedUpdates(prev => { const next = {...prev}; delete next[product.id]; return next; });
                                                            setStagedCollections(prev => { const next = {...prev}; delete next[product.id]; return next; });
                                                        }}
                                                        className="w-full text-muted hover:text-red-500 font-bold text-[10px] uppercase tracking-wider mt-2 transition-colors"
                                                    >
                                                        Discard
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="bg-surface border-t border-border p-4 flex items-center justify-between">
                            <span className="text-xs text-muted font-semibold">
                                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, processedProducts.length)} of {processedProducts.length} entries
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="p-1.5 rounded-lg border border-border bg-white text-fg disabled:opacity-50 hover:bg-surface transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-bold flex items-center px-2">Page {currentPage} of {totalPages}</span>
                                <button 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="p-1.5 rounded-lg border border-border bg-white text-fg disabled:opacity-50 hover:bg-surface transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
