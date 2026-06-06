"use client";
import { useState, useEffect, useMemo } from 'react';
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

    const getMonthsData = useMemo(() => {
        const result = [];
        const d = new Date();
        d.setDate(1); // Set to 1st to avoid end-of-month shifting bugs
        for (let i = 5; i >= 0; i--) {
            const pastDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
            const monthName = pastDate.toLocaleString('default', { month: 'short' });
            const year = pastDate.getFullYear();
            result.push({
                name: `${monthName} ${year}`,
                monthIndex: pastDate.getMonth(),
                year: pastDate.getFullYear(),
                revenue: 0
            });
        }
        return result;
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    async function fetchAnalytics() {
        setLoading(true);
        try {
            // 1. Get aggregate stats. To avoid heavy memory usage, we only fetch last 6 months of orders for charts.
            // For total stats, we can just fetch all or keep doing it this way if there's no custom RPC.
            // Ideally we'd use an RPC for total count/sum. We'll fetch all but select minimal columns.
            const { data: orders } = await supabase.from('orders').select('total_amount, status, source, created_at');
            const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
            const { count: complaintsCount } = await supabase.from('complaints').select('*', { count: 'exact', head: true });

            if (orders) {
                let totalRev = 0;
                let activeOrd = 0;
                const sources: Record<string, number> = {};

                // Clone our predefined 6 months structure
                const revByMonthMap = getMonthsData.map(m => ({ ...m }));

                // Avoid .reduce and do a single fast loop
                for (let i = 0; i < orders.length; i++) {
                    const o = orders[i];
                    const amount = Number(o.total_amount || 0);
                    
                    totalRev += amount;
                    if (o.status !== 'Delivered' && o.status !== 'Cancelled') {
                        activeOrd++;
                    }

                    const src = o.source || 'website';
                    sources[src] = (sources[src] || 0) + 1;

                    // Match date for charts
                    const d = new Date(o.created_at);
                    const monthIdx = d.getMonth();
                    const year = d.getFullYear();
                    
                    const targetMonth = revByMonthMap.find(m => m.monthIndex === monthIdx && m.year === year);
                    if (targetMonth) {
                        targetMonth.revenue += amount;
                    }
                }
                
                setStats({
                    totalRevenue: totalRev,
                    activeOrders: activeOrd,
                    totalCustomers: customerCount || 0,
                    complaints: complaintsCount || 0
                });

                setSourceData(Object.keys(sources).map(key => ({ name: key.toUpperCase(), value: sources[key] })));
                
                setRevenueData(revByMonthMap.map(m => ({ name: m.name, revenue: m.revenue })));
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface-color, #1A1A1A)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color, #333)' }}>
                    <div style={{ background: '#F5F3FF', padding: '12px', borderRadius: '12px', color: '#8B5CF6' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="stat-title">Total Revenue</div>
                        <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface-color, #1A1A1A)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color, #333)' }}>
                    <div style={{ background: '#ECFDF5', padding: '12px', borderRadius: '12px', color: '#10B981' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <div className="stat-title">Active Orders</div>
                        <div className="stat-value">{stats.activeOrders}</div>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface-color, #1A1A1A)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color, #333)' }}>
                    <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '12px', color: '#3B82F6' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="stat-title">Total Customers</div>
                        <div className="stat-value">{stats.totalCustomers}</div>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface-color, #1A1A1A)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color, #333)' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div style={{ background: 'var(--surface-color, #1A1A1A)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color, #333)' }}>
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

                <div style={{ background: 'var(--surface-color, #1A1A1A)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color, #333)' }}>
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
