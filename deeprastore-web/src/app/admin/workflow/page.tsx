"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import { Phone, Calendar, Clock, MoreVertical, Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const COLUMNS = [
    'Payment Pending',
    'Confirmed',
    'To Stitching',
    'In Stitching',
    'Ready',
    'Dispatched',
    'Delivered'
];

export default function WorkflowPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customers (full_name, phone_number),
                order_items (product_name)
            `)
            .order('created_at', { ascending: false });
            
        if (data) setOrders(data);
        setLoading(false);
    }

    async function updateOrderStatus(orderId: string, newStatus: string) {
        // Optimistic UI update
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            alert('Failed to update status: ' + error.message);
            fetchOrders(); // revert
            return;
        }

        // Log history
        await supabase.from('order_status_history').insert([{
            order_id: orderId,
            new_status: newStatus,
            notes: 'Updated via Kanban Board'
        }]);
    }

    function handleDragStart(e: React.DragEvent, orderId: string) {
        e.dataTransfer.setData('orderId', orderId);
    }

    function handleDrop(e: React.DragEvent, newStatus: string) {
        e.preventDefault();
        const orderId = e.dataTransfer.getData('orderId');
        if (orderId) {
            // Find current status to avoid redundant updates
            const order = orders.find(o => o.id === orderId);
            if (order && order.status !== newStatus) {
                updateOrderStatus(orderId, newStatus);
            }
        }
    }

    const filteredOrders = orders.filter(o => 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customers?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customers?.phone_number?.includes(searchQuery)
    );

    return (
        <div style={{ padding: '0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)' }}>
            <div className="content-header" style={{ marginBottom: '16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Order Workflow Engine</h1>
                        <p>Drag and drop orders to update their status</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                            <input 
                                type="text" 
                                placeholder="Search name, phone, ID..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', width: '250px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading workflow board...</div>
            ) : (
                <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    overflowX: 'auto', 
                    flex: 1,
                    paddingBottom: '16px',
                    alignItems: 'flex-start'
                }}>
                    {COLUMNS.map(columnStatus => (
                        <div 
                            key={columnStatus}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, columnStatus)}
                            style={{ 
                                background: '#F8FAFC', 
                                border: '1px solid #E2E8F0', 
                                borderRadius: '12px',
                                minWidth: '300px',
                                width: '300px',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }}
                        >
                            <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', background: '#F1F5F9', borderRadius: '12px 12px 0 0', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                {columnStatus}
                                <span style={{ background: '#E2E8F0', padding: '2px 8px', borderRadius: '99px', fontSize: '0.8rem' }}>
                                    {filteredOrders.filter(o => o.status === columnStatus).length}
                                </span>
                            </div>
                            <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {filteredOrders.filter(o => o.status === columnStatus).map(order => (
                                    <div 
                                        key={order.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, order.id)}
                                        style={{
                                            background: '#FFF',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            cursor: 'grab',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{order.customers?.full_name || 'Unknown'}</div>
                                            <Link href={`/admin/orders/${order.id}`} style={{ color: '#3B82F6' }} title="View Order Details">
                                                <ExternalLink size={16} />
                                            </Link>
                                        </div>
                                        
                                        <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                            <Phone size={12} /> {order.customers?.phone_number || 'N/A'}
                                        </div>

                                        <div style={{ fontSize: '0.85rem', marginBottom: '12px', background: '#F8FAFC', padding: '8px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                                            {order.order_items?.slice(0,2).map((item: any, i: number) => (
                                                <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    • {item.product_name}
                                                </div>
                                            ))}
                                            {(order.order_items?.length || 0) > 2 && (
                                                <div style={{ color: '#94A3B8', marginTop: '4px' }}>+ {(order.order_items?.length || 0) - 2} more items</div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                            <div style={{ fontWeight: 600, color: '#0F172A' }}>₹{order.total_amount}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
                                                <Clock size={12} /> 
                                                {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredOrders.filter(o => o.status === columnStatus).length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                        No orders
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
