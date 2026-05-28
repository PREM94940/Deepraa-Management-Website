"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { LayoutGrid, List as ListIcon, Plus, Edit, Copy, Check, X, Search, Save, Upload, Download, ImageIcon, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { upsertProductAction, updateStockAction, processProductChunkAction } from '@/lib/actions/products';

type EditableProduct = Partial<Product> & { id?: string };

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 50;
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [userRole] = useState<'Manager' | 'Staff'>(process.env.NEXT_PUBLIC_SIMULATE_ROLE as any || 'Manager');
    
    // View state
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [categoryFilter, setCategoryFilter] = useState('All');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [csvUploading, setCsvUploading] = useState(false);
    const [importStats, setImportStats] = useState<{
        total: number, success: number, failed: number, skipped: number, errors: any[], chunkIndex: number
    } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);

    // Inline stock editing
    const [inlineStock, setInlineStock] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchProducts(false);
    }, []);

    useEffect(() => {
        const channel = supabase.channel('realtime_products')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload) => {
                setProducts(prev => [payload.new as Product, ...prev]);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
                setProducts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, (payload) => {
                setProducts(prev => prev.filter(p => p.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchProducts(isLoadMore = false) {
        if (!isLoadMore) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        try {
            console.log("[FRONTEND-DEBUG] fetchProducts starting. Checking session...");
            
            // Add a timeout to session fetch to see if auth hangs
            const sessionPromise = supabase.auth.getSession();
            const sessionTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase auth.getSession() timed out after 5s")), 5000));
            
            await Promise.race([sessionPromise, sessionTimeout]);
            
            console.log("[FRONTEND-DEBUG] Session checked. Fetching products...");
            
            const currentPage = isLoadMore ? page + 1 : 0;
            const from = currentPage * pageSize;
            const to = from + pageSize - 1;

            // Add a timeout to the actual fetch
            const fetchPromise = supabase.from('products').select('*')
                .order('created_at', { ascending: false })
                .range(from, to);
                
            const fetchTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase products fetch timed out after 10s")), 10000));
            
            const response = await Promise.race([fetchPromise, fetchTimeout]) as any;
            
            console.log("[FRONTEND-DEBUG] Fetch complete. Response:", response);
            
            if (response.error) throw response.error;
            const newData = response.data || [];
            
            if (isLoadMore) {
                setProducts(prev => [...prev, ...newData]);
            } else {
                setProducts(newData);
            }
            
            setHasMore(newData.length === pageSize);
            setPage(currentPage);
            setErrorMsg(null);
        } catch (err: any) {
            console.error("[FRONTEND-DEBUG] Error fetching products:", err);
            setErrorMsg(`Debug Error: ${err.message}`);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    let filteredProducts = products.filter(p => {
        const skuStr = p.sku ? p.sku.toLowerCase() : '';
        const titleStr = p.title ? p.title.toLowerCase() : '';
        const matchesSearch = skuStr.includes(search.toLowerCase()) || titleStr.includes(search.toLowerCase());
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
            const res = await updateStockAction(id, inlineStock[id]);
            if (!res.success) throw new Error(res.error);
            setProducts(products.map(p => p.id === id ? { ...p, stock_quantity: inlineStock[id] } : p));
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
                compare_at_price: 0,
                description: '',
                category: 'Half Sarees',
                sub_category: 'Ready wear',
                status: 'Active',
                stock_quantity: 0,
                movement_velocity: 'Normal',
                images: [],
                is_customizable: false,
                available_sizes: [],
                allow_backorders: false,
                video_link: ''
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
            const res = await upsertProductAction(editingProduct as any);
            if (!res.success) throw new Error(res.error);
            setIsModalOpen(false);
            fetchProducts(false);
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploadingImage(true);
        
        try {
            const newImageUrls = [];
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const filePath = `product-uploads/${fileName}`;

                const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
                newImageUrls.push(data.publicUrl);
            }
            
            updateField('images', [...(editingProduct?.images || []), ...newImageUrls]);
        } catch (error: any) {
            alert('Image upload failed: ' + error.message);
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const toggleSize = (size: string) => {
        const currentSizes = editingProduct?.available_sizes || [];
        if (currentSizes.includes(size)) {
            updateField('available_sizes', currentSizes.filter(s => s !== size));
        } else {
            updateField('available_sizes', [...currentSizes, size]);
        }
    };

    const handleExportCSV = () => {
        const csv = Papa.unparse(products);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'deeprastore_products.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvUploading(true);
        setImportStats({ total: 0, success: 0, failed: 0, skipped: 0, errors: [], chunkIndex: 0 });

        let currentStats = { total: 0, success: 0, failed: 0, skipped: 0, errors: [] as any[], chunkIndex: 0 };
        let chunkBuffer: any[] = [];
        const CHUNK_SIZE = 50;

        const processBuffer = async () => {
            if (chunkBuffer.length === 0) return;
            const res = await processProductChunkAction(chunkBuffer, currentStats.chunkIndex);
            
            if (res.success) {
                currentStats.success += res.successCount || 0;
                currentStats.failed += (res.failedRows || []).length;
                currentStats.skipped += res.skippedDuplicates || 0;
                currentStats.errors = [...currentStats.errors, ...(res.failedRows || [])];
            } else {
                currentStats.failed += chunkBuffer.length;
                currentStats.errors.push({ sku: 'CHUNK_FAIL', error: res.error });
            }
            
            currentStats.chunkIndex++;
            setImportStats({ ...currentStats });
            chunkBuffer = []; // clear buffer
        };

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            chunk: async (results, parser) => {
                parser.pause(); // Pause streaming
                
                for (const row of results.data as any[]) {
                    currentStats.total++;
                    const productData = {
                        sku: row.sku,
                        title: row.title,
                        description: row.description || '',
                        price: parseFloat(row.price) || 0,
                        compare_at_price: parseFloat(row.compare_at_price) || 0,
                        category: row.category || '',
                        sub_category: row.sub_category || '',
                        status: row.status || 'Active',
                        stock_quantity: parseInt(row.stock_quantity) || 0,
                        movement_velocity: row.movement_velocity || 'Normal',
                        is_customizable: row.is_customizable === 'true' || row.is_customizable === 'TRUE',
                        allow_backorders: row.allow_backorders === 'true' || row.allow_backorders === 'TRUE',
                        video_link: row.video_link || '',
                        images: row.images ? (typeof row.images === 'string' ? row.images.split(',').map((s:string) => s.trim()) : row.images) : [],
                        available_sizes: row.available_sizes ? (typeof row.available_sizes === 'string' ? row.available_sizes.split(',').map((s:string) => s.trim()) : row.available_sizes) : []
                    };
                    chunkBuffer.push(productData);

                    if (chunkBuffer.length >= CHUNK_SIZE) {
                        await processBuffer();
                    }
                }
                
                parser.resume(); // Resume streaming
            },
            complete: async () => {
                // Process any remaining rows
                if (chunkBuffer.length > 0) {
                    await processBuffer();
                }
                setCsvUploading(false);
                fetchProducts(false);
                if (csvInputRef.current) csvInputRef.current.value = '';
            },
            error: (error) => {
                alert('CSV Parse Error: ' + error.message);
                setCsvUploading(false);
                if (csvInputRef.current) csvInputRef.current.value = '';
            }
        });
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {userRole === 'Manager' && (
                        <>
                            <input type="file" accept=".csv" ref={csvInputRef} style={{ display: 'none' }} onChange={handleImportCSV} />
                            <button className="btn btn-outline" disabled={csvUploading} onClick={() => csvInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Upload size={16} /> {csvUploading ? 'Importing...' : 'Import CSV'}
                            </button>
                        </>
                    )}
                    <button className="btn btn-outline" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={16} /> Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> Add Product
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Loading inventory...</div>
            ) : errorMsg ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626', background: '#FEE2E2', borderRadius: '8px' }}>
                    <p style={{ fontWeight: 'bold' }}>Error Loading Products</p>
                    <p>{errorMsg}</p>
                </div>
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
                                    background: product.status === 'Active' ? '#D1FAE5' : '#FEE2E2',
                                    color: product.status === 'Active' ? '#059669' : '#DC2626',
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
                                }}>
                                    {product.status}
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
                            
                            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                                {product.category} {product.sub_category ? `> ${product.sub_category}` : ''}
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', flexGrow: 1 }}>{product.title}</h3>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #E2E8F0', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 'bold', color: '#0F172A' }}>{formatCurrency(product.price)}</span>
                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', textDecoration: 'line-through' }}>{formatCurrency(product.compare_at_price)}</span>
                                    )}
                                </div>
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
                    <table className="admin-table" style={{ width: '100%', minWidth: '900px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>Image</th>
                                <th>SKU</th>
                                <th>Product Details</th>
                                <th>Category & Collection</th>
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
                                        {product.is_customizable && <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: '4px' }}>Customizable</span>}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>{product.category || '--'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{product.sub_category}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{formatCurrency(product.price)}</div>
                                        {product.compare_at_price && product.compare_at_price > product.price && (
                                            <div style={{ fontSize: '0.75rem', color: '#94A3B8', textDecoration: 'line-through' }}>{formatCurrency(product.compare_at_price)}</div>
                                        )}
                                    </td>
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

            {!loading && hasMore && filteredProducts.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                    <button 
                        onClick={() => fetchProducts(true)} 
                        disabled={loadingMore}
                        className="btn btn-outline"
                        style={{ padding: '8px 24px', borderRadius: '8px' }}
                    >
                        {loadingMore ? 'Loading more...' : 'Load More Products'}
                    </button>
                </div>
            )}

            {/* PRODUCT MODAL */}
            {isModalOpen && editingProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#FFF', borderRadius: '12px', width: '95%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} color="#64748B" />
                        </button>
                        
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
                            {editingProduct.id ? 'Edit Product' : 'Create New Product'}
                        </h2>

                        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Row 1: Basics */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Product Title *</label>
                                    <input required type="text" value={editingProduct.title || ''} onChange={e => updateField('title', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>SKU *</label>
                                    <input required type="text" value={editingProduct.sku || ''} onChange={e => updateField('sku', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                </div>
                            </div>

                            {/* Row 2: Organization */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Main Category</label>
                                    <select value={editingProduct.category || ''} onChange={e => updateField('category', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <option value="Half Sarees">Half Sarees</option>
                                        <option value="Sarees">Sarees</option>
                                        <option value="Dresses">Dresses</option>
                                        <option value="Jewellery">Jewellery</option>
                                        <option value="Fabrics">Fabrics</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Sub Collection</label>
                                    <select value={editingProduct.sub_category || ''} onChange={e => updateField('sub_category', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <option value="Ready wear">Ready wear</option>
                                        <option value="Customization">Customization</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Status</label>
                                    <select value={editingProduct.status || 'Active'} onChange={e => updateField('status', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <option value="Active">Active</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Out of Stock">Out of Stock</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 3: Pricing */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', background: '#F8FAFC', padding: '16px', borderRadius: '8px' }}>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Sale Rate (₹) * {userRole !== 'Manager' && '(Managers Only)'}</label>
                                    <input required disabled={userRole !== 'Manager'} type="number" value={editingProduct.price || 0} onChange={e => updateField('price', Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', opacity: userRole === 'Manager' ? 1 : 0.6 }} />
                                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Price customer pays</span>
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Actual Rate (MRP ₹) {userRole !== 'Manager' && '(Managers Only)'}</label>
                                    <input disabled={userRole !== 'Manager'} type="number" value={editingProduct.compare_at_price || 0} onChange={e => updateField('compare_at_price', Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', opacity: userRole === 'Manager' ? 1 : 0.6 }} />
                                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Shown crossed out</span>
                                </div>
                                <div>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Stock Quantity</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input type="number" value={editingProduct.stock_quantity || 0} onChange={e => updateField('stock_quantity', Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                            <input type="checkbox" checked={editingProduct.allow_backorders} onChange={e => updateField('allow_backorders', e.target.checked)} />
                                            Allow Backorders
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Row 4: Variations & Sizing */}
                            <div style={{ background: '#F1F5F9', padding: '16px', borderRadius: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.95rem', marginBottom: '16px' }}>
                                    <input type="checkbox" checked={editingProduct.is_customizable} onChange={e => updateField('is_customizable', e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                    This product is Customizable
                                </label>
                                
                                {!editingProduct.is_customizable && (
                                    <div>
                                        <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Ready Wear Sizes (Select available)</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map(size => {
                                                const isSelected = (editingProduct.available_sizes || []).includes(size);
                                                return (
                                                    <button 
                                                        type="button" 
                                                        key={size} 
                                                        onClick={() => toggleSize(size)}
                                                        style={{ 
                                                            padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid',
                                                            background: isSelected ? '#10B981' : '#FFF',
                                                            borderColor: isSelected ? '#10B981' : '#CBD5E1',
                                                            color: isSelected ? '#FFF' : '#475569'
                                                        }}
                                                    >
                                                        {size}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Row 5: Media (Images & Video) */}
                            <div>
                                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Product Images</label>
                                
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingImage}
                                        className="btn btn-outline"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                                    >
                                        <ImageIcon size={16} /> {uploadingImage ? 'Uploading...' : 'Upload Files'}
                                    </button>
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*" 
                                        ref={fileInputRef} 
                                        style={{ display: 'none' }} 
                                        onChange={handleImageUpload} 
                                    />
                                    <textarea 
                                        rows={2}
                                        value={(editingProduct.images || []).join(', ')} 
                                        onChange={e => updateField('images', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                                        placeholder="Or paste external image URLs here, comma separated..."
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', fontFamily: 'monospace' }} 
                                    />
                                </div>
                                
                                {editingProduct.images && editingProduct.images.length > 0 && (
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {editingProduct.images.map((img, i) => (
                                            <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => updateField('images', editingProduct.images?.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 4, right: 4, background: '#FFF', borderRadius: '50%', padding: '2px', cursor: 'pointer', border: 'none' }}>
                                                    <X size={12} color="#DC2626" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Reference Video Link (YouTube / Instagram Reel)</label>
                                <input type="text" placeholder="https://instagram.com/reel/..." value={editingProduct.video_link || ''} onChange={e => updateField('video_link', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                            </div>

                            <div>
                                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Description</label>
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

            {/* IMPORT PROGRESS MODAL */}
            {importStats !== null && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#FFF', borderRadius: '12px', width: '90%', maxWidth: '500px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
                            {csvUploading ? 'Importing Products...' : 'Import Complete'}
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '8px' }}>
                                <span style={{ fontWeight: 600 }}>Total Processed:</span>
                                <span>{importStats.total}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#D1FAE5', color: '#065F46', borderRadius: '8px' }}>
                                <span style={{ fontWeight: 600 }}>Successfully Inserted:</span>
                                <span>{importStats.success}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#FEF3C7', color: '#92400E', borderRadius: '8px' }}>
                                <span style={{ fontWeight: 600 }}>Skipped (Duplicates):</span>
                                <span>{importStats.skipped}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px' }}>
                                <span style={{ fontWeight: 600 }}>Failed (Validation):</span>
                                <span>{importStats.failed}</span>
                            </div>
                        </div>

                        {importStats.errors.length > 0 && !csvUploading && (
                            <div style={{ marginBottom: '24px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
                                <h4 style={{ fontWeight: 700, marginBottom: '8px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertCircle size={14} /> Failed Rows Log
                                </h4>
                                {importStats.errors.map((e, i) => (
                                    <div key={i} style={{ paddingBottom: '8px', borderBottom: '1px solid #F1F5F9', marginBottom: '8px' }}>
                                        <strong>SKU {e.sku}:</strong> {e.error}
                                    </div>
                                ))}
                            </div>
                        )}

                        {!csvUploading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setImportStats(null)} className="btn btn-primary">
                                    Close Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
