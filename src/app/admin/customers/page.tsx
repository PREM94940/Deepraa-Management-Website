"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types';
import { Plus, Phone, AlertTriangle, ShieldCheck, Edit, Trash2, X } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import Link from 'next/link';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLoyalty, setFilterLoyalty] = useState('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // New customer form
    const [newCustomer, setNewCustomer] = useState({ full_name: '', phone_number: '', city: '' });
    const [adding, setAdding] = useState(false);
    
    // Edit customer form
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchCustomers();

        // Real-time sync
        const channel = supabase.channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customers'
                },
                (payload) => {
                    console.log('Real-time update received:', payload);
                    fetchCustomers(); // Refetch to get updated relations and sorted data
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
        } catch (err: any) {
            alert("Error adding customer: " + err.message);
        } finally {
            setAdding(false);
        }
    }

    async function handleUpdateCustomer(e: React.FormEvent) {
        e.preventDefault();
        if (!editingCustomer) return;
        setUpdating(true);
        try {
            const { error } = await supabase.from('customers').update({
                full_name: editingCustomer.full_name,
                phone_number: editingCustomer.phone_number,
                city: editingCustomer.city
            }).eq('id', editingCustomer.id);
            if (error) throw error;
            
            setIsEditModalOpen(false);
            setEditingCustomer(null);
        } catch (err: any) {
            alert("Error updating customer: " + err.message);
        } finally {
            setUpdating(false);
        }
    }

    const formatCurrency = useCallback((val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val), []);

    async function handleDeleteSelected(ids: string[]) {
        try {
            const { error } = await supabase.from('customers').delete().in('id', ids);
            if (error) throw error;
        } catch (err: any) {
            alert('Error deleting customers: ' + err.message);
        }
    }

    const columns = useMemo(() => [
        {
            key: 'full_name',
            header: 'Identity',
            sortable: true,
            render: (c: Customer) => (
                <>
                    <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Phone size={12} /> {c.phone_number}
                    </div>
                </>
            )
        },
        {
            key: 'loyalty_level',
            header: 'Loyalty / Risk',
            sortable: true,
            render: (c: Customer) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                    <span style={{
                        background: c.loyalty_level === 'Platinum' ? '#000' : c.loyalty_level === 'Gold' ? '#FEF3C7' : '#F1F5F9',
                        color: c.loyalty_level === 'Platinum' ? '#FFF' : c.loyalty_level === 'Gold' ? '#B45309' : '#475569',
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                    }}>
                        {c.loyalty_level}
                    </span>
                    {c.risk_level === 'High' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>
                            <AlertTriangle size={12} /> High Risk
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'total_spent',
            header: 'Total Spent',
            sortable: true,
            render: (c: Customer) => (
                <span style={{ fontWeight: 600, color: '#10B981' }}>
                    {formatCurrency(c.total_spent || 0)}
                </span>
            )
        },
        {
            key: 'total_orders',
            header: 'Orders / Issues',
            sortable: true,
            render: (c: Customer) => (
                <>
                    <div style={{ fontSize: '0.85rem' }}>
                        <strong>{c.total_orders}</strong> Orders
                    </div>
                    {((c.complaint_count || 0) > 0 || (c.refund_count || 0) > 0) && (
                        <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '2px' }}>
                            {c.complaint_count} Complaints &middot; {c.refund_count} Refunds
                        </div>
                    )}
                </>
            )
        },
        {
            key: 'city',
            header: 'Location',
            sortable: true,
            render: (c: Customer) => (
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>{c.city || '--'}</span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (c: Customer) => (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link href={`/admin/customers/${c.id}`} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'inline-block' }}>View Profile</Link>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingCustomer(c);
                            setIsEditModalOpen(true);
                        }}
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit Customer"
                    >
                        <Edit size={14} />
                    </button>
                </div>
            )
        }
    ], [formatCurrency]);

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
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
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

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading CRM data...</div>
                ) : (
                    <DataTable 
                        data={customers}
                        columns={columns}
                        searchKey="full_name"
                        onDeleteSelected={handleDeleteSelected}
                        getId={(c) => c.id || ''}
                        filename="customers.csv"
                        renderGridCard={(c) => (
                            <div style={{ padding: '16px', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', height: '100%' }}>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>{c.full_name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                                    <Phone size={14} /> {c.phone_number}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '12px' }}>
                                    <span style={{ fontWeight: 600, color: '#10B981' }}>{formatCurrency(c.total_spent || 0)}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{c.total_orders} Orders</span>
                                </div>
                            </div>
                        )}
                    />
                )}
            </div>

            {/* Add Customer Modal */}
            {isAddModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ background: 'var(--surface-color, #1A1A1A)', border: '1px solid var(--border-color, #333)', padding: '32px', borderRadius: '16px', width: '400px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary, #FFF)' }}>Add Customer Manually</h2>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary, #A0AEC0)' }}>Full Name *</label>
                                <input required type="text" value={newCustomer.full_name} onChange={e => setNewCustomer({...newCustomer, full_name: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color, #000)', border: '1px solid var(--border-color, #333)', borderRadius: '8px', color: '#FFF' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary, #A0AEC0)' }}>Phone Number *</label>
                                <input required type="tel" value={newCustomer.phone_number} onChange={e => setNewCustomer({...newCustomer, phone_number: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color, #000)', border: '1px solid var(--border-color, #333)', borderRadius: '8px', color: '#FFF' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary, #A0AEC0)' }}>City (Optional)</label>
                                <input type="text" value={newCustomer.city} onChange={e => setNewCustomer({...newCustomer, city: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color, #000)', border: '1px solid var(--border-color, #333)', borderRadius: '8px', color: '#FFF' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" disabled={adding} className="btn btn-primary" style={{ flex: 1 }}>{adding ? 'Saving...' : 'Save Customer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Customer Modal */}
            {isEditModalOpen && editingCustomer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ background: 'var(--surface-color, #1A1A1A)', border: '1px solid var(--border-color, #333)', padding: '32px', borderRadius: '16px', width: '400px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary, #FFF)' }}>Edit Customer</h2>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary, #A0AEC0)' }}>Full Name *</label>
                                <input required type="text" value={editingCustomer.full_name} onChange={e => setEditingCustomer({...editingCustomer, full_name: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color, #000)', border: '1px solid var(--border-color, #333)', borderRadius: '8px', color: '#FFF' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary, #A0AEC0)' }}>Phone Number *</label>
                                <input required type="tel" value={editingCustomer.phone_number} onChange={e => setEditingCustomer({...editingCustomer, phone_number: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color, #000)', border: '1px solid var(--border-color, #333)', borderRadius: '8px', color: '#FFF' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary, #A0AEC0)' }}>City (Optional)</label>
                                <input type="text" value={editingCustomer.city} onChange={e => setEditingCustomer({...editingCustomer, city: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color, #000)', border: '1px solid var(--border-color, #333)', borderRadius: '8px', color: '#FFF' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" disabled={updating} className="btn btn-primary" style={{ flex: 1 }}>{updating ? 'Updating...' : 'Update Customer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
