"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUserRoleAction } from '@/lib/actions/auth';
import { Clock, Globe, ArrowLeftRight, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function ActivityDashboard() {
    const [role, setRole] = useState<string>('Staff');
    const [loading, setLoading] = useState(true);
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'publishes' | 'audits'>('all');

    useEffect(() => {
        async function init() {
            setLoading(true);
            let userRole = 'Staff';
            try {
                const res = await getCurrentUserRoleAction();
                if (res && res.role && res.role !== 'anonymous') {
                    userRole = res.role;
                } else {
                    // Client-side fallback if server action returns anonymous
                    userRole = (process.env.NEXT_PUBLIC_SIMULATE_ROLE as string) || 'Staff';
                }
            } catch (err) {
                userRole = (process.env.NEXT_PUBLIC_SIMULATE_ROLE as string) || 'Staff';
            }
            
            setRole(userRole);

            if (userRole === 'Manager') {
                await fetchActivity();
            }
            setLoading(false);
        }
        init();
    }, []);

    async function fetchActivity() {
        try {
            const [snapRes, auditRes] = await Promise.all([
                supabase.from('cms_publish_snapshots')
                    .select('*, published_by_user:published_by (email)')
                    .order('published_at', { ascending: false })
                    .limit(50),
                supabase.from('page_audit_logs')
                    .select('*, user:user_id (email)')
                    .order('created_at', { ascending: false })
                    .limit(100)
            ]);

            setSnapshots(snapRes.data || []);
            setAuditLogs(auditRes.data || []);
        } catch (error) {
            console.error("Failed to fetch activity logs", error);
        }
    }

    if (loading) {
        return <div className="p-8 text-[#A3A3A3]">Loading observability dashboard...</div>;
    }

    if (role !== 'Manager') {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Access Denied. Only Managers can view the Operational Activity Dashboard.
            </div>
        );
    }

    // Combine and sort events
    const allEvents = [
        ...snapshots.map(s => ({ ...s, type: 'snapshot', date: new Date(s.published_at) })),
        ...auditLogs.map(a => ({ ...a, type: 'audit', date: new Date(a.created_at) }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    const displayEvents = activeTab === 'all' 
        ? allEvents 
        : activeTab === 'publishes' 
            ? allEvents.filter(e => e.type === 'snapshot')
            : allEvents.filter(e => e.type === 'audit');

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 text-[#E5E5E5]">
            <div className="flex justify-between items-end border-b border-[#262626] pb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider text-[#D4AF37]">Operational Observability</h1>
                    <p className="text-sm text-[#A3A3A3] mt-1">Real-time CMS activity, publish timelines, and editor governance logs.</p>
                </div>
                <div className="flex bg-[#161616] p-1 rounded border border-[#262626]">
                    <button 
                        onClick={() => setActiveTab('all')} 
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded ${activeTab === 'all' ? 'bg-[#D4AF37] text-black' : 'text-[#A3A3A3] hover:text-white'}`}
                    >
                        Timeline
                    </button>
                    <button 
                        onClick={() => setActiveTab('publishes')} 
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded ${activeTab === 'publishes' ? 'bg-[#D4AF37] text-black' : 'text-[#A3A3A3] hover:text-white'}`}
                    >
                        Releases
                    </button>
                    <button 
                        onClick={() => setActiveTab('audits')} 
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded ${activeTab === 'audits' ? 'bg-[#D4AF37] text-black' : 'text-[#A3A3A3] hover:text-white'}`}
                    >
                        Editor Audit
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#161616] border border-[#262626] p-6 rounded text-center">
                    <div className="text-4xl font-bold text-[#D4AF37] mb-2">{snapshots.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3]">Total Releases</div>
                </div>
                <div className="bg-[#161616] border border-[#262626] p-6 rounded text-center">
                    <div className="text-4xl font-bold text-red-400 mb-2">{snapshots.filter(s => s.rollback_source_metadata).length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3]">Rollbacks</div>
                </div>
                <div className="bg-[#161616] border border-[#262626] p-6 rounded text-center">
                    <div className="text-4xl font-bold text-white mb-2">{auditLogs.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3]">Editor Events</div>
                </div>
            </div>

            <div className="space-y-4">
                {displayEvents.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-[#333] text-[#A3A3A3] text-sm rounded">
                        No activity recorded yet.
                    </div>
                ) : (
                    displayEvents.map((event, idx) => {
                        const isSnapshot = event.type === 'snapshot';
                        const isRollback = isSnapshot && !!event.rollback_source_metadata;
                        const actionText = isSnapshot 
                            ? (isRollback ? 'Rollback Deployed' : 'Live Release Deployed')
                            : event.action;

                        let Icon = Clock;
                        let iconColor = 'text-[#A3A3A3]';
                        let bgColor = 'bg-[#161616]';
                        let borderColor = 'border-[#262626]';

                        if (isSnapshot) {
                            Icon = isRollback ? ArrowLeftRight : Globe;
                            iconColor = isRollback ? 'text-red-400' : 'text-green-400';
                            borderColor = isRollback ? 'border-red-900/50' : 'border-green-900/50';
                            bgColor = isRollback ? 'bg-red-950/10' : 'bg-green-950/10';
                        } else if (event.action.includes('Approved')) {
                            Icon = CheckCircle2;
                            iconColor = 'text-green-400';
                        } else if (event.action.includes('Rejected')) {
                            Icon = XCircle;
                            iconColor = 'text-rose-400';
                        } else if (event.action.includes('Draft')) {
                            Icon = Clock;
                            iconColor = 'text-amber-400';
                        }

                        return (
                            <div key={idx} className={`flex items-start gap-4 p-5 rounded border ${borderColor} ${bgColor}`}>
                                <div className={`p-2 rounded bg-[#0C0C0C] border border-[#262626] ${iconColor}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-sm font-bold tracking-wide ${isSnapshot ? 'uppercase text-white' : 'text-[#E5E5E5]'}`}>
                                            {actionText}
                                        </h3>
                                        <span className="text-xs text-[#A3A3A3] font-mono">
                                            {event.date.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#A3A3A3]">
                                        By: <span className="text-[#D4AF37] font-medium">{event.published_by_user?.email || event.user?.email || 'System / Staff'}</span>
                                    </p>
                                    
                                    {isSnapshot && event.publish_notes && (
                                        <div className="mt-2 p-3 bg-[#0C0C0C] border border-[#262626] rounded text-xs text-[#E5E5E5] italic">
                                            "{event.publish_notes}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
