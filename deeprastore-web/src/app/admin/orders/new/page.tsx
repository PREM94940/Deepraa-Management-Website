"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types';
import { Search, Plus, Trash2, Link as LinkIcon, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function CreateOrderPage() {
    const [phoneSearch, setPhoneSearch] = useState('');
    const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
    const [searching, setSearching] = useState(false);
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');

    const [items, setItems] = useState<{name: string, price: number, qty: number}[]>([
        { name: '', price: 0, qty: 1 }
    ]);
    const [stitchingCharge, setStitchingCharge] = useState(0);
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    
    const [generating, setGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');

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
    };

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

            // Create Order
            const { data: order, error: orderErr } = await supabase.from('orders').insert([
                { 
                    customer_id: customerId, 
                    total_amount: totalAmount,
                    status: 'Payment Pending',
                    source: 'whatsapp'
                }
            ]).select().single();
            if (orderErr) throw orderErr;

            // Insert Items
            const orderItems = items.map(item => ({
                order_id: order.id,
                product_name: item.name,
                price: item.price,
                quantity: item.qty
            }));
            const { error: itemsErr } = await supabase.from('order_items').insert(orderItems);
            if (itemsErr) throw itemsErr;

            // Generate Link
            const link = `${window.location.origin}/confirm-order/${order.id}`;
            setGeneratedLink(link);

        } catch (err: any) {
            alert("Error creating order: " + err.message);
        } finally {
            setGenerating(false);
        }
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="content-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/admin/orders" className="btn btn-outline" style={{ padding: '6px 12px' }}>&larr; Back</Link>
                    <h1>Omnichannel Order Entry</h1>
                </div>
                <p>Create an order manually and generate a payment link for WhatsApp.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 1. Customer Selection */}
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={18} /> 1. Find or Create Customer
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

                {/* 2. Order Details */}
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>2. Product Details</h2>
                    {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                            <input 
                                type="text" placeholder="Product Name / Custom Description"
                                value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)}
                                style={{ flex: 2, padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                            />
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

                {/* 3. Generate Link */}
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
        </div>
    );
}
