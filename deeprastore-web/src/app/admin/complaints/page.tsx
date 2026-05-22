"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Complaint, Order, Customer } from '@/types';
import { Search, Plus, X } from 'lucide-react';

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    
    // Modal state
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [issueType, setIssueType] = useState('Replacement');
    const [issueReason, setIssueReason] = useState('');
    const [refundAmount, setRefundAmount] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchComplaints();
        fetchOrdersForDropdown();
    }, [filter]);

    async function fetchComplaints() {
        setLoading(true);
        let query = supabase.from('complaints').select(`
            *,
            orders (id, total_amount),
            customers (id, full_name, phone_number)
        `).order('created_at', { ascending: false });

        if (filter !== 'All') {
            query = query.eq('status', filter);
        }

        const { data } = await query;
        if (data) setComplaints(data);
        setLoading(false);
    }

    async function fetchOrdersForDropdown() {
        const { data } = await supabase.from('orders').select('id, customers(full_name)').order('created_at', { ascending: false }).limit(50);
        if (data) setOrders(data as any);
    }

    async function handleCreateComplaint(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedOrderId) return alert('Please select an order');
        
        setSaving(true);
        // Find customer_id from selected order
        const { data: orderData } = await supabase.from('orders').select('customer_id').eq('id', selectedOrderId).single();
        
        if (!orderData) {
            setSaving(false);
            return alert('Order not found');
        }

        const { error } = await supabase.from('complaints').insert([{
            order_id: selectedOrderId,
            customer_id: orderData.customer_id,
            issue_type: issueType,
            issue_reason: issueReason,
            refund_amount: refundAmount,
            status: 'Open'
        }]);

        setSaving(false);
        if (error) return alert(error.message);
        
        setShowModal(false);
        fetchComplaints();
        // reset form
        setSelectedOrderId('');
        setIssueReason('');
        setRefundAmount(0);
    }

    async function updateStatus(id: string, newStatus: string) {
        const { error } = await supabase.from('complaints').update({ status: newStatus }).eq('id', id);
        if (!error) fetchComplaints();
    }

    return (
        <div>
            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Complaints & Issues</h1>
                    <p>Manage customer returns, refunds, and alterations.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> New Ticket
                </button>
            </div>

            <div className="table-container">
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, overflowX: 'auto' }}>
                    {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(status => (
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
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading tickets...</div>
                ) : complaints.length === 0 ? (
                    <div className="empty-state">
                        <p>No complaints found.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Order Ref</th>
                                    <th>Issue Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map(c => (
                                    <tr key={c.id}>
                                        <td className="font-mono text-xs">{c.id.slice(0, 8)}</td>
                                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{c.customers?.full_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{c.customers?.phone_number}</div>
                                        </td>
                                        <td className="font-mono text-xs text-blue-600">
                                            ORD-{c.order_id.slice(0,6)}
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600 }}>{c.issue_type}</span>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {c.issue_reason}
                                            </div>
                                        </td>
                                        <td>
                                            <select 
                                                value={c.status}
                                                onChange={(e) => updateStatus(c.id, e.target.value)}
                                                style={{ 
                                                    padding: '4px 8px', 
                                                    borderRadius: '6px', 
                                                    border: '1px solid #E2E8F0',
                                                    background: c.status === 'Open' ? '#FEF2F2' : c.status === 'Resolved' ? '#F0FDF4' : '#F8FAFC',
                                                    color: c.status === 'Open' ? '#EF4444' : c.status === 'Resolved' ? '#10B981' : '#0F172A'
                                                }}
                                            >
                                                <option value="Open">Open</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button onClick={() => alert('Complaint details coming soon')} className="btn btn-outline btn-sm">View Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#FFF', width: '90%', maxWidth: '500px', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>New Complaint Ticket</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748B" /></button>
                        </div>

                        <form onSubmit={handleCreateComplaint}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Select Order</label>
                                <select 
                                    required
                                    value={selectedOrderId}
                                    onChange={e => setSelectedOrderId(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                >
                                    <option value="">-- Select Recent Order --</option>
                                    {orders.map((o: any) => (
                                        <option key={o.id} value={o.id}>
                                            {o.id.slice(0,8)} - {o.customers?.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Issue Type</label>
                                <select 
                                    value={issueType}
                                    onChange={e => setIssueType(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                >
                                    <option value="Replacement">Replacement</option>
                                    <option value="Refund">Refund</option>
                                    <option value="Alteration">Alteration</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Issue Details / Reason</label>
                                <textarea 
                                    required
                                    value={issueReason}
                                    onChange={e => setIssueReason(e.target.value)}
                                    rows={3}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                    placeholder="Describe the customer's issue..."
                                />
                            </div>

                            {issueType === 'Refund' && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Refund Amount (₹)</label>
                                    <input 
                                        type="number"
                                        value={refundAmount}
                                        onChange={e => setRefundAmount(Number(e.target.value))}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Creating...' : 'Create Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
