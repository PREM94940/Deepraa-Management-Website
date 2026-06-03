"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

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
    const [bulkCategory, setBulkCategory] = useState('');
    const [bulkSubcategory, setBulkSubcategory] = useState('');
    const [bulkModel, setBulkModel] = useState('');
    const [bulkCollection, setBulkCollection] = useState('');
    const [isBulkSaving, setIsBulkSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch products
            const { data: pData, error: pError } = await supabase
                .from('products')
                .select('id, sku, title, images, business_category, business_subcategory, fulfillment_model, display_order, is_featured, is_best_seller, is_new_arrival, is_hidden, seo_title, seo_description, canonical_url')
                .eq('is_test_data', false)
                .order('created_at', { ascending: false });
                
            if (pError) throw pError;
            
            // Fetch collections
            const { data: cData, error: cError } = await supabase
                .from('collections')
                .select('id, name')
                .order('name');
                
            if (cError) throw cError;

            // Fetch product_collections join table
            const { data: pcData, error: pcError } = await supabase
                .from('product_collections')
                .select('product_id, collection_id');
                
            if (pcError && pcError.code !== '42P01') { 
                // Ignore 42P01 (table does not exist) in case migration hasn't run yet
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

    const handleUpdate = async (productId: string, field: keyof Product, value: any) => {
        setSaving(prev => ({ ...prev, [productId]: true }));
        try {
            const updatePayload: any = { [field]: value };
            
            // Auto-clear subcategory if category changes
            if (field === 'business_category') {
                updatePayload['business_subcategory'] = null;
                setProducts(prev => prev.map(p => p.id === productId ? { ...p, business_category: value, business_subcategory: null } : p));
            } else {
                setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: value } : p));
            }

            const { error } = await supabase.from('products').update(updatePayload).eq('id', productId);
            if (error) throw error;
        } catch (error) {
            console.error('Update error:', error);
            alert(`Failed to update ${field}.`);
            await fetchData(); // Revert on failure
        } finally {
            setSaving(prev => ({ ...prev, [productId]: false }));
        }
    };

    const handleCollectionToggle = async (productId: string, collectionId: string, currentStatus: boolean) => {
        setSaving(prev => ({ ...prev, [productId]: true }));
        try {
            if (currentStatus) {
                // Remove
                const { error } = await supabase.from('product_collections').delete().match({ product_id: productId, collection_id: collectionId });
                if (error) throw error;
                
                setProductCollections(prev => {
                    const next = { ...prev };
                    if (next[productId]) {
                        const newSet = new Set(next[productId]);
                        newSet.delete(collectionId);
                        next[productId] = newSet;
                    }
                    return next;
                });
            } else {
                // Add
                const { error } = await supabase.from('product_collections').insert({ product_id: productId, collection_id: collectionId });
                if (error) throw error;
                
                setProductCollections(prev => {
                    const next = { ...prev };
                    if (!next[productId]) next[productId] = new Set();
                    const newSet = new Set(next[productId]);
                    newSet.add(collectionId);
                    next[productId] = newSet;
                    return next;
                });
            }
        } catch (error) {
            console.error('Collection toggle error:', error);
            alert('Failed to update collections.');
        } finally {
            setSaving(prev => ({ ...prev, [productId]: false }));
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === products.length && products.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map(p => p.id)));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkApply = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkSaving(true);
        try {
            const updates: any = {};
            if (bulkCategory) updates.business_category = bulkCategory;
            if (bulkSubcategory) updates.business_subcategory = bulkSubcategory;
            if (bulkModel) updates.fulfillment_model = bulkModel;
            
            if (Object.keys(updates).length > 0) {
                const { error } = await supabase.from('products').update(updates).in('id', Array.from(selectedIds));
                if (error) throw new Error(`Products update failed: ${error.message || error.details || JSON.stringify(error)}`);
            }

            if (bulkCollection) {
                const inserts = Array.from(selectedIds).map(pid => ({ product_id: pid, collection_id: bulkCollection }));
                // Using ignoreDuplicates instead of onConflict string to prevent constraint resolution errors on composite PKs
                const { error } = await supabase.from('product_collections').upsert(inserts, { ignoreDuplicates: true });
                if (error) throw new Error(`Collections update failed: ${error.message || error.details || JSON.stringify(error)}`);
            }
            
            await fetchData();
            setSelectedIds(new Set());
            setBulkCategory('');
            setBulkSubcategory('');
            setBulkModel('');
            setBulkCollection('');
            alert('Bulk update applied successfully!');
        } catch (error: any) {
            console.error('Bulk update error:', error);
            alert(`Failed to apply bulk update: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsBulkSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading catalog...</div>;

    return (
        <div className="min-h-screen bg-bg p-8">
            <div className="max-w-screen-2xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-display italic">Catalog <span className="text-accent">Manager.</span></h1>
                        <p className="text-muted mt-2">Manually classify products. Changes auto-save instantly.</p>
                    </div>
                    <div className="text-sm font-bold bg-surface px-4 py-2 rounded-xl text-accent">
                        {products.length} Products Loaded
                    </div>
                </div>

                {selectedIds.size > 0 && (
                    <div className="bg-surface border border-accent rounded-xl p-4 flex flex-wrap items-center gap-4 sticky top-4 z-50 shadow-2xl">
                        <span className="font-bold text-sm text-accent">{selectedIds.size} Selected</span>
                        
                        <select value={bulkCategory} onChange={e => { setBulkCategory(e.target.value); setBulkSubcategory(''); }} className="bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
                            <option value="">Set Category...</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <select value={bulkSubcategory} onChange={e => setBulkSubcategory(e.target.value)} disabled={!bulkCategory} className="bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent disabled:opacity-50">
                            <option value="">Set Subcategory...</option>
                            {bulkCategory && SUBCATEGORIES[bulkCategory]?.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                        </select>

                        <select value={bulkModel} onChange={e => setBulkModel(e.target.value)} className="bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
                            <option value="">Set Model...</option>
                            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>

                        <select value={bulkCollection} onChange={e => setBulkCollection(e.target.value)} className="bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent">
                            <option value="">Add to Collection...</option>
                            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <button 
                            onClick={handleBulkApply} 
                            disabled={isBulkSaving || (!bulkCategory && !bulkModel && !bulkCollection)}
                            className="bg-accent text-white px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity ml-auto"
                        >
                            {isBulkSaving ? 'Applying...' : 'Apply Bulk Edit'}
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl shadow-black/5 overflow-hidden border border-border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface text-muted uppercase tracking-widest text-xs border-b border-border">
                                <tr>
                                    <th className="p-4 w-12 text-center border-r border-border/50">
                                        <input type="checkbox" checked={products.length > 0 && selectedIds.size === products.length} onChange={toggleSelectAll} className="accent-accent w-4 h-4 cursor-pointer" />
                                    </th>
                                    <th className="p-4 font-bold">Product</th>
                                    <th className="p-4 font-bold">Classification</th>
                                    <th className="p-4 font-bold">Collections</th>
                                    <th className="p-4 font-bold">Business Controls</th>
                                    <th className="p-4 font-bold">SEO</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {products.map(product => (
                                    <tr key={product.id} className={`transition-colors ${selectedIds.has(product.id) ? 'bg-accent/5' : 'hover:bg-surface/50'}`}>
                                        <td className="p-4 text-center border-r border-border/50 align-top">
                                            <input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} className="accent-accent w-4 h-4 cursor-pointer mt-2" />
                                        </td>
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
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="p-4 align-top w-72 space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Category</label>
                                                <select 
                                                    value={product.business_category || ''}
                                                    onChange={(e) => handleUpdate(product.id, 'business_category', e.target.value || null)}
                                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                                                >
                                                    <option value="">Select Category</option>
                                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Subcategory</label>
                                                <select 
                                                    value={product.business_subcategory || ''}
                                                    onChange={(e) => handleUpdate(product.id, 'business_subcategory', e.target.value || null)}
                                                    disabled={!product.business_category}
                                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent disabled:opacity-50"
                                                >
                                                    <option value="">Select Subcategory</option>
                                                    {product.business_category && SUBCATEGORIES[product.business_category]?.map(sc => (
                                                        <option key={sc} value={sc}>{sc}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Model</label>
                                                <select 
                                                    value={product.fulfillment_model || ''}
                                                    onChange={(e) => handleUpdate(product.id, 'fulfillment_model', e.target.value || null)}
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
                                                        const isSelected = productCollections[product.id]?.has(c.id) || false;
                                                        return (
                                                            <button
                                                                key={c.id}
                                                                onClick={() => handleCollectionToggle(product.id, c.id, isSelected)}
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
                                                    <input type="checkbox" checked={product.is_featured || false} onChange={(e) => handleUpdate(product.id, 'is_featured', e.target.checked)} className="accent-accent w-4 h-4" />
                                                    <span className="text-xs font-bold text-fg group-hover:text-accent transition-colors">Featured</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input type="checkbox" checked={product.is_best_seller || false} onChange={(e) => handleUpdate(product.id, 'is_best_seller', e.target.checked)} className="accent-accent w-4 h-4" />
                                                    <span className="text-xs font-bold text-fg group-hover:text-accent transition-colors">Best Seller</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input type="checkbox" checked={product.is_new_arrival || false} onChange={(e) => handleUpdate(product.id, 'is_new_arrival', e.target.checked)} className="accent-accent w-4 h-4" />
                                                    <span className="text-xs font-bold text-fg group-hover:text-accent transition-colors">New Arrival</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group mt-2 pt-2 border-t border-border">
                                                    <input type="checkbox" checked={product.is_hidden || false} onChange={(e) => handleUpdate(product.id, 'is_hidden', e.target.checked)} className="accent-red-500 w-4 h-4" />
                                                    <span className="text-xs font-bold text-red-500 transition-colors">Hidden / Draft</span>
                                                </label>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs font-bold text-muted w-16">Sort Order</span>
                                                    <input type="number" value={product.display_order || 0} onChange={(e) => handleUpdate(product.id, 'display_order', parseInt(e.target.value) || 0)} className="w-16 bg-surface border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-accent" />
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4 align-top w-64 space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">SEO Title</label>
                                                <input 
                                                    type="text"
                                                    value={product.seo_title || ''}
                                                    onChange={(e) => handleUpdate(product.id, 'seo_title', e.target.value)}
                                                    placeholder="Default product title used if empty"
                                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">SEO Description</label>
                                                <textarea 
                                                    value={product.seo_description || ''}
                                                    onChange={(e) => handleUpdate(product.id, 'seo_description', e.target.value)}
                                                    placeholder="Meta description"
                                                    rows={3}
                                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent resize-none"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Canonical URL</label>
                                                <input 
                                                    type="text"
                                                    value={product.canonical_url || ''}
                                                    onChange={(e) => handleUpdate(product.id, 'canonical_url', e.target.value)}
                                                    placeholder="https://deeprastore.com/..."
                                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
