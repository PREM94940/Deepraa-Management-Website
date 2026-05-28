"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import DataTable from '@/components/admin/DataTable';
import { Eye, Edit3, AlertCircle } from 'lucide-react';

export default function SupportTriagePage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchTickets();
    }, [filter]);

    useEffect(() => {
        const channel = supabase.channel('realtime_tickets')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, async (payload) => {
                const { data } = await supabase.from('support_tickets').select(`
                    id, subject, status, priority, category, created_at,
                    customers ( id, full_name, phone_number ),
                    orders ( id, order_number )
                `).eq('id', payload.new.id).single();
                
                if (data) setTickets(prev => [data, ...prev]);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets' }, (payload) => {
                setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchTickets() {
        setLoading(true);
        try {
            let query = supabase.from('support_tickets').select(`
                id,
                subject,
                status,
                priority,
                category,
                created_at,
                customers ( id, full_name, phone_number ),
                orders ( id, order_number )
            `).order('created_at', { ascending: false });

            if (filter !== 'All') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setTickets(data || []);
        } catch (err) {
            console.error("Error fetching tickets:", err);
        } finally {
            setLoading(false);
        }
    }

    const formatDate = (d: string) => {
        const dt = new Date(d);
        return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'New': return { bg: '#FEF2F2', text: '#EF4444', border: '#FECACA' }; // Red
            case 'Under Review': return { bg: '#FFF7ED', text: '#F97316', border: '#FFEDD5' }; // Orange
            case 'Awaiting Customer Response': return { bg: '#FEFCE8', text: '#EAB308', border: '#FEF08A' }; // Yellow
            case 'Tailoring Adjustment Approved': return { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' }; // Blue
            case 'Replacement Approved': return { bg: '#F5F3FF', text: '#8B5CF6', border: '#EDE9FE' }; // Purple
            case 'Resolved': return { bg: '#F0FDF4', text: '#22C55E', border: '#BBF7D0' }; // Green
            case 'Rejected': return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' }; // Gray
            default: return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
        }
    };

    const columns = [
        {
            key: 'id',
            header: 'Ticket ID & Customer',
            render: (t: any) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1E293B' }}>{t.customers?.full_name || 'Unknown Customer'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>TKT-{t.id.slice(0, 8).toUpperCase()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{t.customers?.phone_number || ''}</div>
                </div>
            )
        },
        {
            key: 'subject',
            header: 'Subject & Category',
            render: (t: any) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1E293B', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8B5CF6', fontWeight: 600 }}>{t.category}</div>
                    {t.orders && (
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>Order: {t.orders.order_number || t.orders.id.slice(0,8)}</div>
                    )}
                </div>
            )
        },
        {
            key: 'priority',
            header: 'Priority',
            render: (t: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t.priority === 'High' || t.priority === 'Critical' ? <AlertCircle size={14} color="#EF4444" /> : null}
                    <span style={{ fontSize: '0.8rem', fontWeight: t.priority === 'High' || t.priority === 'Critical' ? 700 : 500, color: t.priority === 'High' || t.priority === 'Critical' ? '#EF4444' : '#64748B' }}>
                        {t.priority}
                    </span>
                </div>
            )
        },
        {
            key: 'created_at',
            header: 'Submitted On',
            sortable: true,
            render: (t: any) => (
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>{formatDate(t.created_at)}</div>
            )
        },
        {
            key: 'status',
            header: 'Triage Status',
            render: (t: any) => {
                const colors = getStatusColor(t.status || 'New');
                return (
                    <span style={{ 
                        background: colors.bg, 
                        color: colors.text, 
                        border: `1px solid ${colors.border}`, 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                    }}>
                        {t.status || 'New'}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            header: 'Action',
            render: (t: any) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                    <Link href={`/admin/support/${t.id}`} onClick={(e) => e.stopPropagation()} title="Resolve Ticket"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: '#EFF6FF', color: '#3B82F6', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
                        <Edit3 size={14} /> Resolve
                    </Link>
                </div>
            )
        }
    ];

    const filters = ['All', 'New', 'Under Review', 'Awaiting Customer Response', 'Tailoring Adjustment Approved', 'Replacement Approved', 'Resolved', 'Rejected'];

    return (
        <div>
            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Support & Returns Triage
                        <span style={{ fontSize: '10px', padding: '2px 6px', background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', background: '#22C55E', borderRadius: '50%', display: 'inline-block' }} className="animate-pulse"></span>
                            Live Sync Active
                        </span>
                    </h1>
                    <p>Manage post-order complaints, tailoring adjustments, and returns.</p>
                </div>
            </div>

            <div className="table-container">
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
                    {filters.map(status => (
                        <button 
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`btn ${filter === status ? 'btn-primary' : 'btn-outline'}`}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading tickets...</div>
                ) : (
                    <DataTable 
                        data={tickets}
                        columns={columns}
                        onDeleteSelected={() => {}} // Disabled mass delete for tickets for audit compliance
                        getId={(t) => t.id}
                        filename="support_tickets.csv"
                    />
                )}
            </div>
        </div>
    );
}
