"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tierFilter, setTierFilter] = useState('All');

    useEffect(() => {
        fetchCustomers();
    }, [tierFilter]);

    async function fetchCustomers() {
        setLoading(true);
        try {
            let query = supabase.from('customers').select('*').order('lifetime_value', { ascending: false });
            
            if (tierFilter !== 'All') {
                query = query.eq('vip_tier', tierFilter.toLowerCase());
            }
            
            const { data, error } = await query;
            if (error) throw error;
            setCustomers(data || []);
        } catch (err) {
            console.error("Error fetching customers:", err);
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    const getTierColor = (tier: string) => {
        switch(tier) {
            case 'platinum': return '#000000';
            case 'gold': return '#EAB308';
            case 'silver': return '#94A3B8';
            default: return '#E2E8F0';
        }
    };

    return (
        <div>
            <div className="content-header">
                <h1>Customers (Relationship CRM)</h1>
                <p>Manage your customer base, VIP tiers, and preferences.</p>
            </div>

            <div className="table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {['All', 'Platinum', 'Gold', 'Silver', 'None'].map(tier => (
                            <button 
                                key={tier}
                                onClick={() => setTierFilter(tier)}
                                className={`btn ${tierFilter === tier ? 'btn-primary' : 'btn-outline'}`}
                            >
                                {tier}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <input type="text" placeholder="Search customer..." className="px-4 py-2 border border-border rounded-lg text-sm w-64" />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading CRM data...</div>
                ) : customers.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-users" style={{ fontSize: 64, marginBottom: 20, color: '#CBD5E1' }}></i>
                        <p>No customers found.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>VIP Tier</th>
                                    <th>Lifetime Value</th>
                                    <th>Last Conversation</th>
                                    <th>Preferences</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map(cust => (
                                    <tr key={cust.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{cust.full_name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{cust.phone_number}</div>
                                        </td>
                                        <td>
                                            <span style={{
                                                background: cust.vip_tier === 'none' ? '#F1F5F9' : getTierColor(cust.vip_tier),
                                                color: cust.vip_tier === 'none' ? '#64748B' : '#FFF',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase'
                                            }}>
                                                {cust.vip_tier}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#10B981' }}>
                                            {formatCurrency(cust.lifetime_value || 0)}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {cust.last_conversation_date ? new Date(cust.last_conversation_date).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {cust.preferences?.colors?.map((c: string) => (
                                                    <span key={c} style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>{c}</span>
                                                ))}
                                                {cust.preferences?.fabrics?.map((f: string) => (
                                                    <span key={f} style={{ background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>{f}</span>
                                                ))}
                                                {(!cust.preferences?.colors?.length && !cust.preferences?.fabrics?.length) && 
                                                    <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>No data</span>
                                                }
                                            </div>
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
