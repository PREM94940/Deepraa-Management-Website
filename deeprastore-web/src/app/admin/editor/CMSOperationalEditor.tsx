"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Layers,
    MessageSquare,
    FileText,
    Bell,
    Save,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    Edit3,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackingMessage {
    id: string;
    stage_key: string;
    label: string;
    description: string;
    reassurance_notice: string;
    reassurance_title: string;
    sort_order: number;
}

interface SupportTemplate {
    id: string;
    category_id: string;
    title: string;
    description: string;
    intent_message: string;
    badge: string;
    sort_order: number;
}

interface PolicyContent {
    id: string;
    slug: string;
    title: string;
    content: string;
    updated_at?: string;
}

interface NotificationTemplate {
    id: string;
    name: string;
    channel: 'WhatsApp' | 'SMS' | 'Email';
    body: string;
    subject?: string;
    updated_at?: string;
}

type TabKey = 'tracking' | 'support' | 'policy' | 'notifications';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SaveStatus({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
    if (status === 'idle') return null;
    return (
        <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${
            status === 'saving' ? 'text-zinc-400' :
            status === 'saved' ? 'text-emerald-400' :
            'text-rose-400'
        }`}>
            {status === 'saving' && <RefreshCw className="w-3 h-3 animate-spin" />}
            {status === 'saved' && <CheckCircle className="w-3 h-3" />}
            {status === 'error' && <AlertCircle className="w-3 h-3" />}
            {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : 'Error'}
        </span>
    );
}

// ─── Tab: Tracking Messages ───────────────────────────────────────────────────

function TrackingMessagesTab() {
    const [rows, setRows] = useState<TrackingMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
    const [drafts, setDrafts] = useState<Record<string, Partial<TrackingMessage>>>({});

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase
                .from('tracking_messages')
                .select('*')
                .order('sort_order', { ascending: true });
            if (data) {
                setRows(data);
                const initial: Record<string, Partial<TrackingMessage>> = {};
                data.forEach(r => { initial[r.id] = { ...r }; });
                setDrafts(initial);
            }
            setLoading(false);
        }
        fetch();
    }, []);

    const updateDraft = (id: string, field: keyof TrackingMessage, value: string) => {
        setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
        if (saveStatus[id] === 'saved') {
            setSaveStatus(prev => ({ ...prev, [id]: 'idle' }));
        }
    };

    const saveRow = async (id: string) => {
        setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
        const draft = drafts[id];
        const { error } = await supabase
            .from('tracking_messages')
            .update({
                label: draft.label,
                description: draft.description,
                reassurance_notice: draft.reassurance_notice,
                reassurance_title: draft.reassurance_title,
            })
            .eq('id', id);
        setSaveStatus(prev => ({ ...prev, [id]: error ? 'error' : 'saved' }));
        if (!error) {
            setTimeout(() => setSaveStatus(prev => ({ ...prev, [id]: 'idle' })), 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-[11px] text-zinc-500 font-light">
                Edit stage labels, descriptions, and proactive reassurance messages shown to customers during tracking.
            </p>
            <div className="space-y-3">
                {rows.map((row) => {
                    const draft = drafts[row.id] || row;
                    return (
                        <div key={row.id} className="bg-[#1A1A1A] border border-[#262626] rounded-sm p-5 space-y-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-mono font-bold bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-sm">
                                        {row.sort_order}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">{row.stage_key}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <SaveStatus status={saveStatus[row.id] || 'idle'} />
                                    <button
                                        onClick={() => saveRow(row.id)}
                                        disabled={saveStatus[row.id] === 'saving'}
                                        className="flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#B8962B] disabled:opacity-40 text-black font-bold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors"
                                    >
                                        <Save className="w-3 h-3" />
                                        Save
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Label</label>
                                    <input
                                        type="text"
                                        value={String(draft.label ?? '')}
                                        onChange={e => updateDraft(row.id, 'label', e.target.value)}
                                        className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors font-medium"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Reassurance Title</label>
                                    <input
                                        type="text"
                                        value={String(draft.reassurance_title ?? '')}
                                        onChange={e => updateDraft(row.id, 'reassurance_title', e.target.value)}
                                        className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Stage Description</label>
                                <input
                                    type="text"
                                    value={String(draft.description ?? '')}
                                    onChange={e => updateDraft(row.id, 'description', e.target.value)}
                                    className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Reassurance Notice</label>
                                <textarea
                                    value={String(draft.reassurance_notice ?? '')}
                                    onChange={e => updateDraft(row.id, 'reassurance_notice', e.target.value)}
                                    rows={3}
                                    placeholder="Optional proactive delay message shown to customers at this stage..."
                                    className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors resize-none leading-relaxed font-light"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Tab: Support Templates ───────────────────────────────────────────────────

function SupportTemplatesTab() {
    const [rows, setRows] = useState<SupportTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
    const [drafts, setDrafts] = useState<Record<string, Partial<SupportTemplate>>>({});

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase
                .from('support_templates')
                .select('*')
                .order('sort_order', { ascending: true });
            if (data) {
                setRows(data);
                const initial: Record<string, Partial<SupportTemplate>> = {};
                data.forEach(r => { initial[r.id] = { ...r }; });
                setDrafts(initial);
            }
            setLoading(false);
        }
        fetch();
    }, []);

    const updateDraft = (id: string, field: keyof SupportTemplate, value: string) => {
        setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
        if (saveStatus[id] === 'saved') {
            setSaveStatus(prev => ({ ...prev, [id]: 'idle' }));
        }
    };

    const saveRow = async (id: string) => {
        setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
        const draft = drafts[id];
        const { error } = await supabase
            .from('support_templates')
            .update({
                title: draft.title,
                description: draft.description,
                intent_message: draft.intent_message,
                badge: draft.badge,
            })
            .eq('id', id);
        setSaveStatus(prev => ({ ...prev, [id]: error ? 'error' : 'saved' }));
        if (!error) {
            setTimeout(() => setSaveStatus(prev => ({ ...prev, [id]: 'idle' })), 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-[11px] text-zinc-500 font-light">
                Edit support category titles, descriptions, intent messages pre-filled in WhatsApp, and badge labels.
            </p>
            <div className="space-y-3">
                {rows.map((row) => {
                    const draft = drafts[row.id] || row;
                    return (
                        <div key={row.id} className="bg-[#1A1A1A] border border-[#262626] rounded-sm p-5 space-y-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-mono font-bold bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-sm">
                                        {row.sort_order}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">{row.category_id}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <SaveStatus status={saveStatus[row.id] || 'idle'} />
                                    <button
                                        onClick={() => saveRow(row.id)}
                                        disabled={saveStatus[row.id] === 'saving'}
                                        className="flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#B8962B] disabled:opacity-40 text-black font-bold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors"
                                    >
                                        <Save className="w-3 h-3" />
                                        Save
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Title</label>
                                    <input
                                        type="text"
                                        value={String(draft.title ?? '')}
                                        onChange={e => updateDraft(row.id, 'title', e.target.value)}
                                        className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors font-medium"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Badge Label</label>
                                    <input
                                        type="text"
                                        value={String(draft.badge ?? '')}
                                        onChange={e => updateDraft(row.id, 'badge', e.target.value)}
                                        className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Description</label>
                                <input
                                    type="text"
                                    value={String(draft.description ?? '')}
                                    onChange={e => updateDraft(row.id, 'description', e.target.value)}
                                    className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Intent Message (WhatsApp Pre-fill)</label>
                                <textarea
                                    value={String(draft.intent_message ?? '')}
                                    onChange={e => updateDraft(row.id, 'intent_message', e.target.value)}
                                    rows={2}
                                    placeholder="Hi Deeprastore, ..."
                                    className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors resize-none leading-relaxed font-light"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Tab: Policy Content ──────────────────────────────────────────────────────

function PolicyContentTab() {
    const [rows, setRows] = useState<PolicyContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
    const [drafts, setDrafts] = useState<Record<string, Partial<PolicyContent>>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase
                .from('policy_content')
                .select('*')
                .order('slug', { ascending: true });
            if (data) {
                setRows(data);
                const initial: Record<string, Partial<PolicyContent>> = {};
                data.forEach(r => { initial[r.id] = { ...r }; });
                setDrafts(initial);
            }
            setLoading(false);
        }
        fetch();
    }, []);

    const updateDraft = (id: string, field: keyof PolicyContent, value: string) => {
        setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
        if (saveStatus[id] === 'saved') {
            setSaveStatus(prev => ({ ...prev, [id]: 'idle' }));
        }
    };

    const saveRow = async (id: string) => {
        setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
        const draft = drafts[id];
        const { error } = await supabase
            .from('policy_content')
            .update({
                title: draft.title,
                content: draft.content,
            })
            .eq('id', id);
        setSaveStatus(prev => ({ ...prev, [id]: error ? 'error' : 'saved' }));
        if (!error) {
            setTimeout(() => setSaveStatus(prev => ({ ...prev, [id]: 'idle' })), 3000);
        }
    };

    const toggleExpanded = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-[11px] text-zinc-500 font-light">
                Edit policy documents displayed on the storefront. Content supports plain text or Markdown.
            </p>
            <div className="space-y-3">
                {rows.map((row) => {
                    const draft = drafts[row.id] || row;
                    const isOpen = expanded[row.id];
                    return (
                        <div key={row.id} className="bg-[#1A1A1A] border border-[#262626] rounded-sm overflow-hidden">
                            {/* Row Header */}
                            <button
                                onClick={() => toggleExpanded(row.id)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#202020] transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">{row.slug}</span>
                                    <span className="text-xs font-medium text-white">{draft.title || row.title}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <SaveStatus status={saveStatus[row.id] || 'idle'} />
                                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {/* Expanded Edit Area */}
                            {isOpen && (
                                <div className="px-5 pb-5 space-y-4 border-t border-[#262626]">
                                    <div className="space-y-1 pt-4">
                                        <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Page Title</label>
                                        <input
                                            type="text"
                                            value={String(draft.title ?? '')}
                                            onChange={e => updateDraft(row.id, 'title', e.target.value)}
                                            className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Content</label>
                                        <textarea
                                            value={String(draft.content ?? '')}
                                            onChange={e => updateDraft(row.id, 'content', e.target.value)}
                                            rows={16}
                                            placeholder="Policy content (plain text or Markdown)..."
                                            className="w-full bg-[#111111] border border-[#303030] px-3 py-2.5 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors resize-y leading-relaxed font-mono"
                                        />
                                    </div>

                                    <div className="flex justify-between items-center pt-1">
                                        {row.updated_at && (
                                            <span className="text-[9px] text-zinc-600 font-mono">
                                                Last saved: {new Date(row.updated_at).toLocaleString()}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => saveRow(row.id)}
                                            disabled={saveStatus[row.id] === 'saving'}
                                            className="flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#B8962B] disabled:opacity-40 text-black font-bold text-[9px] uppercase tracking-widest px-4 py-2 rounded-sm transition-colors ml-auto"
                                        >
                                            <Save className="w-3 h-3" />
                                            Save Policy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Tab: Notification Templates ─────────────────────────────────────────────

function NotificationTemplatesTab() {
    const [rows, setRows] = useState<NotificationTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
    const [drafts, setDrafts] = useState<Record<string, Partial<NotificationTemplate>>>({});

    const CHANNEL_OPTIONS: NotificationTemplate['channel'][] = ['WhatsApp', 'SMS', 'Email'];

    const CHANNEL_COLORS: Record<NotificationTemplate['channel'], string> = {
        WhatsApp: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50',
        SMS: 'text-blue-400 bg-blue-950/60 border-blue-800/50',
        Email: 'text-purple-400 bg-purple-950/60 border-purple-800/50',
    };

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase
                .from('notification_templates')
                .select('*')
                .order('name', { ascending: true });
            if (data) {
                setRows(data);
                const initial: Record<string, Partial<NotificationTemplate>> = {};
                data.forEach(r => { initial[r.id] = { ...r }; });
                setDrafts(initial);
            }
            setLoading(false);
        }
        fetch();
    }, []);

    const updateDraft = (id: string, field: keyof NotificationTemplate, value: string) => {
        setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
        if (saveStatus[id] === 'saved') {
            setSaveStatus(prev => ({ ...prev, [id]: 'idle' }));
        }
    };

    const saveRow = async (id: string) => {
        setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
        const draft = drafts[id];
        const { error } = await supabase
            .from('notification_templates')
            .update({
                channel: draft.channel,
                body: draft.body,
                subject: draft.subject,
            })
            .eq('id', id);
        setSaveStatus(prev => ({ ...prev, [id]: error ? 'error' : 'saved' }));
        if (!error) {
            setTimeout(() => setSaveStatus(prev => ({ ...prev, [id]: 'idle' })), 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-[11px] text-zinc-500 font-light">
                Edit notification templates sent via WhatsApp, SMS, or Email. Use <span className="font-mono text-[#D4AF37]/80">{'{{customer_name}}'}</span>, <span className="font-mono text-[#D4AF37]/80">{'{{order_number}}'}</span>, <span className="font-mono text-[#D4AF37]/80">{'{{status}}'}</span> as dynamic tokens.
            </p>
            <div className="space-y-3">
                {rows.map((row) => {
                    const draft = drafts[row.id] || row;
                    const channelColor = CHANNEL_COLORS[draft.channel as NotificationTemplate['channel']] || CHANNEL_COLORS['SMS'];
                    return (
                        <div key={row.id} className="bg-[#1A1A1A] border border-[#262626] rounded-sm p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border font-mono ${channelColor}`}>
                                        {draft.channel || row.channel}
                                    </span>
                                    <span className="text-xs font-medium text-white">{row.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <SaveStatus status={saveStatus[row.id] || 'idle'} />
                                    <button
                                        onClick={() => saveRow(row.id)}
                                        disabled={saveStatus[row.id] === 'saving'}
                                        className="flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#B8962B] disabled:opacity-40 text-black font-bold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-sm transition-colors"
                                    >
                                        <Save className="w-3 h-3" />
                                        Save
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Channel Dropdown */}
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Channel</label>
                                    <select
                                        value={String(draft.channel ?? row.channel)}
                                        onChange={e => updateDraft(row.id, 'channel', e.target.value)}
                                        className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none"
                                    >
                                        {CHANNEL_OPTIONS.map(ch => (
                                            <option key={ch} value={ch}>{ch}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject (Email only) */}
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">
                                        Subject <span className="text-zinc-600 normal-case tracking-normal">(Email only)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={String(draft.subject ?? '')}
                                        onChange={e => updateDraft(row.id, 'subject', e.target.value)}
                                        disabled={draft.channel !== 'Email'}
                                        placeholder={draft.channel !== 'Email' ? 'N/A for this channel' : 'Your order is ready...'}
                                        className="w-full bg-[#111111] border border-[#303030] px-3 py-2 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold block">Message Body</label>
                                <textarea
                                    value={String(draft.body ?? '')}
                                    onChange={e => updateDraft(row.id, 'body', e.target.value)}
                                    rows={5}
                                    placeholder="Hi {{customer_name}}, your order #{{order_number}} is now {{status}}..."
                                    className="w-full bg-[#111111] border border-[#303030] px-3 py-2.5 text-xs text-white rounded-sm focus:outline-none focus:border-[#D4AF37] transition-colors resize-y leading-relaxed font-light"
                                />
                            </div>

                            {row.updated_at && (
                                <p className="text-[9px] text-zinc-700 font-mono">
                                    Last updated: {new Date(row.updated_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function CMSOperationalEditor() {
    const [activeTab, setActiveTab] = useState<TabKey>('tracking');

    const tabs: { key: TabKey; label: string; icon: React.ElementType; description: string }[] = [
        {
            key: 'tracking',
            label: 'Tracking Messages',
            icon: Layers,
            description: 'Stage labels & reassurance copy',
        },
        {
            key: 'support',
            label: 'Support Templates',
            icon: MessageSquare,
            description: 'WhatsApp support categories',
        },
        {
            key: 'policy',
            label: 'Policy Content',
            icon: FileText,
            description: 'Policy pages & legal copy',
        },
        {
            key: 'notifications',
            label: 'Notification Templates',
            icon: Bell,
            description: 'WhatsApp / SMS / Email messages',
        },
    ];

    return (
        <div className="bg-[#111111] min-h-[600px] rounded-sm border border-[#1E1E1E]">
            {/* Tab Navigation */}
            <div className="border-b border-[#1E1E1E] px-6 pt-5">
                <div className="flex items-center gap-1 mb-0 overflow-x-auto scrollbar-none">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all duration-200 whitespace-nowrap ${
                                    isActive
                                        ? 'border-[#D4AF37] text-[#D4AF37]'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Description */}
            <div className="px-6 py-3 border-b border-[#1A1A1A] bg-[#0E0E0E]">
                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold flex items-center gap-2">
                    <Edit3 className="w-3 h-3" />
                    {tabs.find(t => t.key === activeTab)?.description}
                </p>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {activeTab === 'tracking' && <TrackingMessagesTab />}
                {activeTab === 'support' && <SupportTemplatesTab />}
                {activeTab === 'policy' && <PolicyContentTab />}
                {activeTab === 'notifications' && <NotificationTemplatesTab />}
            </div>
        </div>
    );
}
