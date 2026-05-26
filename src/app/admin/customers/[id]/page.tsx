"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer, Order } from '@/types';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MeasurementsForm from '@/components/admin/MeasurementsForm';

export default function CustomerProfilePage() {
    const params = useParams();
    const id = params.id as string;

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');
    const [measurements, setMeasurements] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) fetchCustomerDetails();
    }, [id]);

    async function fetchCustomerDetails() {
        setLoading(true);
        const [custRes, ordRes] = await Promise.all([
            supabase.from('customers').select('*').eq('id', id).single(),
            supabase.from('orders').select('*').eq('customer_id', id).order('created_at', { ascending: false })
        ]);

        if (custRes.data) {
            setCustomer(custRes.data);
            setMeasurements(custRes.data.measurements || {});
        }
        if (ordRes.data) setOrders(ordRes.data);
        setLoading(false);
    }

    async function handleSaveMeasurements() {
        setSaving(true);
        const { error } = await supabase.from('customers').update({ measurements }).eq('id', id);
        setSaving(false);
        if (error) alert('Error saving measurements: ' + error.message);
        else alert('Measurements saved successfully!');
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile...</div>;
    if (!customer) return <div style={{ padding: '40px', textAlign: 'center' }}>Customer not found.</div>;

    return (
        <div>
            <div className="content-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#64748B' }}>
                        {customer.full_name.charAt(0)}
                    </div>
                    <div>
                        <h1 style={{ marginBottom: '4px' }}>{customer.full_name}</h1>
                        <div style={{ display: 'flex', gap: '12px', color: '#64748B', fontSize: '0.9rem' }}>
                            <span><i className="fas fa-phone"></i> {customer.phone_number}</span>
                            {customer.email && <span><i className="fas fa-envelope"></i> {customer.email}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-title">Total Spent</div>
                    <div className="stat-value">₹{customer.total_spent?.toLocaleString() || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Total Orders</div>
                    <div className="stat-value">{customer.total_orders || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Loyalty Level</div>
                    <div className="stat-value" style={{ color: customer.loyalty_level === 'Gold' ? '#F59E0B' : '#3B82F6' }}>
                        {customer.loyalty_level || 'Bronze'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Risk Profile</div>
                    <div className="stat-value" style={{ color: customer.risk_level === 'High' ? '#EF4444' : '#10B981' }}>
                        {customer.risk_level || 'Low'}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #E2E8F0', marginBottom: '24px' }}>
                {['Overview', 'Measurements', 'Past Orders'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 0',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #3B82F6' : '2px solid transparent',
                            color: activeTab === tab ? '#3B82F6' : '#64748B',
                            fontWeight: activeTab === tab ? 600 : 400,
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="table-container" style={{ padding: '24px' }}>
                {activeTab === 'Overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Contact Information</h3>
                            <p style={{ marginBottom: '8px' }}><strong>WhatsApp:</strong> {customer.whatsapp_number || 'N/A'}</p>
                            <p style={{ marginBottom: '8px' }}><strong>City:</strong> {customer.city || 'N/A'}</p>
                            <p style={{ marginBottom: '8px' }}><strong>Address:</strong> {customer.address || 'N/A'}</p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Notes & Tags</h3>
                            <p style={{ marginBottom: '8px' }}><strong>Tags:</strong> {customer.tags?.join(', ') || 'None'}</p>
                            <p style={{ marginBottom: '8px' }}><strong>Notes:</strong> {customer.notes || 'No notes available.'}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'Measurements' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <p style={{ color: '#64748B' }}>These are the default measurements for this customer. They will automatically fill when creating a new order.</p>
                            <button onClick={handleSaveMeasurements} className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Measurements'}
                            </button>
                        </div>
                        <MeasurementsForm 
                            initialData={measurements}
                            onChange={setMeasurements}
                        />
                    </div>
                )}

                {activeTab === 'Past Orders' && (
                    <div>
                        {orders.length === 0 ? (
                            <p>No orders found for this customer.</p>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td className="font-mono">{order.id.slice(0, 8)}</td>
                                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                            <td>₹{order.total_amount?.toLocaleString()}</td>
                                            <td><span className={`badge badge-${order.status?.toLowerCase()}`}>{order.status}</span></td>
                                            <td><Link href={`/admin/orders/${order.id}`} className="text-blue-500">View</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
