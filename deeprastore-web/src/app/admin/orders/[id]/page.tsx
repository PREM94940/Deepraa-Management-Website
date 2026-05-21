"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, MapPin, Receipt, Clock, Scissors } from 'lucide-react';

export default function OrderDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
            // Sort history descending
            if (data.order_status_history) {
                data.order_status_history.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            }
            setOrder(data);
        }
        setLoading(false);
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading order details...</div>;
    if (!order) return <div style={{ padding: '40px', textAlign: 'center' }}>Order not found.</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="content-header" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Link href="/admin/orders" className="btn btn-outline" style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowLeft size={16} /> Back
                </Link>
                <div>
                    <h1 style={{ marginBottom: '4px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Order <span className="font-mono">#{order.id.slice(0,8)}</span>
                        <span className={`badge badge-${order.status?.toLowerCase().replace(' ', '-')}`}>{order.status}</span>
                    </h1>
                    <p style={{ color: '#64748B' }}>Placed on {new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
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
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Grand Total:</td>
                                    <td style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#10B981' }}>₹{order.total_amount}</td>
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
                                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{new Date(hist.created_at).toLocaleString()}</div>
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
