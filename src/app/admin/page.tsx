"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/components/admin/SettingsProvider';
import { AlertTriangle, Clock, Target, CreditCard, Box, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminOverviewPage() {
    const { config } = useSettings();
    const [metrics, setMetrics] = useState({
        revenue: 0,
        orders: 0,
        products: 0,
        customers: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [delayedOrders, setDelayedOrders] = useState<any[]>([]);
    const [pendingApprovalOrders, setPendingApprovalOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // Fetch counts
                const { count: productCount, error: pErr } = await supabase.from('products').select('*', { count: 'exact', head: true });
                const { count: orderCount, error: oErr } = await supabase.from('orders').select('*', { count: 'exact', head: true });
                const { count: customerCount, error: cErr } = await supabase.from('customers').select('*', { count: 'exact', head: true });
                
                // Fetch revenue
                const { data: revenueData } = await supabase.from('orders').select('total_amount').neq('status', 'cancelled');
                const totalRevenue = revenueData ? revenueData.reduce((sum, order) => sum + Number(order.total_amount), 0) : 0;

                setMetrics({
                    revenue: totalRevenue,
                    orders: orderCount || 0,
                    products: productCount || 0,
                    customers: customerCount || 0
                });

                // Fetch recent orders
                const { data: recent } = await supabase
                    .from('orders')
                    .select('id, total_amount, status, approval_status, created_at, customers ( full_name )')
                    .order('created_at', { ascending: false })
                    .limit(5);
                if (recent) setRecentOrders(recent);

                // Fetch 'Pending Approval'
                const { data: pending } = await supabase
                    .from('orders')
                    .select('id, total_amount, created_at, customers ( full_name )')
                    .eq('approval_status', 'Pending Approval')
                    .order('created_at', { ascending: false });
                if (pending) setPendingApprovalOrders(pending);

                // Fetch 'Delayed / Action Required' based on expected_delivery_date
                // We calculate warnings if the delivery date is within the config.warningDays
                const today = new Date();
                const warningThreshold = new Date();
                warningThreshold.setDate(today.getDate() + (config.warningDays || 2));
                
                const { data: delayed } = await supabase
                    .from('orders')
                    .select('id, status, expected_delivery_date, customers ( full_name )')
                    .neq('status', 'delivered')
                    .neq('status', 'cancelled')
                    .lte('expected_delivery_date', warningThreshold.toISOString())
                    .order('expected_delivery_date', { ascending: true });
                if (delayed) setDelayedOrders(delayed);

            } catch (err: any) {
                console.error("Error fetching dashboard data", err);
                setErrorMsg(err.message || 'Unknown error occurred');
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, [config]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    if (loading) {
        return <div className="p-8 text-white">Loading Smart Dashboard...</div>;
    }

    if (errorMsg) {
        return <div className="p-8 text-red-500 bg-red-100 m-8 rounded-lg"><strong>Error Loading Dashboard:</strong> {errorMsg}</div>;
    }

    return (
        <div style={{ paddingBottom: '60px' }}>
            <div className="content-header">
                <h1>Smart Dashboard</h1>
                <p>Proactive command center for Deeprastore Operations.</p>
            </div>

            {/* KPIs */}
            <div className="stats-grid" style={{ marginBottom: '32px' }}>
                <div className="card" style={{ borderTop: '4px solid #10B981' }}>
                    <div className="stat-header">
                        <span className="stat-icon" style={{ color: '#10B981' }}><CreditCard /></span>
                    </div>
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-value">{formatCurrency(metrics.revenue)}</div>
                </div>
                <div className="card" style={{ borderTop: '4px solid #3B82F6' }}>
                    <div className="stat-header">
                        <span className="stat-icon" style={{ color: '#3B82F6' }}><Target /></span>
                    </div>
                    <div className="stat-label">Total Orders</div>
                    <div className="stat-value">{metrics.orders}</div>
                </div>
                <div className="card" style={{ borderTop: '4px solid #8B5CF6' }}>
                    <div className="stat-header">
                        <span className="stat-icon" style={{ color: '#8B5CF6' }}><Box /></span>
                    </div>
                    <div className="stat-label">Products</div>
                    <div className="stat-value">{metrics.products}</div>
                </div>
                <div className="card" style={{ borderTop: '4px solid #EC4899' }}>
                    <div className="stat-header">
                        <span className="stat-icon" style={{ color: '#EC4899' }}><Users /></span>
                    </div>
                    <div className="stat-label">Customers</div>
                    <div className="stat-value">{metrics.customers}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                {/* Left Column: Recent Orders */}
                <div className="table-container" style={{ height: 'fit-content' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recent Orders</h2>
                        <Link href="/admin/orders" style={{ color: '#3B82F6', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>View All <ChevronRight size={16}/></Link>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td></tr>
                            ) : (
                                recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="font-mono text-xs">{order.id.slice(0,8)}</td>
                                        <td>{order.customers?.full_name || 'Unknown'}</td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(order.total_amount)}</td>
                                        <td>
                                            {order.approval_status === 'Pending Approval' ? (
                                                <span className="badge" style={{ background: '#FEF08A', color: '#854D0E' }}>Pending Appr.</span>
                                            ) : (
                                                <span className={`badge badge-${order.status?.toLowerCase() || 'pending'}`}>{order.status}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Right Column: Action Required Widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Verification Required */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ padding: '16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#0F172A' }}>
                            <AlertTriangle size={18} color="#EAB308" /> Pending Verifications ({pendingApprovalOrders.length})
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {pendingApprovalOrders.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>All orders verified.</p>
                            ) : (
                                pendingApprovalOrders.slice(0,3).map(po => (
                                    <div key={po.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{po.customers?.full_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{formatCurrency(po.total_amount)} &middot; {new Date(po.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <Link href="/admin/orders" className="btn btn-sm btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Review</Link>
                                    </div>
                                ))
                            )}
                            {pendingApprovalOrders.length > 3 && (
                                <Link href="/admin/orders" style={{ fontSize: '0.85rem', color: '#3B82F6', textAlign: 'center', display: 'block', marginTop: '8px' }}>+ {pendingApprovalOrders.length - 3} more</Link>
                            )}
                        </div>
                    </div>

                    {/* Delayed Orders Warning */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ padding: '16px', background: '#FEF2F2', borderBottom: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#991B1B' }}>
                            <Clock size={18} color="#DC2626" /> Delivery Warnings ({delayedOrders.length})
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {delayedOrders.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>No upcoming delivery risks.</p>
                            ) : (
                                delayedOrders.map(delayedOrder => {
                                    const isBreached = new Date(delayedOrder.expected_delivery_date) < new Date();
                                    return (
                                        <div key={delayedOrder.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: isBreached ? '#DC2626' : '#B45309' }}>{delayedOrder.customers?.full_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                                    Due: {new Date(delayedOrder.expected_delivery_date).toLocaleDateString()} 
                                                    {isBreached ? <span style={{color: '#DC2626', marginLeft: '4px'}}>(Delayed)</span> : <span style={{color: '#B45309', marginLeft: '4px'}}>(Approaching)</span>}
                                                </div>
                                            </div>
                                            <span className={`badge badge-${delayedOrder.status?.toLowerCase().replace(/\s/g, '-') || 'pending'}`} style={{ fontSize: '0.65rem' }}>{delayedOrder.status}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
