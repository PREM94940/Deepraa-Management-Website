"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/components/admin/SettingsProvider';
import { ChevronDown, ChevronRight, Save, CheckCircle, AlertTriangle, LayoutDashboard, Settings as SettingsIcon, Store, Webhook } from 'lucide-react';

function AccordionItem({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon?: any, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-[#262626] rounded bg-[#161616] mb-4 overflow-hidden shadow-sm">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-[#1A1A1A] hover:bg-[#202020] transition-colors border-none cursor-pointer outline-none"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-5 h-5 text-[#D4AF37]" />}
                    <span className="font-semibold text-[15px] text-white tracking-wide">{title}</span>
                </div>
                <div className="text-gray-400">
                    {isOpen ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
                </div>
            </button>
            {isOpen && (
                <div className="p-6 border-t border-[#262626] bg-[#111111]">
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
                id: 1,
                config: localConfig,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            
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
        <div className="min-h-screen bg-[#111111] text-[#E5E5E5] font-sans p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#262626]">
                    <div>
                        <h1 className="text-2xl font-bold font-display uppercase tracking-widest text-white mb-2">Platform Settings</h1>
                        <p className="text-sm text-[#A3A3A3]">Manage Deeprastore configuration, UI preferences, and integrations.</p>
                    </div>
                    <button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="px-6 py-2.5 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold rounded text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {message && (
                    <div className={`p-4 mb-6 rounded flex items-center gap-3 text-sm font-medium border ${message.includes('Error') ? 'bg-red-950/30 border-red-900/50 text-red-400' : 'bg-green-950/30 border-green-900/50 text-green-400'}`}>
                        {message.includes('Error') ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                        {message}
                    </div>
                )}

                <AccordionItem title="UI Layout & Navigation Controls" icon={LayoutDashboard} defaultOpen={true}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm uppercase tracking-widest text-[#D4AF37] font-semibold mb-4">Visibility Toggles</h3>
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={localConfig.hideProducts} 
                                            onChange={e => setLocalConfig({...localConfig, hideProducts: e.target.checked})}
                                            className="peer sr-only"
                                        />
                                        <div className="w-10 h-5 bg-[#262626] rounded-full peer-checked:bg-[#D4AF37] transition-colors"></div>
                                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Hide 'Products' Tab</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={localConfig.hideComplaints} 
                                            onChange={e => setLocalConfig({...localConfig, hideComplaints: e.target.checked})}
                                            className="peer sr-only"
                                        />
                                        <div className="w-10 h-5 bg-[#262626] rounded-full peer-checked:bg-[#D4AF37] transition-colors"></div>
                                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Hide 'Complaints' Tab</span>
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-sm uppercase tracking-widest text-[#D4AF37] font-semibold mb-4">Tab Renaming</h3>
                            <div className="space-y-3">
                                {Object.entries(localConfig.tabLabels).map(([key, label]) => (
                                    <div key={key} className="flex items-center gap-4">
                                        <span className="w-24 text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">{key}</span>
                                        <input 
                                            type="text" 
                                            value={label as string}
                                            onChange={e => setLocalConfig({
                                                ...localConfig, 
                                                tabLabels: { ...localConfig.tabLabels, [key]: e.target.value }
                                            })}
                                            className="flex-1 bg-[#1A1A1A] border border-[#333] text-white text-sm rounded px-3 py-2 outline-none focus:border-[#D4AF37] transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Smart Alerts & Thresholds" icon={SettingsIcon}>
                    <div className="max-w-md">
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Configure operational thresholds to ensure timely order fulfillment. The dashboard will highlight orders approaching these deadlines.
                        </p>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-[#A3A3A3] uppercase tracking-wider">Delivery Warning Threshold (Days)</label>
                            <input 
                                type="number" 
                                min="1" 
                                value={localConfig.warningDays} 
                                onChange={e => setLocalConfig({...localConfig, warningDays: parseInt(e.target.value) || 2})}
                                className="w-full bg-[#1A1A1A] border border-[#333] text-white text-sm rounded px-3 py-2.5 outline-none focus:border-[#D4AF37] transition-colors"
                            />
                            <p className="text-xs text-gray-500 mt-2">Alerts will trigger when an order is this many days away from its delivery date.</p>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Business Information" icon={Store}>
                    <div className="max-w-md">
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Configure official Deeprastore business details and communication channels.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#A3A3A3] uppercase tracking-wider mb-2">Support WhatsApp Number</label>
                                <input 
                                    type="text" 
                                    value={localConfig.globalSettings?.whatsapp_number || ''} 
                                    onChange={e => setLocalConfig({
                                        ...localConfig, 
                                        globalSettings: {
                                            ...localConfig.globalSettings,
                                            whatsapp_number: e.target.value
                                        }
                                    })}
                                    placeholder="e.g. 919876543210"
                                    className="w-full bg-[#1A1A1A] border border-[#333] text-white text-sm rounded px-3 py-2.5 outline-none focus:border-[#D4AF37] transition-colors"
                                />
                                <p className="text-xs text-gray-500 mt-2">Include country code without '+' (e.g., 91 for India). Used for automated order inquiries.</p>
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Integrations & Sync" icon={Webhook}>
                    <div className="p-5 bg-amber-950/20 border border-amber-900/30 rounded">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold tracking-widest rounded">Disabled</span>
                            <h4 className="text-white font-medium text-sm">Shopify Headless Sync</h4>
                        </div>
                        <p className="text-sm text-amber-200/60 leading-relaxed">
                            Shopify synchronization and legacy AI configurations are currently disabled as we finalize the migration to the fully custom Deeprastore architecture. Re-enable via source code if necessary.
                        </p>
                    </div>
                </AccordionItem>
            </div>
        </div>
    );
}
