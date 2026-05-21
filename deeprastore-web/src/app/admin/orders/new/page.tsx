"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer, Product } from '@/types';
import { Search, Plus, Trash2, Link as LinkIcon, UserPlus, Store, CheckCircle, PackagePlus, X, Upload } from 'lucide-react';
import Link from 'next/link';

export default function CreateOrderPage() {
    const [phoneSearch, setPhoneSearch] = useState('');
    const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
    const [searching, setSearching] = useState(false);
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');

    const [items, setItems] = useState<{name: string, price: number, qty: number, product_id?: string}[]>([
        { name: '', price: 0, qty: 1 }
    ]);
    const [stitchingCharge, setStitchingCharge] = useState(0);
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    
    // New state for POS / Omnichannel
    const [orderSource, setOrderSource] = useState<'whatsapp' | 'instore'>('whatsapp');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');

    const [generating, setGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [posSuccess, setPosSuccess] = useState(false);

    // Product Search & Instant Add States
    const [productSearchIndex, setProductSearchIndex] = useState<number | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [newProductTitle, setNewProductTitle] = useState('');
    const [newProductPrice, setNewProductPrice] = useState(0);
    const [newProductFile, setNewProductFile] = useState<File | null>(null);
    const [addingProduct, setAddingProduct] = useState(false);

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0) + Number(stitchingCharge) + Number(deliveryCharge);

    async function searchCustomer() {
        if (!phoneSearch) return;
        setSearching(true);
        try {
            const { data, error } = await supabase.from('customers').select('*').eq('phone_number', phoneSearch).single();
            if (data) {
                setFoundCustomer(data);
                setShowNewCustomerForm(false);
            } else {
                setFoundCustomer(null);
                setShowNewCustomerForm(true);
            }
        } catch (err) {
            setFoundCustomer(null);
            setShowNewCustomerForm(true);
        } finally {
            setSearching(false);
        }
    }

    const addItem = () => setItems([...items, { name: '', price: 0, qty: 1 }]);
    const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
    
    const updateItem = (idx: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[idx] as any)[field] = value;
        setItems(newItems);

        // Auto search if name changes
        if (field === 'name' && value.length > 2) {
            setProductSearchIndex(idx);
            searchInventoryProducts(value);
        } else if (field === 'name' && value.length <= 2) {
            setSearchResults([]);
        }
    };

    async function searchInventoryProducts(query: string) {
        const { data } = await supabase
            .from('products')
            .select('*')
            .or(`title.ilike.%${query}%,sku.ilike.%${query}%`)
            .limit(5);
        if (data) setSearchResults(data);
    }

    function selectProduct(idx: number, product: any) {
        const newItems = [...items];
        newItems[idx].name = `${product.sku} - ${product.title}`;
        newItems[idx].price = product.price;
        newItems[idx].product_id = product.id;
        setItems(newItems);
        setSearchResults([]);
        setProductSearchIndex(null);
    }

    async function createInstantProduct() {
        if (!newProductTitle || newProductPrice <= 0) return alert("Enter title and valid price");
        setAddingProduct(true);
        try {
            // 1. Generate SKU (DP200...)
            const { data: lastProducts } = await supabase
                .from('products')
                .select('sku')
                .like('sku', 'DP200%')
                .order('sku', { ascending: false })
                .limit(1);
            
            let newSku = 'DP2001';
            if (lastProducts && lastProducts.length > 0) {
                const lastSku = lastProducts[0].sku;
                const numPart = parseInt(lastSku.replace('DP', ''), 10);
                if (!isNaN(numPart)) {
                    newSku = `DP${numPart + 1}`;
                }
            }

            // 2. Upload Image if exists
            let imageUrl = '';
            if (newProductFile) {
                const fileExt = newProductFile.name.split('.').pop();
                const fileName = `${newSku}-${Date.now()}.${fileExt}`;
                const { error: uploadError, data } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, newProductFile);
                
                if (!uploadError && data) {
                    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
                    imageUrl = publicUrlData.publicUrl;
                }
            }

            // 3. Insert Product
            const { data: createdProduct, error } = await supabase.from('products').insert([{
                sku: newSku,
                title: newProductTitle,
                price: newProductPrice,
                images: imageUrl ? [imageUrl] : [],
                status: 'Active'
            }]).select().single();

            if (error) throw error;

            // 4. Auto select it in the active row
            if (productSearchIndex !== null) {
                selectProduct(productSearchIndex, createdProduct);
            } else {
                // Just add to end
                setItems([...items, { name: `${createdProduct.sku} - ${createdProduct.title}`, price: createdProduct.price, qty: 1, product_id: createdProduct.id }]);
            }

            setShowAddProductModal(false);
            setNewProductTitle('');
            setNewProductPrice(0);
            setNewProductFile(null);
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setAddingProduct(false);
        }
    }

    async function handleCreateOrder() {
        if (items.some(i => !i.name || i.price <= 0)) {
            alert("Please fill all product details correctly.");
            return;
        }
        if (!foundCustomer && !newCustomerName) {
            alert("Please provide customer details.");
            return;
        }

        setGenerating(true);
        try {
            let customerId = foundCustomer?.id;

            // Create customer if they don't exist
            if (!customerId) {
                const { data: newCust, error: custErr } = await supabase.from('customers').insert([
                    { full_name: newCustomerName, phone_number: phoneSearch }
                ]).select().single();
                if (custErr) throw custErr;
                customerId = newCust.id;
            }

            const isInstore = orderSource === 'instore';

            // Create Order
            const { data: order, error: orderErr } = await supabase.from('orders').insert([
                { 
                    customer_id: customerId, 
                    total_amount: totalAmount,
                    status: isInstore ? 'Confirmed' : 'Payment Pending',
                    payment_status: isInstore ? 'Paid' : 'Pending',
                    source: orderSource,
                    notes: isInstore ? `Paid via ${paymentMethod} in-store.` : ''
                }
            ]).select().single();
            if (orderErr) throw orderErr;

            // Insert Items
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.product_id || null,
                product_name: item.name,
                price: item.price,
                quantity: item.qty
            }));
            const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
            if (itemsErr) throw itemsErr;

            if (isInstore) {
                setPosSuccess(true);
            } else {
                // Generate Link
                const link = `${window.location.origin}/confirm-order/${order.id}`;
                setGeneratedLink(link);
            }

        } catch (err: any) {
            alert("Error creating order: " + err.message);
        } finally {
            setGenerating(false);
        }
    }

    if (posSuccess) {
        return (
            <div style={{ maxWidth: '600px', margin: '40px auto', padding: '40px', textAlign: 'center', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <CheckCircle size={64} color="#10B981" style={{ margin: '0 auto 20px' }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '12px' }}>In-Store Order Confirmed!</h1>
                <p style={{ color: '#64748B', marginBottom: '24px' }}>Payment recorded successfully via {paymentMethod}.</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                    Create Another Order
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
            <div className="content-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/admin/orders" className="btn btn-outline" style={{ padding: '6px 12px' }}>&larr; Back</Link>
                    <h1>Omnichannel Order Entry</h1>
                </div>
                <p>Create orders for WhatsApp customers or In-Store (Offline) sales.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 1. Order Type (POS vs Online) */}
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Store size={18} /> 1. Order Channel
                    </h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={() => setOrderSource('whatsapp')}
                            style={{ flex: 1, padding: '16px', borderRadius: '8px', border: orderSource === 'whatsapp' ? '2px solid #8B5CF6' : '1px solid #E2E8F0', background: orderSource === 'whatsapp' ? '#F5F3FF' : '#FFF', fontWeight: 600, color: orderSource === 'whatsapp' ? '#6D28D9' : '#475569', cursor: 'pointer' }}
                        >
                            <LinkIcon size={16} style={{ marginBottom: '4px' }} /><br/>
                            WhatsApp / Instagram
                            <div style={{ fontSize: '0.75rem', fontWeight: 'normal', marginTop: '4px' }}>Generates a Payment Link</div>
                        </button>
                        <button 
                            onClick={() => setOrderSource('instore')}
                            style={{ flex: 1, padding: '16px', borderRadius: '8px', border: orderSource === 'instore' ? '2px solid #10B981' : '1px solid #E2E8F0', background: orderSource === 'instore' ? '#ECFDF5' : '#FFF', fontWeight: 600, color: orderSource === 'instore' ? '#047857' : '#475569', cursor: 'pointer' }}
                        >
                            <Store size={16} style={{ marginBottom: '4px' }} /><br/>
                            In-Store (POS)
                            <div style={{ fontSize: '0.75rem', fontWeight: 'normal', marginTop: '4px' }}>Direct Payment (Cash/UPI)</div>
                        </button>
                    </div>
                </div>

                {/* 2. Customer Selection */}
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={18} /> 2. Find or Create Customer
                    </h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input 
                            type="tel" 
                            placeholder="Enter Customer Phone Number (e.g. 9876543210)" 
                            value={phoneSearch}
                            onChange={e => setPhoneSearch(e.target.value)}
                            style={{ flex: 1, padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                        />
                        <button onClick={searchCustomer} disabled={searching || !phoneSearch} className="btn btn-primary">
                            {searching ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {foundCustomer && (
                        <div style={{ marginTop: '16px', padding: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
                            <strong>Customer Found:</strong> {foundCustomer.full_name} <br/>
                            <span style={{ fontSize: '0.85rem', color: '#166534' }}>Lifetime Value: ₹{foundCustomer.total_spent} | Orders: {foundCustomer.total_orders}</span>
                        </div>
                    )}

                    {showNewCustomerForm && (
                        <div style={{ marginTop: '16px', padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A', fontWeight: 600, marginBottom: '12px' }}>
                                <UserPlus size={16} /> New Customer. Please enter name:
                            </div>
                            <input 
                                type="text" 
                                placeholder="Full Name" 
                                value={newCustomerName}
                                onChange={e => setNewCustomerName(e.target.value)}
                                style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                            />
                        </div>
                    )}
                </div>

                {/* 3. Product Details with Smart Search */}
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>3. Product Details</h2>
                        <button 
                            onClick={() => { setProductSearchIndex(items.length); setShowAddProductModal(true); }}
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <PackagePlus size={14} /> Add Product Instantly
                        </button>
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '16px' }}>
                        * Start typing a SKU (DP200..) or name to search inventory, or type a custom description.
                    </p>
                    
                    {items.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative', display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                            <div style={{ flex: 2, position: 'relative' }}>
                                <input 
                                    type="text" placeholder="Search SKU / Product Name or type custom"
                                    value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                                />
                                {/* Dropdown Results */}
                                {productSearchIndex === idx && searchResults.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px', zIndex: 10, marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                        {searchResults.map(p => (
                                            <div 
                                                key={p.id} 
                                                onClick={() => selectProduct(idx, p)}
                                                style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                            >
                                                <span style={{ fontWeight: 500 }}>{p.sku} - {p.title}</span>
                                                <span style={{ color: '#059669', fontWeight: 600 }}>₹{p.price}</span>
                                            </div>
                                        ))}
                                        <div 
                                            onClick={() => { setShowAddProductModal(true); setSearchResults([]); }}
                                            style={{ padding: '10px 12px', color: '#6D28D9', cursor: 'pointer', textAlign: 'center', fontWeight: 500, background: '#F5F3FF' }}
                                        >
                                            + Product not found? Add it instantly
                                        </div>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="number" placeholder="Price (₹)"
                                value={item.price || ''} onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                                style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                            />
                            <input 
                                type="number" placeholder="Qty"
                                value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                                style={{ width: '80px', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                            />
                            {items.length > 1 && (
                                <button onClick={() => removeItem(idx)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={addItem} className="btn btn-outline" style={{ marginTop: '8px', fontSize: '0.85rem' }}>+ Add Another Item</button>

                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500 }}>Custom Stitching Charges (₹)</span>
                            <input type="number" value={stitchingCharge} onChange={e => setStitchingCharge(Number(e.target.value))} style={{ width: '150px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500 }}>Delivery Charges (₹)</span>
                            <input type="number" value={deliveryCharge} onChange={e => setDeliveryCharge(Number(e.target.value))} style={{ width: '150px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.25rem', fontWeight: 'bold', marginTop: '12px' }}>
                            <span>Total Amount:</span>
                            <span>₹{totalAmount}</span>
                        </div>
                    </div>
                </div>

                {/* 4. Generate Link or Mark Paid */}
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    {generatedLink ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '16px', borderRadius: '8px', marginBottom: '16px', wordBreak: 'break-all', fontWeight: 500 }}>
                                {generatedLink}
                            </div>
                            <button onClick={() => navigator.clipboard.writeText(generatedLink)} className="btn btn-primary">
                                Copy Link for WhatsApp
                            </button>
                        </div>
                    ) : orderSource === 'instore' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Payment Received Via:</label>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                                    <option value="UPI">UPI (PhonePe, GPay, Paytm)</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Credit / Debit Card</option>
                                </select>
                            </div>
                            <button 
                                className="btn btn-primary" 
                                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', background: '#10B981', border: 'none' }}
                                onClick={handleCreateOrder}
                                disabled={generating || (!foundCustomer && !newCustomerName)}
                            >
                                {generating ? 'Processing...' : 'Mark as Paid & Confirm Order'}
                            </button>
                        </div>
                    ) : (
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} 
                            onClick={handleCreateOrder}
                            disabled={generating || (!foundCustomer && !newCustomerName)}
                        >
                            <LinkIcon size={20} /> {generating ? 'Generating Link...' : 'Generate WhatsApp Payment Link'}
                        </button>
                    )}
                </div>
            </div>

            {/* Instant Add Product Modal */}
            {showAddProductModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#FFF', width: '100%', maxWidth: '500px', borderRadius: '16px', padding: '24px', position: 'relative' }}>
                        <button 
                            onClick={() => setShowAddProductModal(false)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                        >
                            <X size={24} />
                        </button>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PackagePlus size={20} color="#6D28D9" /> Add Product Instantly
                        </h2>
                        <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '24px' }}>A new SKU (DP200x) will be automatically generated.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Product Title</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Red Bridal Half Saree"
                                    value={newProductTitle}
                                    onChange={e => setNewProductTitle(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Price (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="0"
                                    value={newProductPrice || ''}
                                    onChange={e => setNewProductPrice(Number(e.target.value))}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Product Image (Optional)</label>
                                <div style={{ border: '2px dashed #CBD5E1', padding: '20px', textAlign: 'center', borderRadius: '8px', background: '#F8FAFC' }}>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="product-image"
                                        style={{ display: 'none' }}
                                        onChange={e => e.target.files && setNewProductFile(e.target.files[0])}
                                    />
                                    <label htmlFor="product-image" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <Upload size={24} color="#94A3B8" />
                                        <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
                                            {newProductFile ? newProductFile.name : 'Click to upload image'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <button 
                                onClick={createInstantProduct}
                                disabled={addingProduct || !newProductTitle || newProductPrice <= 0}
                                className="btn btn-primary" 
                                style={{ width: '100%', padding: '14px', marginTop: '8px' }}
                            >
                                {addingProduct ? 'Adding & Saving...' : 'Save Product & Use'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
