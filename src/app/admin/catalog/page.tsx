"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { generateRecommendation } from '@/lib/recommendationEngine';

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

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // NEW: Staged Updates State for local edits (Phase E)
    const [stagedUpdates, setStagedUpdates] = useState<Record<string, Partial<Product>>>({});
    const [stagedCollections, setStagedCollections] = useState<Record<string, Set<string>>>({});
    
    // NEW: Staged Telemetry Data
    const [telemetryQueue, setTelemetryQueue] = useState<any[]>([]);

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
            alert('Failed to load catalog data. Has the schema migration run?');
        } finally {
            setLoading(false);
        }
    };

    // Calculate fully classified products for the engine's training set
    const classifiedProducts = useMemo(() => {
        return products.filter(p => p.business_category && p.business_subcategory && p.fulfillment_model);
    }, [products]);

    // Handle local field change (No auto-save)
    const handleLocalUpdate = (productId: string, field: keyof Product, value: any) => {
        setStagedUpdates(prev => {
            const currentProductStaged = prev[productId] || {};
            const updatePayload: any = { ...currentProductStaged, [field]: value };
            
            // Auto-clear subcategory if category changes
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
        
        // Log the recommendation state for telemetry comparison later
        setTelemetryQueue(prev => {
            const next = [...prev.filter(t => t.productId !== productId)];
            next.push({
                productId,
                recommended_state: rec
            });
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
                
                // Update local products state
                setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updates } : p));
            }
            
            if (updatedCollections) {
                // Delete old, insert new
                await supabase.from('product_collections').delete().eq('product_id', productId);
                const inserts = Array.from(updatedCollections).map(cid => ({ product_id: productId, collection_id: cid }));
                if (inserts.length > 0) {
                    await supabase.from('product_collections').insert(inserts);
                }
                
                // Update local collections state
                setProductCollections(prev => ({ ...prev, [productId]: updatedCollections }));
            }
            
            // Handle Accuracy Telemetry
            const telemetry = telemetryQueue.find(t => t.productId === productId);
            if (telemetry) {
                const form_state = {
                    category: updates?.business_category !== undefined ? updates.business_category : products.find(p=>p.id===productId)?.business_category,
                    subcategory: updates?.business_subcategory !== undefined ? updates.business_subcategory : products.find(p=>p.id===productId)?.business_subcategory,
                    fulfillment: updates?.fulfillment_model !== undefined ? updates.fulfillment_model : products.find(p=>p.id===productId)?.fulfillment_model,
                    collections: updatedCollections || productCollections[productId] || new Set()
                };
                
                // Store telemetry event locally for script to read, or log to console
                console.log('AI Telemetry Logged:', {
                    productId,
                    accuracy: {
                        category: form_state.category === telemetry.recommended_state.category ? 'Accepted' : (form_state.category ? 'Modified' : 'Rejected'),
                        subcategory: form_state.subcategory === telemetry.recommended_state.subcategory ? 'Accepted' : (form_state.subcategory ? 'Modified' : 'Rejected'),
                        fulfillment: form_state.fulfillment === telemetry.recommended_state.fulfillment ? 'Accepted' : (form_state.fulfillment ? 'Modified' : 'Rejected')
                    }
                });
            }

            // Clear staged
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
        let halfSarees = 0;
        let sarees = 0;
        let lehengas = 0;
        let other = 0;
        
        const recommendations: {id: string, rec: any}[] = [];

        products.forEach(p => {
            if (!p.business_category || !p.business_subcategory || !p.fulfillment_model) {
                const rec = generateRecommendation(p, classifiedProducts, collections, productCollections);
                if (rec) {
                    recommendations.push({ id: p.id, rec });
                    if (rec.category === 'Half Sarees') halfSarees++;
                    else if (rec.category === 'Sarees') sarees++;
                    else if (rec.category === 'Lehengas') lehengas++;
                    else other++;
                }
            }
        });

        const confirmMsg = `AI recommends:\n${halfSarees} Half Sarees\n${sarees} Sarees\n${lehengas} Lehengas\n${other} Other\n\nApply these to local preview?`;
        if (confirm(confirmMsg)) {
            recommendations.forEach(({ id, rec }) => handleAcceptRecommendation(id, rec));
        }
    };

    const handleBulkSave = async () => {
        const productIdsToSave = new Set([...Object.keys(stagedUpdates), ...Object.keys(stagedCollections)]);
        if (productIdsToSave.size === 0) return;
        
        const confirmSave = confirm(`Are you sure you want to save changes for ${productIdsToSave.size} products?`);
        if (!confirmSave) return;

        // Perform parallel saves (for demonstration, keeping simple for-loop)
        for (const id of Array.from(productIdsToSave)) {
            await handleSaveProduct(id);
        }
        alert('Bulk save completed!');
    };

    if (loading) return <div className="p-8 text-center">Loading catalog...</div>;

    const stagedCount = Object.keys(stagedUpdates).length + Object.keys(stagedCollections).length;

    return (
        <div className="min-h-screen bg-bg p-8">
            <div className="max-w-screen-2xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-display italic">Catalog <span className="text-accent">Manager.</span></h1>
                        <p className="text-muted mt-2">Manually classify products. Staged changes require explicit save.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={handleBulkAcceptAll}
                            className="text-sm font-bold bg-accent/10 px-4 py-2 rounded-xl text-accent border border-accent/20 hover:bg-accent/20"
                        >
                            ✨ Auto-Fill Recommendations
                        </button>
                        {stagedCount > 0 && (
                            <button 
                                onClick={handleBulkSave}
                                className="text-sm font-bold bg-accent px-4 py-2 rounded-xl text-white hover:opacity-90 shadow-lg shadow-accent/20"
                            >
                                💾 Save {stagedCount} Pending Changes
                            </button>
                        )}
                        <div className="text-sm font-bold bg-surface px-4 py-2 rounded-xl text-accent">
                            {products.length} Products Loaded
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-black/5 overflow-hidden border border-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface text-muted uppercase tracking-widest text-xs border-b border-border">
                                <tr>
                                    <th className="p-4 font-bold">Product</th>
                                    <th className="p-4 font-bold">Classification</th>
                                    <th className="p-4 font-bold">Collections</th>
                                    <th className="p-4 font-bold">Business Controls</th>
                                    <th className="p-4 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {products.map(product => {
                                    const hasStaged = !!stagedUpdates[product.id] || !!stagedCollections[product.id];
                                    const isFullyClassified = product.business_category && product.business_subcategory && product.fulfillment_model;
                                    let recommendation: any = null;
                                    
                                    if (!isFullyClassified && !hasStaged) {
                                        recommendation = generateRecommendation(product, classifiedProducts, collections, productCollections);
                                    }

                                    return (
                                        <tr key={product.id} className={`transition-colors ${hasStaged ? 'bg-amber-50' : 'hover:bg-surface/50'}`}>
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
                                                        {hasStaged && <span className="text-xs text-amber-600 font-bold">Unsaved Changes</span>}
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
                                                            
                                                            <div className="text-[10px] text-blue-600/80 space-y-0.5">
                                                                {recommendation.reasoning.map((r: string, i: number) => <div key={i}>{r}</div>)}
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleAcceptRecommendation(product.id, recommendation)}
                                                            className="w-full mt-2 bg-blue-600 text-white text-xs font-bold py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                                                        >
                                                            Accept Suggestion
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                <div className={`flex flex-col gap-1 ${recommendation ? 'opacity-20 pointer-events-none' : ''}`}>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Category</label>
                                                    <select 
                                                        value={getDisplayValue(product.id, 'business_category') || ''}
                                                        onChange={(e) => handleLocalUpdate(product.id, 'business_category', e.target.value || null)}
                                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                                                    >
                                                        <option value="">Select Category</option>
                                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                
                                                <div className={`flex flex-col gap-1 ${recommendation ? 'opacity-20 pointer-events-none' : ''}`}>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Subcategory</label>
                                                    <select 
                                                        value={getDisplayValue(product.id, 'business_subcategory') || ''}
                                                        onChange={(e) => handleLocalUpdate(product.id, 'business_subcategory', e.target.value || null)}
                                                        disabled={!getDisplayValue(product.id, 'business_category')}
                                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent disabled:opacity-50"
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
                                                        value={getDisplayValue(product.id, 'fulfillment_model') || ''}
                                                        onChange={(e) => handleLocalUpdate(product.id, 'fulfillment_model', e.target.value || null)}
                                                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                                                    >
                                                        <option value="">Select Model</option>
                                                        {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                            </td>

                                            <td className="p-4 align-top w-64">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Marketing Collections</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {collections.map(c => {
                                                            const displayedCols = getDisplayCollections(product.id);
                                                            const isSelected = displayedCols.has(c.id);
                                                            return (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => handleLocalCollectionToggle(product.id, c.id, isSelected)}
                                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-colors border ${
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
                                                        <input type="checkbox" checked={getDisplayValue(product.id, 'is_featured') || false} onChange={(e) => handleLocalUpdate(product.id, 'is_featured', e.target.checked)} className="accent-accent w-4 h-4" />
                                                        <span className="text-xs font-bold text-fg group-hover:text-accent transition-colors">Featured</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={getDisplayValue(product.id, 'is_best_seller') || false} onChange={(e) => handleLocalUpdate(product.id, 'is_best_seller', e.target.checked)} className="accent-accent w-4 h-4" />
                                                        <span className="text-xs font-bold text-fg group-hover:text-accent transition-colors">Best Seller</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input type="checkbox" checked={getDisplayValue(product.id, 'is_new_arrival') || false} onChange={(e) => handleLocalUpdate(product.id, 'is_new_arrival', e.target.checked)} className="accent-accent w-4 h-4" />
                                                        <span className="text-xs font-bold text-fg group-hover:text-accent transition-colors">New Arrival</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group mt-2 pt-2 border-t border-border">
                                                        <input type="checkbox" checked={getDisplayValue(product.id, 'is_hidden') || false} onChange={(e) => handleLocalUpdate(product.id, 'is_hidden', e.target.checked)} className="accent-red-500 w-4 h-4" />
                                                        <span className="text-xs font-bold text-red-500 transition-colors">Hidden / Draft</span>
                                                    </label>
                                                </div>
                                            </td>

                                            <td className="p-4 align-top w-32 text-center">
                                                {hasStaged ? (
                                                    <button 
                                                        onClick={() => handleSaveProduct(product.id)}
                                                        disabled={saving[product.id]}
                                                        className="w-full bg-accent text-white font-bold text-xs px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
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
                </div>
            </div>
        </div>
    );
}
