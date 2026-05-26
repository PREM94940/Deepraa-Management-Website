"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import DataTable from '@/components/admin/DataTable';
import { approveOrderAction, deleteOrdersAction } from '@/lib/actions/orders';
import { CheckCircle, XCircle, Eye, Edit3, CreditCard, Image as ImageIcon } from 'lucide-react';

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [previewImg, setPreviewImg] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    useEffect(() => {
        const channel = supabase.channel('realtime_orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload) => {
                const { data } = await supabase.from('orders').select(`
                    id, order_number, status, source, total_amount, created_at, expected_delivery_date, 
                    approval_status, payment_status, reference_image, payment_screenshot, notes,
                    customers ( id, full_name, phone_number ),
                    order_items ( product_name, quantity, price )
                `).eq('id', payload.new.id).single();
                
                if (data) {
                    setOrders(prev => [data, ...prev]);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
                setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, (payload) => {
                setOrders(prev => prev.filter(o => o.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchOrders() {
        setLoading(true);
        try {
            let query = supabase.from('orders').select(`
                id,
                order_number,
                status,
                source,
                total_amount,
                created_at,
                expected_delivery_date,
                approval_status,
                payment_status,
                reference_image,
                payment_screenshot,
                notes,
                customers ( id, full_name, phone_number ),
                order_items ( product_name, quantity, price )
            `).order('created_at', { ascending: false });

            if (filter !== 'All') {
                if (filter === 'Pending Approval') {
                    query = query.eq('approval_status', 'Pending Approval');
                } else {
                    query = query.eq('status', filter.toLowerCase());
                }
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

    async function handleApproveOrder(id: string) {
        if (!confirm('Verify and Approve this order?')) return;
        try {
            const res = await approveOrderAction(id);
            if (!res.success) throw new Error(res.error);
            fetchOrders();
        } catch (err: any) {
            alert('Error approving order: ' + err.message);
        }
    }

    async function handleDeleteSelected(ids: string[]) {
        try {
            const res = await deleteOrdersAction(ids);
            if (!res.success) throw new Error(res.error);
            fetchOrders();
        } catch (err: any) {
            alert('Error deleting orders: ' + err.message);
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    const formatDate = (d: string) => {
        const dt = new Date(d);
        return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const columns = [
        {
            key: 'thumbnail',
            header: '',
            render: (o: any) => (
                <div 
                    onClick={(e) => { e.stopPropagation(); if (o.reference_image) setPreviewImg(o.reference_image); }}
                    style={{ 
                        width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', 
                        background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: o.reference_image ? 'pointer' : 'default', flexShrink: 0,
                        border: '1px solid #E2E8F0'
                    }}
                >
                    {o.reference_image ? (
                        <img src={o.reference_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <ImageIcon size={18} color="#94A3B8" />
                    )}
                </div>
            )
        },
        {
            key: 'id',
            header: 'Order',
            render: (o: any) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{o.customers?.full_name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8B5CF6', fontFamily: 'monospace' }}>{o.order_number || o.id.slice(0, 8)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{o.customers?.phone_number || ''}</div>
                </div>
            )
        },
        {
            key: 'created_at',
            header: 'Order Date',
            sortable: true,
            render: (o: any) => (
                <div>
                    <div style={{ fontSize: '0.85rem' }}>{formatDate(o.created_at)}</div>
                    {o.expected_delivery_date && (
                        <div style={{ fontSize: '0.7rem', color: '#F59E0B' }}>Del: {formatDate(o.expected_delivery_date)}</div>
                    )}
                </div>
            )
        },
        {
            key: 'order_items',
            header: 'Items',
            render: (o: any) => (
                <div style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '180px' }}>
                    {o.order_items && o.order_items.length > 0 
                        ? o.order_items.map((it: any) => it.product_name).join(', ')
                        : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No items</span>
                    }
                </div>
            )
        },
        {
            key: 'source',
            header: 'Source',
            render: (o: any) => (
                <span style={{ textTransform: 'capitalize', fontSize: '0.8rem', fontWeight: 600, color: o.source === 'whatsapp' ? '#25D366' : o.source === 'instore' ? '#F59E0B' : '#3B82F6' }}>
                    {o.source || 'N/A'}
                </span>
            )
        },
        {
            key: 'total_amount',
            header: 'Amount',
            sortable: true,
            render: (o: any) => (
                <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{formatCurrency(o.total_amount)}</div>
                    <div style={{ fontSize: '0.7rem', color: o.payment_status === 'Paid' ? '#10B981' : '#F59E0B' }}>
                        {o.payment_status || 'Pending'}
                    </div>
                </div>
            )
        },
        {
            key: 'approval_status',
            header: 'Verification',
            render: (o: any) => {
                if (o.approval_status === 'Pending Approval') {
                    return (
                        <button onClick={(e) => { e.stopPropagation(); handleApproveOrder(o.id); }} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Verify
                        </button>
                    );
                }
                return <span style={{ color: '#10B981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Approved</span>;
            }
        },
        {
            key: 'status',
            header: 'Status',
            render: (o: any) => (
                <span className={`badge badge-${o.status?.toLowerCase()?.replace(/\s/g, '-') || 'pending'}`}>
                    {o.status || 'Pending'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (o: any) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                    <Link href={`/admin/orders/${o.id}`} onClick={(e) => e.stopPropagation()} title="View Details"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#3B82F6', textDecoration: 'none' }}>
                        <Eye size={15} />
                    </Link>
                    <Link href={`/admin/orders/${o.id}?edit=true`} onClick={(e) => e.stopPropagation()} title="Edit Order"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: '#FFF7ED', color: '#F59E0B', textDecoration: 'none' }}>
                        <Edit3 size={15} />
                    </Link>
                    {o.payment_screenshot && (
                        <button onClick={(e) => { e.stopPropagation(); setPreviewImg(o.payment_screenshot); }} title="View Payment"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDF4', color: '#10B981', border: 'none', cursor: 'pointer' }}>
                            <CreditCard size={15} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    const [showWaModal, setShowWaModal] = useState(false);
    const waLink = 'https://deeprastore-web.vercel.app/whatsapp-form';

    return (
        <div>
            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Omnichannel Orders</h1>
                    <p>Manage orders from Web, App, WhatsApp, and POS.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowWaModal(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', borderColor: '#10B981' }}>
                        <i className="fab fa-whatsapp"></i> WhatsApp Link
                    </button>
                    <Link href="/admin/orders/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-plus"></i> Create New Order
                    </Link>
                </div>
            </div>

            {/* WhatsApp Modal */}
            {showWaModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#FFF', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '500px', position: 'relative' }}>
                        <button onClick={() => setShowWaModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                            <XCircle size={24} />
                        </button>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fab fa-whatsapp" style={{ color: '#10B981' }}></i> WhatsApp Order Form
                        </h2>
                        <p style={{ color: '#64748B', marginBottom: '24px' }}>Send this link to your customers so they can fill in their measurements and upload payment screenshots directly from their phone.</p>
                        <div style={{ padding: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '24px', wordBreak: 'break-all', fontFamily: 'monospace', color: '#334155' }}>
                            {waLink}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => { navigator.clipboard.writeText(waLink); alert('Link copied!'); }} className="btn btn-outline" style={{ flex: 1 }}>
                                Copy Link
                            </button>
                            <a href={`https://wa.me/?text=${encodeURIComponent("Hi! Please fill out this quick form with your measurements and payment details to complete your order: " + waLink)}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1, background: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}>
                                <i className="fab fa-whatsapp"></i> Share
                            </a>
                        </div>
                    </div>
                </div>
            )}

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

            <div className="table-container">
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
                    {['All', 'Pending Approval', 'Payment Pending', 'Confirmed', 'To Stitching', 'In Stitching', 'Ready', 'Dispatched', 'Delivered', 'Cancelled'].map(status => (
                        <button 
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`btn ${filter === status ? 'btn-primary' : 'btn-outline'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading orders...</div>
                ) : (
                    <DataTable 
                        data={orders}
                        columns={columns}
                        onDeleteSelected={handleDeleteSelected}
                        getId={(o) => o.id}
                        filename="orders.csv"
                        renderGridCard={(o) => (
                            <div style={{ padding: '0', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', height: '100%', overflow: 'hidden' }}>
                                {/* Thumbnail header */}
                                <div style={{ height: '80px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {o.reference_image ? (
                                        <img src={o.reference_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => setPreviewImg(o.reference_image)} />
                                    ) : (
                                        <ImageIcon size={28} color="#CBD5E1" />
                                    )}
                                    <span className={`badge badge-${o.status?.toLowerCase()?.replace(/\s/g, '-') || 'pending'}`} style={{ position: 'absolute', top: '8px', right: '8px' }}>
                                        {o.status || 'Pending'}
                                    </span>
                                </div>

                                <div style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{o.customers?.full_name || 'Unknown'}</div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#8B5CF6', fontFamily: 'monospace', marginBottom: '4px' }}>{o.order_number || o.id.slice(0, 8)}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '8px' }}>
                                        Order: {formatDate(o.created_at)}
                                        {o.expected_delivery_date && <> · Del: {formatDate(o.expected_delivery_date)}</>}
                                    </div>

                                    {o.order_items && o.order_items.length > 0 && (
                                        <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '8px', padding: '6px 8px', background: '#F8FAFC', borderRadius: '6px' }}>
                                            {o.order_items.map((it: any) => it.product_name).join(', ')}
                                        </div>
                                    )}

                                    {o.approval_status === 'Pending Approval' && (
                                        <button onClick={() => handleApproveOrder(o.id)} className="btn btn-primary" style={{ width: '100%', marginBottom: '8px', padding: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            <CheckCircle size={14} /> Verify & Approve
                                        </button>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(o.total_amount)}</span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <Link href={`/admin/orders/${o.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: '#EFF6FF', color: '#3B82F6', textDecoration: 'none' }}>
                                                <Eye size={13} />
                                            </Link>
                                            <Link href={`/admin/orders/${o.id}?edit=true`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: '#FFF7ED', color: '#F59E0B', textDecoration: 'none' }}>
                                                <Edit3 size={13} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                )}
            </div>
        </div>
    );
}
