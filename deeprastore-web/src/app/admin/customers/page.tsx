"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types';
import { Search, Plus, Phone, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLoyalty, setFilterLoyalty] = useState('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // New customer form
    const [newCustomer, setNewCustomer] = useState({ full_name: '', phone_number: '', city: '' });
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, [filterLoyalty]);

    async function fetchCustomers() {
        setLoading(true);
        try {
            let query = supabase.from('customers').select('*').order('total_spent', { ascending: false });
            
            if (filterLoyalty !== 'All') {
                query = query.eq('loyalty_level', filterLoyalty);
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

    async function handleAddCustomer(e: React.FormEvent) {
        e.preventDefault();
        setAdding(true);
        try {
            const { error } = await supabase.from('customers').insert([
                { 
                    full_name: newCustomer.full_name, 
                    phone_number: newCustomer.phone_number,
                    city: newCustomer.city
                }
            ]);
            if (error) throw error;
            
            setIsAddModalOpen(false);
            setNewCustomer({ full_name: '', phone_number: '', city: '' });
            fetchCustomers();
        } catch (err: any) {
            alert("Error adding customer: " + err.message);
        } finally {
            setAdding(false);
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    const filteredCustomers = customers.filter(c => 
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone_number.includes(searchQuery)
    );

    return (
        <div>
            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Customer Identity System</h1>
                    <p>Permanent CRM replacing WhatsApp dependency.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Add Customer
                </button>
            </div>

            <div className="table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {['All', 'Platinum', 'Gold', 'Silver', 'Bronze'].map(tier => (
                            <button 
                                key={tier}
                                onClick={() => setFilterLoyalty(tier)}
                                className={`btn ${filterLoyalty === tier ? 'btn-primary' : 'btn-outline'}`}
                            >
                                {tier}
                            </button>
                        ))}
                    </div>
                    <div className="relative" style={{ display: 'flex', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0 12px' }}>
                        <Search size={16} color="#94A3B8" />
                        <input 
                            type="text" 
                            placeholder="Search phone or name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: 'none', outline: 'none', padding: '10px', fontSize: '0.9rem', width: '250px' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading CRM data...</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="empty-state">
                        <ShieldCheck size={64} color="#CBD5E1" style={{ margin: '0 auto 20px' }} />
                        <p>No customers found.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Identity</th>
                                    <th>Loyalty / Risk</th>
                                    <th>Total Spent</th>
                                    <th>Orders / Issues</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map(cust => (
                                    <tr key={cust.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{cust.full_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                <Phone size={12} /> {cust.phone_number}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                <span style={{
                                                    background: cust.loyalty_level === 'Platinum' ? '#000' : cust.loyalty_level === 'Gold' ? '#FEF3C7' : '#F1F5F9',
                                                    color: cust.loyalty_level === 'Platinum' ? '#FFF' : cust.loyalty_level === 'Gold' ? '#B45309' : '#475569',
                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                                                }}>
                                                    {cust.loyalty_level}
                                                </span>
                                                {cust.risk_level === 'High' && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>
                                                        <AlertTriangle size={12} /> High Risk
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#10B981' }}>
                                            {formatCurrency(cust.total_spent)}
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <strong>{cust.total_orders}</strong> Orders
                                            </div>
                                            {(cust.complaint_count > 0 || cust.refund_count > 0) && (
                                                <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '2px' }}>
                                                    {cust.complaint_count} Complaints &middot; {cust.refund_count} Refunds
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                                            {cust.city || '--'}
                                        </td>
                                        <td>
                                            <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>View Profile</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Customer Modal */}
            {isAddModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#FFF', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Add Customer Manually</h2>
                        <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>Full Name *</label>
                                <input required type="text" value={newCustomer.full_name} onChange={e => setNewCustomer({...newCustomer, full_name: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>Phone Number *</label>
                                <input required type="tel" value={newCustomer.phone_number} onChange={e => setNewCustomer({...newCustomer, phone_number: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>City (Optional)</label>
                                <input type="text" value={newCustomer.city} onChange={e => setNewCustomer({...newCustomer, city: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" disabled={adding} className="btn btn-primary" style={{ flex: 1 }}>{adding ? 'Saving...' : 'Save Customer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
