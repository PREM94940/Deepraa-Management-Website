import { supabaseServer } from '@/lib/supabase-server';
import { getCurrentUserRoleAction } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import { ShieldAlert, TrendingUp, AlertTriangle, Cpu, Clock, Bot, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export const revalidate = 0;

export default async function IntelligenceDashboard() {
    const authRes = await getCurrentUserRoleAction();
    if (!authRes.success || authRes.role !== 'Manager') redirect('/admin');

    // Fetch the 5 most recent reports
    const { data: reports } = await supabaseServer
        .from('operational_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(5);

    // Fetch the 10 most recent cron executions for heartbeat
    const { data: crons } = await supabaseServer
        .from('cron_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

    const latestReport = reports?.[0];

    return (
        <div className="p-8 space-y-8 bg-zinc-950 min-h-screen text-zinc-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-widest text-[#D4AF37] uppercase flex items-center gap-3">
                        <HeartPulse size={24} />
                        Boutique Operations Intelligence
                    </h1>
                    <p className="text-sm text-zinc-500 mt-2 font-mono uppercase tracking-widest">
                        Governed Telemetry & Operational Health
                    </p>
                </div>
            </div>

            {/* Latest Report Panel */}
            {latestReport ? (
                <div className="bg-[#111] border border-zinc-800 rounded-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#4C1D95]/10 blur-3xl rounded-full" />
                    
                    <div className="flex items-center justify-between mb-6 border-b border-zinc-800/80 pb-4">
                        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                            Daily Report: <span className="text-zinc-100">{latestReport.report_date}</span>
                        </h2>
                        <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-1 uppercase tracking-widest border border-emerald-800/50">
                            Health Score: {latestReport.overall_health_score || 'N/A'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* Delays */}
                        <div className="p-4 border border-zinc-800/60 bg-zinc-900/50 rounded-sm">
                            <div className="flex items-center gap-2 text-amber-500 mb-2">
                                <Clock size={16} />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Delays</h3>
                            </div>
                            <p className="text-2xl font-mono text-zinc-100">
                                {latestReport.delays_summary?.stalled_orders || 0}
                            </p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Stalled Orders (7+ Days)</p>
                        </div>

                        {/* Escalations */}
                        <div className="p-4 border border-zinc-800/60 bg-zinc-900/50 rounded-sm">
                            <div className="flex items-center gap-2 text-red-500 mb-2">
                                <TrendingUp size={16} />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Escalations</h3>
                            </div>
                            <p className="text-2xl font-mono text-zinc-100">
                                {latestReport.escalations_summary?.urgent_tickets || 0}
                            </p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Urgent Support Tickets</p>
                        </div>

                        {/* Governance */}
                        <div className="p-4 border border-zinc-800/60 bg-zinc-900/50 rounded-sm">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <ShieldAlert size={16} />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Governance</h3>
                            </div>
                            <p className="text-sm font-mono text-zinc-300 line-clamp-2">
                                {latestReport.governance_alerts?.alerts || 'Clean'}
                            </p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Security / RBAC Health</p>
                        </div>

                        {/* AI Usage */}
                        <div className="p-4 border border-[#8B5CF6]/20 bg-zinc-900/50 rounded-sm">
                            <div className="flex items-center gap-2 text-[#A78BFA] mb-2">
                                <Bot size={16} />
                                <h3 className="text-xs font-bold uppercase tracking-widest">AI Agent Usage</h3>
                            </div>
                            <div className="space-y-1 font-mono text-[11px] text-zinc-300">
                                <div className="flex justify-between">
                                    <span>Approved:</span>
                                    <span className="text-emerald-400">{latestReport.ai_usage_patterns?.approved || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Rejected:</span>
                                    <span className="text-red-400">{latestReport.ai_usage_patterns?.rejected || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Human Edited:</span>
                                    <span className="text-amber-400">{latestReport.ai_usage_patterns?.edited_by_human || 0}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="p-8 border border-zinc-800 bg-[#111] text-center text-xs font-mono uppercase tracking-widest text-zinc-500">
                    No intelligence reports generated yet.
                </div>
            )}

            {/* Cron Heartbeat Monitor */}
            <div className="mt-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                    <Cpu size={16} />
                    Agentic Cron Heartbeat
                </h2>
                <div className="bg-[#111] border border-zinc-800 rounded-sm overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-500 uppercase tracking-widest">
                            <tr>
                                <th className="p-3">Schedule Name</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Started At</th>
                                <th className="p-3">Duration (ms)</th>
                                <th className="p-3">Rows Affected</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {crons && crons.length > 0 ? (
                                crons.map((cron) => (
                                    <tr key={cron.id} className="hover:bg-zinc-900/50 transition-colors">
                                        <td className="p-3 text-zinc-300">{cron.cron_name}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-sm uppercase tracking-widest text-[9px] border ${
                                                cron.status === 'Success' ? 'bg-emerald-950 text-emerald-500 border-emerald-900/50' : 
                                                cron.status === 'Running' ? 'bg-amber-950 text-amber-500 border-amber-900/50 animate-pulse' :
                                                'bg-red-950 text-red-500 border-red-900/50'
                                            }`}>
                                                {cron.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-zinc-500">{new Date(cron.started_at).toLocaleString()}</td>
                                        <td className="p-3 text-zinc-400">{cron.duration_ms || '-'}</td>
                                        <td className="p-3 text-zinc-400">{cron.rows_affected}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-zinc-600 uppercase tracking-widest">
                                        No telemetry recorded.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
        </div>
    );
}
