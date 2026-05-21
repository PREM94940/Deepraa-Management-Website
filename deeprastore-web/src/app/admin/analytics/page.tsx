"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingBag, AlertTriangle } from 'lucide-react';

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        activeOrders: 0,
        totalCustomers: 0,
        complaints: 0
    });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [sourceData, setSourceData] = useState<any[]>([]);

    const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

    useEffect(() => {
        fetchAnalytics();
    }, []);

    async function fetchAnalytics() {
        setLoading(true);
        try {
            // 1. Get aggregate stats
            const { data: orders } = await supabase.from('orders').select('total_amount, status, source, created_at');
            const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
            const { count: complaintsCount } = await supabase.from('complaints').select('*', { count: 'exact', head: true });

            if (orders) {
                const totalRev = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
                const activeOrd = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;
                
                setStats({
                    totalRevenue: totalRev,
                    activeOrders: activeOrd,
                    totalCustomers: customerCount || 0,
                    complaints: complaintsCount || 0
                });

                // Process Source Data for Pie Chart
                const sources = orders.reduce((acc: any, o) => {
                    const src = o.source || 'website';
                    acc[src] = (acc[src] || 0) + 1;
                    return acc;
                }, {});
                setSourceData(Object.keys(sources).map(key => ({ name: key.toUpperCase(), value: sources[key] })));

                // Process Revenue Data for Bar Chart (Last 6 months approx, or just by month)
                const revByMonth = orders.reduce((acc: any, o) => {
                    const date = new Date(o.created_at);
                    const month = date.toLocaleString('default', { month: 'short' });
                    acc[month] = (acc[month] || 0) + Number(o.total_amount || 0);
                    return acc;
                }, {});
                
                // Default empty months for demo purposes if no data
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const chartData = months.map(m => ({ name: m, revenue: revByMonth[m] || 0 }));
                // Filter only months up to current for better view, or just show all if data exists
                const currentMonthIdx = new Date().getMonth();
                setRevenueData(chartData.slice(Math.max(0, currentMonthIdx - 5), currentMonthIdx + 1));
            }

        } catch (error) {
            console.error("Error fetching analytics", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

    return (
        <div>
            <div className="content-header" style={{ marginBottom: '24px' }}>
                <h1>Analytics & Reports</h1>
                <p>Overview of your business performance.</p>
            </div>

            {/* Top KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#F5F3FF', padding: '12px', borderRadius: '12px', color: '#8B5CF6' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="stat-title">Total Revenue</div>
                        <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#ECFDF5', padding: '12px', borderRadius: '12px', color: '#10B981' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <div className="stat-title">Active Orders</div>
                        <div className="stat-value">{stats.activeOrders}</div>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '12px', color: '#3B82F6' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="stat-title">Total Customers</div>
                        <div className="stat-value">{stats.totalCustomers}</div>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#FEF2F2', padding: '12px', borderRadius: '12px', color: '#EF4444' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <div className="stat-title">Complaints</div>
                        <div className="stat-value">{stats.complaints}</div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>Revenue Overview (Last 6 Months)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                                <Tooltip cursor={{fill: '#F8FAFC'}} formatter={(value) => [`₹${value}`, 'Revenue']} />
                                <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>Sales by Channel</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
