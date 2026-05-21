"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    id,
                    sku,
                    title,
                    category,
                    price,
                    stock_quantity,
                    movement_velocity,
                    images
                `)
                .order('sku', { ascending: true });
            
            if (error) throw error;
            setProducts(data || []);
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    }

    const filteredProducts = products.filter(p => 
        p.sku?.toLowerCase().includes(search.toLowerCase()) || 
        p.title?.toLowerCase().includes(search.toLowerCase())
    );

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <div>
            <div className="content-header">
                <h1>Inventory Intelligence</h1>
                <p>Manage your product catalog, monitor stock levels and track movement velocity.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search SKU or Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border border-border rounded-lg text-sm w-64"
                    />
                </div>
                <button className="btn btn-primary" onClick={() => alert('Add product modal coming soon!')}>
                    <i className="fas fa-plus" style={{ marginRight: 8 }}></i> Add Product
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Loading inventory...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-box-open" style={{ fontSize: 64, marginBottom: 20, color: '#CBD5E1' }}></i>
                    <p>No products found.</p>
                </div>
            ) : (
                <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {filteredProducts.map(product => (
                        <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{product.sku}</span>
                                <span style={{ 
                                    background: product.movement_velocity === 'High' ? '#D1FAE5' : product.movement_velocity === 'Low' ? '#FEE2E2' : '#FEF3C7',
                                    color: product.movement_velocity === 'High' ? '#059669' : product.movement_velocity === 'Low' ? '#DC2626' : '#D97706',
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
                                }}>
                                    {product.movement_velocity} Velocity
                                </span>
                            </div>
                            
                            <div style={{ width: '100%', height: '200px', backgroundColor: '#F8FAFC', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
                                {product.images && product.images.length > 0 ? (
                                    <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                        <i className="fas fa-image" style={{ fontSize: '32px' }}></i>
                                    </div>
                                )}
                            </div>
                            
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', flexGrow: 1 }}>{product.title}</h3>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                                <div style={{ fontWeight: 'bold', color: '#0F172A' }}>{formatCurrency(product.price)}</div>
                                <div style={{ fontSize: '0.85rem', color: product.stock_quantity < 5 ? '#DC2626' : '#64748B', fontWeight: product.stock_quantity < 5 ? 700 : 400 }}>
                                    Stock: {product.stock_quantity}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
