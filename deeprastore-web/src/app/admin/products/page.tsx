"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { LayoutGrid, List as ListIcon, Plus, Edit, Copy, Check, X, Search, Save, XCircle } from 'lucide-react';

// Using partial to allow for new products without ID
type EditableProduct = Partial<Product> & { id?: string };

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    // View state
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [categoryFilter, setCategoryFilter] = useState('All');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Inline stock editing
    const [inlineStock, setInlineStock] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    }

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    // Filter and Sort
    let filteredProducts = products.filter(p => {
        const matchesSearch = p.sku?.toLowerCase().includes(search.toLowerCase()) || p.title?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-asc') filteredProducts.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') filteredProducts.sort((a, b) => b.price - a.price);
    if (sortBy === 'stock-asc') filteredProducts.sort((a, b) => (a.stock_quantity || 0) - (b.stock_quantity || 0));
    if (sortBy === 'newest') filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    async function handleSaveStock(id: string) {
        if (inlineStock[id] === undefined) return;
        try {
            const { error } = await supabase.from('products').update({ stock_quantity: inlineStock[id] }).eq('id', id);
            if (error) throw error;
            // Update local state
            setProducts(products.map(p => p.id === id ? { ...p, stock_quantity: inlineStock[id] } : p));
            
            // clear inline state
            const newInline = { ...inlineStock };
            delete newInline[id];
            setInlineStock(newInline);
        } catch (err: any) {
            alert('Failed to update stock: ' + err.message);
        }
    }

    function openModal(product: EditableProduct | null = null) {
        if (product) {
            setEditingProduct({ ...product });
        } else {
            setEditingProduct({
                title: '',
                sku: '',
                price: 0,
                description: '',
                category: '',
                status: 'Active',
                stock_quantity: 0,
                movement_velocity: 'Normal',
                images: []
            });
        }
        setIsModalOpen(true);
    }

    function duplicateProduct(product: Product) {
        const copy: any = { ...product };
        delete copy.id;
        delete copy.created_at;
        copy.sku = `${copy.sku || 'SKU'}-COPY`;
        copy.title = `${copy.title} (Copy)`;
        openModal(copy);
    }

    async function handleSaveProduct(e: React.FormEvent) {
        e.preventDefault();
        if (!editingProduct) return;
        setSaving(true);
        try {
            if (editingProduct.id) {
                // Update
                const { id, created_at, ...updateData } = editingProduct as any;
                const { error } = await supabase.from('products').update(updateData).eq('id', id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase.from('products').insert([editingProduct]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (err: any) {
            alert('Error saving product: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    const updateField = (field: keyof EditableProduct, value: any) => {
        if (editingProduct) {
            setEditingProduct({ ...editingProduct, [field]: value });
        }
    };

    return (
        <div>
            <div className="content-header">
                <h1>Inventory Intelligence</h1>
                <p>Manage your product catalog, monitor stock levels and track movement velocity.</p>
            </div>

            {/* Controls Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="relative" style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0 12px', background: '#FFF' }}>
                        <Search size={16} color="#94A3B8" />
                        <input 
                            type="text" 
                            placeholder="Search SKU or Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: '8px', border: 'none', outline: 'none', width: '200px', fontSize: '0.9rem' }}
                        />
                    </div>

                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="btn btn-outline" style={{ background: '#FFF' }}>
                        {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="btn btn-outline" style={{ background: '#FFF' }}>
                        <option value="newest">Newest First</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="stock-asc">Stock: Low to High</option>
                    </select>

                    <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '4px' }}>
                        <button 
                            onClick={() => setViewMode('grid')} 
                            style={{ padding: '6px 10px', borderRadius: '6px', background: viewMode === 'grid' ? '#FFF' : 'transparent', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <LayoutGrid size={18} color={viewMode === 'grid' ? '#8B5CF6' : '#64748B'} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')} 
                            style={{ padding: '6px 10px', borderRadius: '6px', background: viewMode === 'list' ? '#FFF' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <ListIcon size={18} color={viewMode === 'list' ? '#8B5CF6' : '#64748B'} />
                        </button>
                    </div>
                </div>

                <button className="btn btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Add Product
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Loading inventory...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                    <p>No products found matching your criteria.</p>
                </div>
            ) : viewMode === 'grid' ? (
                // GRID VIEW
                <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {filteredProducts.map(product => (
                        <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{product.sku || 'NO-SKU'}</span>
                                <span style={{ 
                                    background: product.movement_velocity === 'High' ? '#D1FAE5' : product.movement_velocity === 'Low' ? '#FEE2E2' : '#FEF3C7',
                                    color: product.movement_velocity === 'High' ? '#059669' : product.movement_velocity === 'Low' ? '#DC2626' : '#D97706',
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
                                }}>
                                    {product.movement_velocity || 'Normal'}
                                </span>
                            </div>
                            
                            <div style={{ width: '100%', height: '200px', backgroundColor: '#F8FAFC', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
                                {product.images && product.images.length > 0 ? (
                                    <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                        No Image
                                    </div>
                                )}
                            </div>
                            
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', flexGrow: 1 }}>{product.title}</h3>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #E2E8F0', marginBottom: '12px' }}>
                                <div style={{ fontWeight: 'bold', color: '#0F172A' }}>{formatCurrency(product.price)}</div>
                                <div style={{ fontSize: '0.85rem', color: (product.stock_quantity || 0) < 5 ? '#DC2626' : '#64748B', fontWeight: (product.stock_quantity || 0) < 5 ? 700 : 400 }}>
                                    Stock: {product.stock_quantity || 0}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => openModal(product)} className="btn btn-outline" style={{ flex: 1, padding: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <Edit size={14} /> Edit
                                </button>
                                <button onClick={() => duplicateProduct(product)} className="btn btn-outline" style={{ flex: 1, padding: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <Copy size={14} /> Copy
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // LIST VIEW
                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', minWidth: '800px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Image</th>
                                <th>SKU</th>
                                <th>Product Details</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock (Quick Edit)</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product.id}>
                                    <td>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#F1F5F9', overflow: 'hidden' }}>
                                            {product.images && product.images.length > 0 && (
                                                <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>{product.sku || '--'}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{product.title}</div>
                                    </td>
                                    <td>{product.category || '--'}</td>
                                    <td style={{ fontWeight: 600 }}>{formatCurrency(product.price)}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input 
                                                type="number" 
                                                value={inlineStock[product.id] !== undefined ? inlineStock[product.id] : (product.stock_quantity || 0)}
                                                onChange={(e) => setInlineStock({...inlineStock, [product.id]: Number(e.target.value)})}
                                                style={{ width: '70px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                                            />
                                            {inlineStock[product.id] !== undefined && inlineStock[product.id] !== (product.stock_quantity || 0) && (
                                                <button onClick={() => handleSaveStock(product.id)} style={{ background: '#10B981', color: '#FFF', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
                                                    Save
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ 
                                            background: product.status === 'Active' ? '#D1FAE5' : product.status === 'Draft' ? '#F1F5F9' : '#FEE2E2',
                                            color: product.status === 'Active' ? '#059669' : product.status === 'Draft' ? '#475569' : '#DC2626',
                                            padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                                        }}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => openModal(product)} className="btn btn-outline btn-sm" title="Edit"><Edit size={14} /></button>
                                            <button onClick={() => duplicateProduct(product)} className="btn btn-outline btn-sm" title="Duplicate"><Copy size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PRODUCT MODAL */}
            {isModalOpen && editingProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#FFF', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} color="#64748B" />
                        </button>
                        
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
                            {editingProduct.id ? 'Edit Product' : 'Create New Product'}
                        </h2>

                        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Row 1 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Product Title *</label>
                                    <input required type="text" value={editingProduct.title || ''} onChange={e => updateField('title', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>SKU</label>
                                    <input type="text" value={editingProduct.sku || ''} onChange={e => updateField('sku', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Price (₹) *</label>
                                    <input required type="number" value={editingProduct.price || 0} onChange={e => updateField('price', Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Stock Quantity</label>
                                    <input type="number" value={editingProduct.stock_quantity || 0} onChange={e => updateField('stock_quantity', Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Category</label>
                                    <input type="text" value={editingProduct.category || ''} onChange={e => updateField('category', e.target.value)} placeholder="e.g. Sarees, Lehengas" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                </div>
                            </div>

                            {/* Row 3 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Status</label>
                                    <select value={editingProduct.status || 'Active'} onChange={e => updateField('status', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <option value="Active">Active</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Out of Stock">Out of Stock</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Movement Velocity</label>
                                    <select value={editingProduct.movement_velocity || 'Normal'} onChange={e => updateField('movement_velocity', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <option value="High">High Velocity (Fast Mover)</option>
                                        <option value="Normal">Normal Velocity</option>
                                        <option value="Low">Low Velocity (Slow Mover)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Image URLs (comma separated)</label>
                                <textarea 
                                    rows={3}
                                    value={(editingProduct.images || []).join(', ')} 
                                    onChange={e => updateField('images', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', fontFamily: 'monospace' }} 
                                />
                                {editingProduct.images && editingProduct.images.length > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto' }}>
                                        {editingProduct.images.map((img, i) => (
                                            <div key={i} style={{ width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Description</label>
                                <textarea 
                                    rows={5}
                                    value={editingProduct.description || ''} 
                                    onChange={e => updateField('description', e.target.value)} 
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} 
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Save size={16} /> {saving ? 'Saving...' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
