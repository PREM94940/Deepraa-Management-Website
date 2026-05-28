"use client";
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, AlertTriangle, Send, User, MessageSquare, Sparkles, Check, X } from 'lucide-react';
import { createTicketSummaryAction, reviewAiSuggestionAction } from '@/lib/actions/ai';

export default function SupportTicketResolutionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [ticket, setTicket] = useState<any>(null);
    const [replies, setReplies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Edit States
    const [status, setStatus] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [replyText, setReplyText] = useState('');
    const [saving, setSaving] = useState(false);
    const [replying, setReplying] = useState(false);
    
    // AI States
    const [aiSummary, setAiSummary] = useState<any>(null);
    const [generatingAi, setGeneratingAi] = useState(false);
    const [aiSuggestionId, setAiSuggestionId] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchTicket();
            fetchReplies();
        }
    }, [id]);

    async function fetchTicket() {
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select(`
                    *,
                    customers ( id, full_name, phone_number, email ),
                    orders ( id, order_number, total_amount, status )
                `)
                .eq('id', id)
                .single();
            
            if (error) throw error;
            setTicket(data);
            setStatus(data.status || 'New');
            setAdminNotes(data.admin_notes || '');
        } catch (err) {
            console.error("Error fetching ticket:", err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchReplies() {
        try {
            const { data, error } = await supabase
                .from('ticket_replies')
                .select('*')
                .eq('ticket_id', id)
                .order('created_at', { ascending: true });
            if (!error && data) {
                setReplies(data);
            }
        } catch (err) {
            console.error("Error fetching replies:", err);
        }
    }

    async function handleSaveStatus() {
        if (status === 'Refund Approved') {
            const confirmRefund = window.confirm(
                "🚨 REFUND GOVERNANCE WARNING 🚨\n\n" +
                "Are you absolutely sure you want to approve a refund?\n" +
                "Standard operational doctrine dictates Alteration or Replacement first.\n\n" +
                "Click OK only if authorized by management."
            );
            if (!confirmRefund) {
                setStatus(ticket.status); // Revert
                return;
            }
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ 
                    status, 
                    admin_notes: adminNotes 
                })
                .eq('id', id);

            if (error) throw error;
            alert('Ticket updated successfully.');
            fetchTicket();
        } catch (err: any) {
            alert('Error updating ticket: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleSendReply() {
        if (!replyText.trim()) return;
        setReplying(true);
        try {
            const { error } = await supabase
                .from('ticket_replies')
                .insert([{
                    ticket_id: id,
                    sender_type: 'staff',
                    message: replyText.trim()
                }]);
            
            if (error) throw error;
            setReplyText('');
            fetchReplies();
        } catch (err: any) {
            alert('Error sending reply: ' + err.message);
        } finally {
            setReplying(false);
        }
    }

    async function handleGenerateSummary() {
        setGeneratingAi(true);
        try {
            const res = await createTicketSummaryAction(id);
            if (res.success && res.suggestion) {
                setAiSuggestionId(res.suggestion.id);
                setAiSummary(res.suggestion.generated_content);
            } else {
                alert(res.error || 'Failed to generate summary');
            }
        } catch(err) {
            console.error(err);
        } finally {
            setGeneratingAi(false);
        }
    }

    async function handleReviewAi(status: 'Approved'|'Rejected') {
        if (!aiSuggestionId) return;
        try {
            const res = await reviewAiSuggestionAction(aiSuggestionId, status, aiSummary);
            if (res.success) {
                if (status === 'Approved') {
                    const timestamp = new Date().toLocaleString();
                    const noteStr = `[AI-Generated Operational Summary] | Model: gpt-4o-mini | Time: ${timestamp}\n---\n${aiSummary.summary}\n\nSuggested Priority: ${aiSummary.suggestedPriority}\n---`;
                    setAdminNotes(prev => (prev ? prev + '\n\n' : '') + noteStr);
                    alert('AI Summary approved and added to admin notes.');
                }
                setAiSummary(null);
                setAiSuggestionId(null);
            }
        } catch(err) {
            console.error(err);
        }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Ticket Resolution Console...</div>;
    if (!ticket) return <div style={{ padding: '40px', textAlign: 'center' }}>Ticket not found.</div>;

    const lifecycleStates = [
        'New', 
        'Under Review', 
        'Awaiting Customer Response', 
        'Awaiting Fabric Sourcing',
        'Tailor Rework In Progress',
        'Tailoring Adjustment Approved', 
        'Replacement Approved', 
        'Resolved', 
        'Rejected'
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="content-header" style={{ marginBottom: '24px' }}>
                <Link href="/admin/support" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748B', textDecoration: 'none', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
                    <ChevronLeft size={16} /> Back to Triage Queue
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>Ticket: {ticket.subject}</h1>
                        <div style={{ color: '#64748B', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: 600, color: '#8B5CF6' }}>{ticket.category}</span> &bull; Priority: <span style={{ fontWeight: ticket.priority === 'High' ? 700 : 500, color: ticket.priority === 'High' ? '#EF4444' : 'inherit' }}>{ticket.priority}</span> &bull; Created {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                {/* Left Column: Communications & Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* AI Assistant Summarizer */}
                    <div style={{ background: '#F5F3FF', borderRadius: '12px', border: '1px solid #C4B5FD', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#8B5CF6' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#4C1D95', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Sparkles size={18} color="#8B5CF6" /> AI Ticket Summarizer
                            </h2>
                            {!aiSummary && (
                                <button 
                                    onClick={handleGenerateSummary} 
                                    disabled={generatingAi}
                                    style={{ background: '#8B5CF6', color: '#FFF', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: generatingAi ? 'not-allowed' : 'pointer', opacity: generatingAi ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {generatingAi ? 'Analyzing...' : 'Generate Summary'}
                                </button>
                            )}
                        </div>
                        
                        {aiSummary && (
                            <div style={{ background: '#FFF', borderRadius: '8px', padding: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: '16px' }}>
                                    {aiSummary.summary}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#64748B', fontWeight: 600 }}>Suggested Priority:</span>
                                    <span style={{ 
                                        background: aiSummary.suggestedPriority === 'High' ? '#FEF2F2' : '#F1F5F9', 
                                        color: aiSummary.suggestedPriority === 'High' ? '#EF4444' : '#64748B', 
                                        padding: '2px 8px', borderRadius: '4px', fontWeight: 600 
                                    }}>
                                        {aiSummary.suggestedPriority}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px dashed #E2E8F0' }}>
                                    <button onClick={() => handleReviewAi('Approved')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                                        <Check size={16} /> Approve & Append to Notes
                                    </button>
                                    <button onClick={() => handleReviewAi('Rejected')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                                        <X size={16} /> Reject Suggestion
                                    </button>
                                </div>
                            </div>
                        )}
                        {!aiSummary && (
                            <p style={{ fontSize: '0.85rem', color: '#6D28D9', margin: 0 }}>
                                Let AI read the entire thread and generate a concise summary and priority suggestion.
                            </p>
                        )}
                    </div>

                    {/* Customer Issue Details */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={18} color="#F59E0B" /> Customer Issue Description
                        </h2>
                        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#334155', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            {ticket.description}
                        </div>
                        
                        {ticket.proof_attachments && ticket.proof_attachments.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Attached Proofs</h3>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {ticket.proof_attachments.map((url: string, idx: number) => (
                                        <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                                            <img src={url} alt={`Proof ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Customer Communication Thread */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', height: '500px' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={18} color="#3B82F6" /> Communication Thread
                            </h2>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#F8FAFC' }}>
                            {replies.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: '40px', fontSize: '0.9rem' }}>No replies yet. Send a reassuring message to the customer.</div>
                            ) : (
                                replies.map(r => (
                                    <div key={r.id} style={{ alignSelf: r.sender_type === 'staff' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '4px', textAlign: r.sender_type === 'staff' ? 'right' : 'left', textTransform: 'uppercase', fontWeight: 600 }}>
                                            {r.sender_type === 'staff' ? 'Boutique Support' : ticket.customers?.full_name}
                                        </div>
                                        <div style={{ 
                                            background: r.sender_type === 'staff' ? '#1E293B' : '#FFFFFF', 
                                            color: r.sender_type === 'staff' ? '#F8FAFC' : '#0F172A',
                                            padding: '12px 16px', 
                                            borderRadius: '12px', 
                                            border: r.sender_type === 'staff' ? 'none' : '1px solid #E2E8F0',
                                            borderBottomRightRadius: r.sender_type === 'staff' ? '2px' : '12px',
                                            borderBottomLeftRadius: r.sender_type === 'customer' ? '2px' : '12px',
                                            fontSize: '0.95rem',
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.5,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}>
                                            {r.message}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '4px', textAlign: r.sender_type === 'staff' ? 'right' : 'left' }}>
                                            {new Date(r.created_at).toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '12px', background: '#FFF', borderRadius: '0 0 12px 12px' }}>
                            <textarea 
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Type a reassuring message to the customer..."
                                rows={2}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', resize: 'none', fontSize: '0.95rem' }}
                            />
                            <button 
                                onClick={handleSendReply} 
                                disabled={replying || !replyText.trim()}
                                className="btn btn-primary" 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: 'auto', padding: 0, borderRadius: '8px' }}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: State & Private Ops */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Resolution State */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>Resolution State</h2>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Triage Status</label>
                            <select 
                                value={status} 
                                onChange={e => setStatus(e.target.value)} 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.95rem', background: '#F8FAFC' }}
                            >
                                {lifecycleStates.map(s => <option key={s} value={s}>{s}</option>)}
                                <option disabled>──────────</option>
                                <option value="Refund Approved">🚨 Override: Refund Approved</option>
                            </select>
                            {status === 'Refund Approved' && (
                                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#EF4444', background: '#FEF2F2', padding: '12px', borderRadius: '6px', border: '1px solid #FECACA', fontWeight: 600, lineHeight: 1.5 }}>
                                    Warning: Refunding bypasses standard replacement protocols.<br/>
                                    Manager authorization required. You MUST add an operational note below explaining why this refund is being processed instead of an alteration or replacement.
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748B', marginBottom: '8px', fontWeight: 600 }}>
                                <span>Private Operational Notes</span>
                                <span style={{ color: '#EF4444', border: '1px solid #FECACA', background: '#FEF2F2', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.65rem' }}>Staff Only</span>
                            </label>
                            <textarea 
                                value={adminNotes} 
                                onChange={e => setAdminNotes(e.target.value)} 
                                placeholder="e.g. VIP customer, tailoring risk, sourcing delay..."
                                rows={6} 
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', resize: 'vertical', fontSize: '0.9rem', background: '#FFFBEB' }} 
                            />
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '6px' }}>These notes will never be visible to the customer.</div>
                        </div>

                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                            <button onClick={handleSaveStatus} disabled={saving} className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                                <Save size={18} /> {saving ? 'Saving...' : 'Update Ticket State'}
                            </button>
                        </div>
                    </div>

                    {/* Customer & Order Context */}
                    <div style={{ background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} color="#10B981" /> Context
                        </h2>
                        
                        {ticket.customers && (
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Customer</div>
                                <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>{ticket.customers.full_name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#475569' }}>{ticket.customers.email}</div>
                                <div style={{ fontSize: '0.85rem', color: '#475569' }}>{ticket.customers.phone_number}</div>
                            </div>
                        )}

                        {ticket.orders && (
                            <div style={{ paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Order Link</div>
                                <Link href={`/admin/orders/${ticket.orders.id}`} style={{ display: 'block', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', textDecoration: 'none' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#8B5CF6', fontFamily: 'monospace', fontWeight: 700, marginBottom: '4px' }}>{ticket.orders.order_number || ticket.orders.id.slice(0,8)}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Status: <span style={{ fontWeight: 600 }}>{ticket.orders.status}</span></span>
                                        <span style={{ fontWeight: 700 }}>₹{ticket.orders.total_amount}</span>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
