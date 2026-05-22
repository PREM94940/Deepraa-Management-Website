"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types';
import { Search, Plus, Trash2, Link as LinkIcon, UserPlus, Store, CheckCircle, PackagePlus, X, Upload, Scissors, Calendar, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import MeasurementsForm from '@/components/admin/MeasurementsForm';

export default function CreateOrderWizard() {
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1: Customer
    const [phoneSearch, setPhoneSearch] = useState('');
    const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
    const [searching, setSearching] = useState(false);
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');

    // Step 2: Items
    const [items, setItems] = useState<{name: string, price: number, qty: number, product_id?: string}[]>([
        { name: '', price: 0, qty: 1 }
    ]);
    const [stitchingCharge, setStitchingCharge] = useState(0);
    const [deliveryCharge, setDeliveryCharge] = useState(0);

    // Smart Search States
    const [productSearchIndex, setProductSearchIndex] = useState<number | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [newProductTitle, setNewProductTitle] = useState('');
    const [newProductPrice, setNewProductPrice] = useState(0);

    // Step 3: Measurements
    const [orderMeasurements, setOrderMeasurements] = useState<Record<string, any>>({});

    // Step 4: Details
    const [targetDays, setTargetDays] = useState(10);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');

    // Step 5: Billing
    const [orderSource, setOrderSource] = useState<'whatsapp' | 'instore'>('whatsapp');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
    const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);

    // Submission States
    const [generating, setGenerating] = useState(false);
    const [posSuccess, setPosSuccess] = useState(false);

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0) + Number(stitchingCharge) + Number(deliveryCharge);

    async function searchCustomer() {
        if (!phoneSearch) return;
        setSearching(true);
        try {
            const { data } = await supabase.from('customers').select('*').eq('phone_number', phoneSearch).single();
            if (data) {
                setFoundCustomer(data);
                setShowNewCustomerForm(false);
                if (data.measurements) setOrderMeasurements(data.measurements);
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

    const updateItem = (idx: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[idx] as any)[field] = value;
        setItems(newItems);
        if (field === 'name' && value.length > 2) {
            setProductSearchIndex(idx);
            searchInventoryProducts(value);
        } else if (field === 'name' && value.length <= 2) {
            setSearchResults([]);
        }
    };

    async function searchInventoryProducts(query: string) {
        const { data } = await supabase.from('products').select('*').or(`title.ilike.%${query}%,sku.ilike.%${query}%`).limit(5);
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

    async function uploadFile(file: File, prefix: string) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${prefix}-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('order-attachments').upload(fileName, file);
        if (error || !data) return null;
        return supabase.storage.from('order-attachments').getPublicUrl(data.path).data.publicUrl;
    }

    async function handleCreateOrder() {
        setGenerating(true);
        try {
            let customerId = foundCustomer?.id;
            if (!customerId) {
                const { data: existingCust } = await supabase.from('customers').select('id').eq('phone_number', phoneSearch).single();
                if (existingCust) {
                    customerId = existingCust.id;
                } else {
                    const { data: newCust, error: custErr } = await supabase.from('customers').insert([
                        { full_name: newCustomerName || 'Store Customer', phone_number: phoneSearch }
                    ]).select().single();
                    if (custErr) throw custErr;
                    customerId = newCust.id;
                }
            }

            let refImageUrl = null;
            if (referenceImageFile) refImageUrl = await uploadFile(referenceImageFile, 'ref');

            let paymentUrl = null;
            if (paymentScreenshotFile) paymentUrl = await uploadFile(paymentScreenshotFile, 'pay');

            const isInstore = orderSource === 'instore';

            const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
            const { data: order, error: orderErr } = await supabase.from('orders').insert([{
                order_number: orderNumber,
                customer_id: customerId, 
                total_amount: totalAmount,
                status: 'Pending Approval', // Dynamic verification flow
                approval_status: 'Pending Approval',
                payment_status: isInstore ? 'Paid' : 'Pending',
                source: orderSource,
                target_days: targetDays,
                expected_delivery_date: deliveryDate || null,
                reference_image: refImageUrl,
                payment_screenshot: paymentUrl,
                notes: `${notes}\n${isInstore ? `Paid via ${paymentMethod}` : ''}`,
                measurements: orderMeasurements
            }]).select().single();
            if (orderErr) throw orderErr;

            const orderItems = items.map(item => ({
                order_id: order.id,
                product_id: item.product_id || null,
                product_name: item.name,
                price: item.price,
                quantity: item.qty
            }));
            const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
            if (itemsErr) throw itemsErr;

            setPosSuccess(true);
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
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '12px' }}>Order Submitted for Approval!</h1>
                <p style={{ color: '#64748B', marginBottom: '24px' }}>The order is now in 'Pending Approval' state.</p>
                <Link href="/admin/orders" className="btn btn-primary">
                    Go to Orders
                </Link>
            </div>
        );
    }

    const steps = ['Customer', 'Items', 'Measurements', 'Details', 'Billing'];

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
            <div className="content-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/admin/orders" className="btn btn-outline" style={{ padding: '6px 12px' }}>&larr; Back</Link>
                    <h1>Create Smart Order</h1>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', left: 0, right: 0, height: '2px', background: '#E2E8F0', zIndex: 0 }}></div>
                {steps.map((step, idx) => (
                    <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: currentStep > idx + 1 ? '#10B981' : currentStep === idx + 1 ? '#3B82F6' : '#FFF', border: `2px solid ${currentStep >= idx + 1 ? 'transparent' : '#CBD5E1'}`, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {currentStep > idx + 1 ? '✓' : idx + 1}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: currentStep === idx + 1 ? 600 : 400, color: currentStep === idx + 1 ? '#0F172A' : '#64748B' }}>{step}</span>
                    </div>
                ))}
            </div>

            <div style={{ background: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', minHeight: '300px' }}>
                {/* Step 1 */}
                {currentStep === 1 && (
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Customer Details</h2>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <input type="tel" placeholder="Phone Number" value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                            <button onClick={searchCustomer} disabled={searching || !phoneSearch} className="btn btn-primary">
                                {searching ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                        {foundCustomer && (
                            <div style={{ padding: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
                                <strong>{foundCustomer.full_name}</strong><br/>
                                <span style={{ fontSize: '0.85rem', color: '#166534' }}>Lifetime Value: ₹{foundCustomer.total_spent}</span>
                            </div>
                        )}
                        {showNewCustomerForm && (
                            <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>New Customer Name</label>
                                <input type="text" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2 */}
                {currentStep === 2 && (
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Order Items</h2>
                        {items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                                <div style={{ flex: 2, position: 'relative' }}>
                                    <input 
                                        type="text" placeholder="Search Product Name"
                                        value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                                    />
                                    {productSearchIndex === idx && searchResults.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#FFF', border: '1px solid #E2E8F0', zIndex: 10 }}>
                                            {searchResults.map(p => (
                                                <div key={p.id} onClick={() => selectProduct(idx, p)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                                    {p.title} (₹{p.price})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input type="number" placeholder="₹" value={item.price || ''} onChange={e => updateItem(idx, 'price', Number(e.target.value))} style={{ width: '100px', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                                <input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} style={{ width: '80px', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                            </div>
                        ))}
                        <button onClick={() => setItems([...items, {name:'',price:0,qty:1}])} className="btn btn-outline" style={{ marginTop: '8px' }}>+ Add Item</button>
                    </div>
                )}

                {/* Step 3 */}
                {currentStep === 3 && (
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Customer Measurements</h2>
                        <MeasurementsForm initialData={orderMeasurements} onChange={setOrderMeasurements} />
                    </div>
                )}

                {/* Step 4 */}
                {currentStep === 4 && (
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Order Details</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Target Days</label>
                                <input type="number" value={targetDays} onChange={e => setTargetDays(Number(e.target.value))} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Expected Delivery Date</label>
                                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Reference Image</label>
                            <input type="file" onChange={e => e.target.files && setReferenceImageFile(e.target.files[0])} style={{ padding: '12px', width: '100%', border: '1px dashed #CBD5E1', borderRadius: '8px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Additional Notes</label>
                            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }}></textarea>
                        </div>
                    </div>
                )}

                {/* Step 5 */}
                {currentStep === 5 && (
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Billing & Payment</h2>
                        
                        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span>Items Total</span>
                                <span>₹{items.reduce((s, i) => s + i.price * i.qty, 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span>Stitching Charge</span>
                                <input type="number" value={stitchingCharge} onChange={e => setStitchingCharge(Number(e.target.value))} style={{ width: '100px', padding: '4px', textAlign: 'right' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                                <span>Delivery Charge</span>
                                <input type="number" value={deliveryCharge} onChange={e => setDeliveryCharge(Number(e.target.value))} style={{ width: '100px', padding: '4px', textAlign: 'right' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                <span>Final Amount</span>
                                <span>₹{totalAmount}</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Order Channel</label>
                                <select value={orderSource} onChange={e => setOrderSource(e.target.value as any)} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                                    <option value="whatsapp">WhatsApp / Online</option>
                                    <option value="instore">In-Store (POS)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Payment Method</label>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                                    <option value="UPI">UPI</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Payment Screenshot</label>
                            <input type="file" onChange={e => e.target.files && setPaymentScreenshotFile(e.target.files[0])} style={{ padding: '12px', width: '100%', border: '1px dashed #CBD5E1', borderRadius: '8px' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Wizard Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                <button 
                    className="btn btn-outline" 
                    onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
                    disabled={currentStep === 1}
                >
                    <ChevronLeft size={16} style={{ marginRight: '4px' }} /> Previous
                </button>
                
                {currentStep < 5 ? (
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setCurrentStep(s => Math.min(5, s + 1))}
                        disabled={(currentStep === 1 && !foundCustomer && !newCustomerName)}
                    >
                        Next <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                    </button>
                ) : (
                    <button 
                        className="btn btn-primary" 
                        onClick={handleCreateOrder}
                        disabled={generating}
                        style={{ background: '#10B981', borderColor: '#10B981' }}
                    >
                        {generating ? 'Submitting...' : 'Complete & Submit Order'}
                    </button>
                )}
            </div>
        </div>
    );
}
