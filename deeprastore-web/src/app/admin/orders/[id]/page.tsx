"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, MapPin, Receipt, Clock, Scissors, Image as ImageIcon, CreditCard, Save, XCircle, Edit3 } from 'lucide-react';

export default function OrderDetailsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const startInEdit = searchParams.get('edit') === 'true';
    
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(startInEdit);
    const [saving, setSaving] = useState(false);
    const [previewImg, setPreviewImg] = useState<string | null>(null);

    // Editable fields
    const [editStatus, setEditStatus] = useState('');
    const [editPaymentStatus, setEditPaymentStatus] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [editAmount, setEditAmount] = useState(0);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    async function fetchOrder() {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customers (*),
                order_items (*),
                order_status_history (*)
            `)
            .eq('id', id)
            .single();
            
        if (data) {
            if (data.order_status_history) {
                data.order_status_history.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }
            setOrder(data);
            setEditStatus(data.status || '');
            setEditPaymentStatus(data.payment_status || '');
            setEditNotes(data.notes || '');
            setEditAmount(data.total_amount || 0);
        }
        setLoading(false);
    }

    async function handleSave() {
        setSaving(true);
        try {
            const updates: any = {
                status: editStatus,
                payment_status: editPaymentStatus,
                notes: editNotes,
                total_amount: editAmount
            };
            const { error } = await supabase.from('orders').update(updates).eq('id', id);
            if (error) throw error;

            // Log status change
            if (editStatus !== order.status) {
                await supabase.from('order_status_history').insert([{
                    order_id: id,
                    old_status: order.status,
                    new_status: editStatus,
                    notes: 'Updated via admin edit'
                }]);
            }

            setEditMode(false);
            fetchOrder();
        } catch (err: any) {
            alert('Error saving: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatDateTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading order details...</div>;
    if (!order) return <div style={{ padding: '40px', textAlign: 'center' }}>Order not found.</div>;

    const statuses = ['Pending Approval', 'Pending Verification', 'Payment Pending', 'confirmed', 'to stitching', 'in stitching', 'ready', 'dispatched', 'delivered', 'cancelled'];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Image Preview Lightbox */}
            {previewImg && (
                <div onClick={() => setPreviewImg(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <button onClick={() => setPreviewImg(null)} style={{ position: 'absolute', top: '-40px', right: '0', background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer' }}>
                            <XCircle size={28} />
                        </button>
                        <img src={previewImg} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="content-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Link href="/admin/orders" className="btn btn-outline" style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <div>
                        <h1 style={{ marginBottom: '4px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            Order <span className="font-mono" style={{ color: '#8B5CF6' }}>#{order.order_number || order.id.slice(0,8)}</span>
                            <span className={`badge badge-${order.status?.toLowerCase().replace(/\s/g, '-')}`}>{order.status}</span>
                        </h1>
                        <p style={{ color: '#64748B' }}>Placed on {formatDateTime(order.created_at)}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!editMode ? (
                        <button onClick={() => setEditMode(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F59E0B', borderColor: '#F59E0B' }}>
                            <Edit3 size={16} /> Edit
                        </button>
                    ) : (
                        <>
                            <button onClick={() => { setEditMode(false); setEditStatus(order.status); setEditPaymentStatus(order.payment_status); setEditNotes(order.notes || ''); setEditAmount(order.total_amount); }} className="btn btn-outline">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Order Summary */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Receipt size={18} /> Order Summary
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Order Date</div>
                                <div style={{ fontWeight: 600 }}>{formatDate(order.created_at)}</div>
                            </div>
                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Delivery Date</div>
                                <div style={{ fontWeight: 600 }}>{order.expected_delivery_date ? formatDate(order.expected_delivery_date) : 'Not set'}</div>
                            </div>
                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Source</div>
                                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{order.source || 'N/A'}</div>
                            </div>
                            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Payment Status</div>
                                {editMode ? (
                                    <select value={editPaymentStatus} onChange={e => setEditPaymentStatus(e.target.value)} style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                                        {['Pending', 'Partial', 'Paid', 'Refunded'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                ) : (
                                    <div style={{ fontWeight: 600, color: order.payment_status === 'Paid' ? '#10B981' : '#F59E0B' }}>{order.payment_status || 'Pending'}</div>
                                )}
                            </div>
                        </div>

                        {editMode && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Status</label>
                                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}

                        {editMode && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Total Amount (₹)</label>
                                <input type="number" value={editAmount} onChange={e => setEditAmount(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Receipt size={18} /> Order Items
                        </h2>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.order_items?.map((item: any) => (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                                        <td>₹{item.price}</td>
                                        <td>{item.quantity}</td>
                                        <td>₹{item.price * item.quantity}</td>
                                    </tr>
                                ))}
                                {(!order.order_items || order.order_items.length === 0) && (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' }}>No items recorded</td></tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Grand Total:</td>
                                    <td style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#10B981' }}>{formatCurrency(order.total_amount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Measurements */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#8B5CF6' }}>
                            <Scissors size={18} /> Tailor Measurements
                        </h2>
                        {!order.measurements || Object.keys(order.measurements).length === 0 ? (
                            <p style={{ color: '#64748B', fontStyle: 'italic' }}>No measurements provided for this order.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                {Object.entries(order.measurements).map(([key, val]) => (
                                    <div key={key} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>{key}</div>
                                        <div style={{ fontWeight: 600 }}>{String(val) || '-'}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {(order.notes || editMode) && (
                        <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>Notes</h2>
                            {editMode ? (
                                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={4} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', resize: 'vertical' }} />
                            ) : (
                                <p style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>{order.notes}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Customer Info */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} /> Customer Info
                        </h2>
                        {order.customers ? (
                            <div>
                                <Link href={`/admin/customers/${order.customers.id}`} style={{ fontWeight: 600, color: '#3B82F6', fontSize: '1.1rem', textDecoration: 'none' }}>
                                    {order.customers.full_name}
                                </Link>
                                <p style={{ marginTop: '8px', color: '#475569' }}><i className="fas fa-phone"></i> {order.customers.phone_number}</p>
                                {order.customers.city && <p style={{ marginTop: '4px', color: '#475569' }}><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> {order.customers.city}</p>}
                            </div>
                        ) : (
                            <p style={{ color: '#EF4444' }}>Customer data missing.</p>
                        )}
                    </div>

                    {/* Reference Image */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ImageIcon size={18} /> Reference Image
                        </h2>
                        {order.reference_image ? (
                            <div onClick={() => setPreviewImg(order.reference_image)} style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                <img src={order.reference_image} alt="Reference" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                        ) : (
                            <div style={{ padding: '32px', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center', color: '#94A3B8' }}>
                                <ImageIcon size={32} style={{ marginBottom: '8px' }} />
                                <p>No reference image uploaded</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Screenshot */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981' }}>
                            <CreditCard size={18} /> Payment Screenshot
                        </h2>
                        {order.payment_screenshot ? (
                            <div onClick={() => setPreviewImg(order.payment_screenshot)} style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                                <img src={order.payment_screenshot} alt="Payment" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                        ) : (
                            <div style={{ padding: '32px', background: '#F8FAFC', borderRadius: '8px', textAlign: 'center', color: '#94A3B8' }}>
                                <CreditCard size={32} style={{ marginBottom: '8px' }} />
                                <p>No payment proof uploaded</p>
                            </div>
                        )}
                    </div>

                    {/* Status History */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} /> Timeline
                        </h2>
                        {order.order_status_history && order.order_status_history.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                {order.order_status_history.map((hist: any, i: number) => (
                                    <div key={hist.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: i === 0 ? '#3B82F6' : '#CBD5E1', marginTop: '6px' }}></div>
                                        {i !== order.order_status_history.length - 1 && (
                                            <div style={{ position: 'absolute', left: '4px', top: '20px', bottom: '-16px', width: '2px', background: '#E2E8F0' }}></div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Changed to {hist.new_status}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{formatDateTime(hist.created_at)}</div>
                                            {hist.notes && <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>{hist.notes}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#64748B', fontSize: '0.9rem' }}>No status changes recorded yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
