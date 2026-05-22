"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/components/admin/SettingsProvider';
import { ChevronDown, ChevronRight, Save, CheckCircle, AlertTriangle } from 'lucide-react';

function AccordionItem({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '16px', background: '#FFF' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1.05rem', color: '#1E293B', alignItems: 'center' }}
            >
                {title}
                {isOpen ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
            </button>
            {isOpen && (
                <div style={{ padding: '16px', borderTop: '1px solid #E2E8F0' }}>
                    {children}
                </div>
            )}
        </div>
    );
}

export default function SettingsPage() {
    const { config, refreshConfig } = useSettings();
    const [localConfig, setLocalConfig] = useState(config);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    async function handleSave() {
        setSaving(true);
        setMessage('');
        try {
            const { error } = await supabase.from('store_ui_settings').upsert({
                key: 'admin_ui',
                value: localConfig,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
            
            if (error) throw error;
            setMessage('Settings saved successfully!');
            refreshConfig();
        } catch (err: any) {
            setMessage('Error saving settings: ' + err.message);
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Dynamic Settings Configuration</h1>
                    <p>Customize tabs, warnings, and business integrations</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {message && (
                <div style={{ padding: '12px 16px', marginBottom: '24px', borderRadius: '8px', background: message.includes('Error') ? '#FEE2E2' : '#DCFCE7', color: message.includes('Error') ? '#991B1B' : '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {message.includes('Error') ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                    {message}
                </div>
            )}

            <AccordionItem title="UI Layout & Navigation Controls" defaultOpen={true}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Visibility Toggles</h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={localConfig.hideProducts} onChange={e => setLocalConfig({...localConfig, hideProducts: e.target.checked})} />
                            Hide 'Products' Tab
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={localConfig.hideComplaints} onChange={e => setLocalConfig({...localConfig, hideComplaints: e.target.checked})} />
                            Hide 'Complaints' Tab
                        </label>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Tab Renaming</h3>
                        {Object.entries(localConfig.tabLabels).map(([key, label]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <span style={{ width: '100px', fontSize: '0.85rem', color: '#64748B', textTransform: 'capitalize' }}>{key}</span>
                                <input 
                                    type="text" 
                                    value={label}
                                    onChange={e => setLocalConfig({
                                        ...localConfig, 
                                        tabLabels: { ...localConfig.tabLabels, [key]: e.target.value }
                                    })}
                                    style={{ flex: 1, padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.9rem' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </AccordionItem>

            <AccordionItem title="Smart Warnings & Thresholds">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontSize: '0.9rem', color: '#64748B' }}>Configure when the Dashboard should alert you about upcoming delivery dates.</p>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Delivery Warning Threshold (Days)</label>
                        <input 
                            type="number" 
                            min="1" 
                            value={localConfig.warningDays} 
                            onChange={e => setLocalConfig({...localConfig, warningDays: parseInt(e.target.value) || 2})}
                            style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', width: '150px' }}
                        />
                    </div>
                </div>
            </AccordionItem>

            <AccordionItem title="Business Information">
                <p style={{ fontSize: '0.9rem', color: '#64748B' }}>(Placeholder for Deeprastore business details, tax ID, and address info)</p>
            </AccordionItem>

            <AccordionItem title="Shopify Sync & Integrations">
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                    <span className="badge badge-pending" style={{ marginBottom: '12px', display: 'inline-block' }}>Temporarily Disabled</span>
                    <p style={{ fontSize: '0.9rem', color: '#64748B' }}>Shopify and AI configurations are hidden as we are moving to a fully custom site structure. Enable via source if required later.</p>
                </div>
            </AccordionItem>
        </div>
    );
}
