"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminOverviewPage() {
    const [metrics, setMetrics] = useState({
        revenue: 0,
        orders: 0,
        products: 0,
        customers: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // Fetch counts
                const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
                const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
                const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
                
                // Fetch revenue (sum of total_amount from orders where status != cancelled)
                const { data: revenueData } = await supabase.from('orders').select('total_amount').neq('status', 'cancelled');
                const totalRevenue = revenueData ? revenueData.reduce((sum, order) => sum + Number(order.total_amount), 0) : 0;

                setMetrics({
                    revenue: totalRevenue,
                    orders: orderCount || 0,
                    products: productCount || 0,
                    customers: customerCount || 0
                });

                // Fetch recent orders with customer names
                const { data: recent } = await supabase
                    .from('orders')
                    .select(`
                        id, 
                        total_amount, 
                        status, 
                        created_at,
                        customers ( full_name )
                    `)
                    .order('created_at', { ascending: false })
                    .limit(5);
                
                if (recent) setRecentOrders(recent);
            } catch (err) {
                console.error("Error fetching dashboard data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    const stats = [
        { label: 'Revenue', value: formatCurrency(metrics.revenue), change: '+18%', positive: true, icon: 'fa-rupee-sign', color: '#10B981' },
        { label: 'Orders', value: metrics.orders.toString(), change: '+12%', positive: true, icon: 'fa-cart-shopping', color: '#8B5CF6' },
        { label: 'Products', value: metrics.products.toString(), change: '+8%', positive: true, icon: 'fa-box', color: '#3B82F6' },
        { label: 'Customers', value: metrics.customers.toString(), change: '+24%', positive: true, icon: 'fa-user', color: '#EC4899' }
    ];

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    return (
        <div>
            <div className="content-header">
                <h1>Dashboard Overview</h1>
                <p>Welcome back, Admin! Here's your live data from Supabase V5.</p>
            </div>

            <div className="stats-grid">
                {stats.map(stat => (
                    <div key={stat.label} className="card">
                        <div className="stat-header">
                            <span className="stat-icon" style={{ color: stat.color }}>
                                <i className={`fas ${stat.icon}`}></i>
                            </span>
                            <span className={`stat-badge`} style={{ background: stat.positive ? '#D1FAE5' : '#FEE2E2', color: stat.positive ? '#059669' : '#DC2626' }}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="stat-label">{stat.label}</div>
                        <div className="stat-value">{stat.value}</div>
                    </div>
                ))}
            </div>

            <div className="table-container">
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Recent Orders</h2>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No orders found yet.</td></tr>
                        ) : (
                            recentOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="font-mono text-xs">{order.id.slice(0,8)}...</td>
                                    <td>{order.customers?.full_name || 'Unknown'}</td>
                                    <td style={{ fontWeight: 600 }}>{formatCurrency(order.total_amount)}</td>
                                    <td>
                                        <span className={`badge badge-${order.status?.toLowerCase() || 'pending'}`}>
                                            {order.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
