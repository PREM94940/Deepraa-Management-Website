"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    async function fetchOrders() {
        setLoading(true);
        try {
            let query = supabase.from('orders').select(`
                id,
                status,
                source,
                total_amount,
                created_at,
                customers ( full_name, phone_number )
            `).order('created_at', { ascending: false });

            if (filter !== 'All') {
                query = query.eq('status', filter.toLowerCase());
            }

            const { data, error } = await query;
            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <div>
            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Omnichannel Orders</h1>
                    <p>Manage orders from Web, App, WhatsApp, and POS.</p>
                </div>
                <Link href="/admin/orders/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-plus"></i> Create New Order
                </Link>
            </div>

            <div className="table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                        {['All', 'Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                            <button 
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`btn ${filter === status ? 'btn-primary' : 'btn-outline'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-success" onClick={() => alert('Export functionality is coming soon!')}>
                        <i className="fas fa-download"></i> Export CSV
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-inbox" style={{ fontSize: 64, marginBottom: 20, color: '#CBD5E1' }}></i>
                        <p>No orders found for this filter.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Source</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td className="font-mono text-xs">{order.id.slice(0, 8)}...</td>
                                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{order.customers?.full_name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{order.customers?.phone_number || ''}</div>
                                        </td>
                                        <td>
                                            <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', fontWeight: 600, color: '#3B82F6' }}>
                                                <i className={`fas ${order.source === 'whatsapp' ? 'fa-whatsapp' : order.source === 'web' ? 'fa-globe' : 'fa-store'}`} style={{ marginRight: 6 }}></i>
                                                {order.source}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(order.total_amount)}</td>
                                        <td>
                                            <span className={`badge badge-${order.status?.toLowerCase() || 'pending'}`}>
                                                {order.status || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
