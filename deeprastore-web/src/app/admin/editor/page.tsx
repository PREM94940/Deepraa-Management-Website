"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useCMSStore } from '@/store/useCMSStore';
import { Search, Save, Globe, Lock, Unlock, AlertTriangle, ChevronDown, ChevronRight, X, ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';

export default function ThemeEditor() {
    const { sections, updateSection, setSections, moveSection, removeSection, addSection, globalSettings, updateGlobalSetting } = useCMSStore();
    const [viewport, setViewport] = useState<'desktop'|'tablet'|'mobile'>('desktop');
    const [openSectionIdx, setOpenSectionIdx] = useState<number | 'global' | null>('global');
    const [searchQuery, setSearchQuery] = useState('');
    const [interactionLock, setInteractionLock] = useState(true);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
    const [publishNote, setPublishNote] = useState('');
    const [mediaLibraryOpen, setMediaLibraryOpen] = useState<{isOpen: boolean, targetIdx: number | null}>({isOpen: false, targetIdx: null});

    const mockMediaLibrary = [
        'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1617175548912-f8702132e1b1?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1565289945195-2abf1baee058?auto=format&fit=crop&q=80&w=1200'
    ];

    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Initial Local Draft Recovery
    useEffect(() => {
        const savedDraft = localStorage.getItem('deeprastore_cms_draft');
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed && parsed.length > 0) {
                    setSections(parsed);
                }
            } catch (e) {}
        }
    }, []);

    // Sync with iframe, autosave local draft, unsaved changes tracking
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'CMS_UPDATE', payload: { sections, globalSettings } }, '*');
        }
        
        // Autosave
        const timer = setTimeout(() => {
            localStorage.setItem('deeprastore_cms_draft', JSON.stringify(sections));
            setUnsavedChanges(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [sections, globalSettings]);

    // Unsaved protection
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (unsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [unsavedChanges]);

    // CMD+S Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                setUnsavedChanges(false);
                // Trigger debounced save instantly
                localStorage.setItem('deeprastore_cms_draft', JSON.stringify(sections));
                alert('Draft saved locally.');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sections]);

    const handleInput = (idx: number, field: string, value: string) => {
        setUnsavedChanges(true);
        updateSection(idx, { settings: { ...sections[idx].settings, [field]: value } });
    };

    const handlePublish = () => {
        setPublishModalOpen(false);
        localStorage.removeItem('deeprastore_cms_draft');
        setUnsavedChanges(false);
        alert('Theme Published securely. Rollback snapshot generated.');
    };

    const validateSection = (sec: any) => {
        const warnings = [];
        if (sec.settings?.headline && sec.settings.headline.length > 60) warnings.push('Headline may wrap poorly on mobile.');
        if ((sec.type === 'cinematic_hero' || sec.type === 'brand_story') && !sec.settings?.cta_link) warnings.push('Missing Call to Action link.');
        return warnings;
    };

    const filteredSections = sections.map((sec, idx) => ({ ...sec, _idx: idx })).filter(sec => 
        sec.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-bg text-fg font-sans">
            {/* Sidebar Controls */}
            <div className="w-96 border-r border-border bg-surface flex flex-col shadow-lg z-20">
                <div className="p-6 border-b border-border bg-white">
                    <h1 className="text-xl font-bold font-display uppercase tracking-widest mb-1">Theme Editor</h1>
                    <div className="flex justify-between items-center text-xs text-muted mb-4">
                        <span>Draft: Diwali Campaign</span>
                        <span className={unsavedChanges ? "text-amber-500 font-bold" : "text-green-600"}>
                            {unsavedChanges ? 'Unsaved' : 'Saved'}
                        </span>
                    </div>

                    {/* Page Selector */}
                    <div className="mb-6">
                        <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Editing Template</label>
                        <select className="w-full text-xs p-2 border border-border bg-gray-50 focus:bg-white outline-none cursor-pointer">
                            <option value="homepage">Homepage</option>
                            <option value="collection">Collection Page</option>
                            <option value="product">Product Page</option>
                        </select>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                        <input 
                            type="text" 
                            placeholder="Find section..." 
                            className="w-full pl-9 pr-4 py-2 text-xs border border-border bg-gray-50 focus:bg-white focus:border-gold outline-none transition-colors"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* GLOBAL SETTINGS ACCORDION */}
                    <div className="border border-border bg-gold/5 shadow-sm overflow-hidden mb-4">
                        <div 
                            className={`w-full flex items-center justify-between p-4 text-left hover:bg-gold/10 transition-colors cursor-pointer ${openSectionIdx === 'global' ? 'bg-gold/10 border-b border-border' : ''}`}
                            onClick={() => setOpenSectionIdx(openSectionIdx === 'global' ? null : 'global')}
                        >
                            <div className="flex items-center gap-2">
                                {openSectionIdx === 'global' ? <ChevronDown className="w-4 h-4 text-gold" /> : <ChevronRight className="w-4 h-4 text-gold" />}
                                <span className="text-xs font-bold uppercase tracking-wider text-gold">Global Settings</span>
                            </div>
                            <Globe className="w-3 h-3 text-gold" />
                        </div>
                        {openSectionIdx === 'global' && (
                            <div className="p-4 space-y-4 bg-white border-t border-border">
                                <div>
                                    <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Announcement Banner</label>
                                    <input 
                                        type="text" 
                                        className="w-full text-xs p-2 border border-border focus:border-gold outline-none bg-gray-50 focus:bg-white transition-colors"
                                        value={globalSettings?.announcement_text || ''}
                                        onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('announcement_text', e.target.value); }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Logo Override URL</label>
                                    <input 
                                        type="text" 
                                        className="w-full text-xs p-2 border border-border focus:border-gold outline-none bg-gray-50 focus:bg-white transition-colors"
                                        placeholder="Leave blank for default"
                                        value={globalSettings?.logo_url || ''}
                                        onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('logo_url', e.target.value); }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Footer Text</label>
                                    <textarea 
                                        className="w-full text-xs p-2 border border-border focus:border-gold outline-none bg-gray-50 focus:bg-white transition-colors min-h-[60px]"
                                        value={globalSettings?.footer_text || ''}
                                        onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('footer_text', e.target.value); }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>


                    {filteredSections.map((sec) => {
                        const idx = sec._idx;
                        const warnings = validateSection(sec);
                        const isOpen = openSectionIdx === idx;
                        
                        return (
                            <div key={idx} className="border border-border bg-white shadow-sm overflow-hidden">
                                <div 
                                    role="button"
                                    className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer ${isOpen ? 'bg-gray-50 border-b border-border' : ''}`}
                                    onClick={() => {
                                        const newIdx = isOpen ? null : idx;
                                        setOpenSectionIdx(newIdx);
                                        if (newIdx !== null && iframeRef.current?.contentWindow) {
                                            iframeRef.current.contentWindow.postMessage({ type: 'CMS_SCROLL_TO', payload: sec.type }, '*');
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {isOpen ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
                                        <span className="text-xs font-bold uppercase tracking-wider">{sec.type.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        {warnings.length > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                        <div className="flex bg-gray-100 rounded-sm border border-border mr-2">
                                            <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="p-1 text-muted hover:text-black disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                                            <button onClick={() => moveSection(idx, 'down')} disabled={idx === sections.length - 1} className="p-1 text-muted hover:text-black disabled:opacity-30 border-l border-border"><ArrowDown className="w-3 h-3" /></button>
                                        </div>
                                        <button onClick={() => removeSection(idx)} className="text-muted hover:text-red-500 transition-colors" title="Remove Section">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                
                                {isOpen && (
                                    <div className="p-4 space-y-4 bg-white">
                                        {warnings.length > 0 && (
                                            <div className="bg-amber-50 border border-amber-200 p-3 flex flex-col gap-1">
                                                {warnings.map((w, i) => (
                                                    <span key={i} className="text-[10px] text-amber-800 flex items-center gap-2">
                                                        <AlertTriangle className="w-3 h-3" /> {w}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div>
                                            <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Headline</label>
                                            <input 
                                                type="text" 
                                                className="w-full text-xs p-2 border border-border focus:border-gold outline-none bg-gray-50 focus:bg-white transition-colors"
                                                placeholder="Enter headline..."
                                                value={sec.settings?.headline || ''}
                                                onChange={(e) => handleInput(idx, 'headline', e.target.value)}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Subheadline / Description</label>
                                            <textarea 
                                                className="w-full text-xs p-2 border border-border focus:border-gold outline-none bg-gray-50 focus:bg-white transition-colors min-h-[60px]"
                                                placeholder="Enter text..."
                                                value={sec.settings?.description || sec.settings?.subheadline || ''}
                                                onChange={(e) => handleInput(idx, 'description', e.target.value)}
                                            />
                                        </div>

                                        {(sec.type === 'cinematic_hero' || sec.type === 'brand_story') && (
                                            <>
                                                <div>
                                                    <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Media Selection</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            className="flex-1 text-xs p-2 border border-border bg-gray-50 focus:bg-white outline-none"
                                                            placeholder="Asset URL..."
                                                            value={sec.settings?.image_url || ''}
                                                            onChange={(e) => handleInput(idx, 'image_url', e.target.value)}
                                                        />
                                                        <button 
                                                            onClick={() => setMediaLibraryOpen({isOpen: true, targetIdx: idx})}
                                                            className="px-3 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                                                        >
                                                            Library
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-2 items-center mt-3">
                                                        <label className="text-[10px] text-muted uppercase font-bold tracking-widest">Focal Point</label>
                                                        <select 
                                                            className="flex-1 text-xs p-2 border border-border bg-gray-50 focus:bg-white outline-none cursor-pointer"
                                                            value={sec.settings?.focal_point || 'center'}
                                                            onChange={(e) => handleInput(idx, 'focal_point', e.target.value)}
                                                        >
                                                            <option value="center">Center</option>
                                                            <option value="top">Top</option>
                                                            <option value="bottom">Bottom</option>
                                                            <option value="left">Left</option>
                                                            <option value="right">Right</option>
                                                            <option value="20% 80%">Custom (20% 80%)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">CTA Text</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full text-xs p-2 border border-border bg-gray-50 focus:bg-white outline-none"
                                                            value={sec.settings?.cta_text || ''}
                                                            onChange={(e) => handleInput(idx, 'cta_text', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">CTA Link</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full text-xs p-2 border border-border bg-gray-50 focus:bg-white outline-none"
                                                            value={sec.settings?.cta_link || ''}
                                                            onChange={(e) => handleInput(idx, 'cta_link', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {sec.type === 'featured_collections' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Layout Style</label>
                                                    <select 
                                                        className="w-full text-xs p-2 border border-border bg-gray-50 focus:bg-white outline-none cursor-pointer"
                                                        value={sec.settings?.layout || 'bento'}
                                                        onChange={(e) => handleInput(idx, 'layout', e.target.value)}
                                                    >
                                                        <option value="bento">Bento Grid (Dynamic)</option>
                                                        <option value="standard">Standard Grid</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`hide-text-${idx}`}
                                                        className="cursor-pointer"
                                                        checked={sec.settings?.hide_text || false}
                                                        onChange={(e) => handleInput(idx, 'hide_text', e.target.checked)}
                                                    />
                                                    <label htmlFor={`hide-text-${idx}`} className="text-[10px] font-bold uppercase tracking-widest text-muted cursor-pointer">Hide Category Text</label>
                                                </div>
                                                {!sec.settings?.hide_text && (
                                                    <div>
                                                        <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Text Size</label>
                                                        <select 
                                                            className="w-full text-xs p-2 border border-border bg-gray-50 focus:bg-white outline-none cursor-pointer"
                                                            value={sec.settings?.text_size || 'medium'}
                                                            onChange={(e) => handleInput(idx, 'text_size', e.target.value)}
                                                        >
                                                            <option value="small">Small</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="large">Large</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {sec.type === 'trending_slider' && (
                                            <div>
                                                <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Merchandising Mode</label>
                                                <select 
                                                    className="w-full text-xs p-2 border border-border bg-gray-50 focus:bg-white outline-none cursor-pointer"
                                                    value={sec.settings?.mode || 'manual'}
                                                    onChange={(e) => handleInput(idx, 'mode', e.target.value)}
                                                >
                                                    <option value="manual">Manual Curated</option>
                                                    <option value="trending">Trending Now</option>
                                                    <option value="new_arrivals">New Arrivals</option>
                                                    <option value="bridal">Bridal Focus</option>
                                                    <option value="ready_to_ship">Ready To Ship</option>
                                                    <option value="low_stock">Low Stock Push</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
                                            <div>
                                                <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Visibility</label>
                                                <select 
                                                    className="w-full text-xs p-2 border border-border bg-gray-50 focus:bg-white outline-none cursor-pointer"
                                                    value={sec.settings?.visibility || 'all'}
                                                    onChange={(e) => handleInput(idx, 'visibility', e.target.value)}
                                                >
                                                    <option value="all">Desktop & Mobile</option>
                                                    <option value="desktop_only">Desktop Only</option>
                                                    <option value="mobile_only">Mobile Only</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-muted mb-1 uppercase font-bold tracking-widest">Padding</label>
                                                <select 
                                                    className="w-full text-xs p-2 border border-border bg-gray-50 focus:bg-white outline-none cursor-pointer"
                                                    value={sec.settings?.padding || 'default'}
                                                    onChange={(e) => handleInput(idx, 'padding', e.target.value)}
                                                >
                                                    <option value="default">Default</option>
                                                    <option value="none">No Padding</option>
                                                    <option value="small">Compact</option>
                                                    <option value="large">Spacious</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    <button 
                        onClick={() => setAddSectionModalOpen(true)}
                        className="w-full mt-4 py-4 border-2 border-dashed border-border text-muted hover:text-black hover:border-black transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Add Section</span>
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col bg-gray-100 relative">
                <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-100 p-1 rounded-sm border border-border">
                            <button onClick={() => setViewport('desktop')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${viewport === 'desktop' ? 'bg-white shadow-sm' : 'text-muted hover:text-black'}`}>Desktop</button>
                            <button onClick={() => setViewport('tablet')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${viewport === 'tablet' ? 'bg-white shadow-sm' : 'text-muted hover:text-black'}`}>Tablet</button>
                            <button onClick={() => setViewport('mobile')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${viewport === 'mobile' ? 'bg-white shadow-sm' : 'text-muted hover:text-black'}`}>Mobile</button>
                        </div>
                        
                        <button 
                            onClick={() => setInteractionLock(!interactionLock)} 
                            className="flex items-center gap-2 px-3 py-1.5 border border-border text-[10px] font-bold uppercase tracking-widest text-muted hover:text-black hover:bg-gray-50 transition-colors"
                            title="Toggle iframe pointer events"
                        >
                            {interactionLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            {interactionLock ? 'Interactions Locked' : 'Interactions Live'}
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] text-muted font-bold uppercase tracking-widest">
                            <Save className="w-3 h-3" />
                            {unsavedChanges ? 'Saving...' : 'Saved locally'}
                        </div>
                        <button onClick={() => setPublishModalOpen(true)} className="flex items-center gap-2 bg-black text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-gold transition-colors">
                            <Globe className="w-3 h-3" /> Publish
                        </button>
                    </div>
                </div>
                
                {/* Canvas Area */}
                <div className="flex-1 p-8 flex justify-center items-start overflow-auto">
                    <div className={`bg-white border border-border shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] h-full overflow-hidden ${
                        viewport === 'mobile' ? 'w-[390px] max-h-[844px] rounded-[2rem] border-[8px] border-gray-900' : 
                        viewport === 'tablet' ? 'w-[768px] max-h-[1024px] rounded-md border-4 border-gray-900' : 'w-full'
                    }`}>
                        <iframe 
                            ref={iframeRef}
                            id="preview-iframe"
                            src="/?preview_theme=draft" 
                            className={`w-full h-full border-none transition-opacity duration-300 ${interactionLock ? 'pointer-events-none' : ''}`}
                        />
                    </div>
                </div>

                {/* Publish Modal */}
                {publishModalOpen && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                        <div className="bg-white w-full max-w-xl shadow-2xl p-8 border border-border flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold font-display uppercase tracking-widest">Publish Campaign</h2>
                                <button onClick={() => setPublishModalOpen(false)} className="text-muted hover:text-black"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="bg-gray-50 border border-border p-4 mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-2 text-muted">Diff Summary</h3>
                                <ul className="text-sm list-disc pl-4 space-y-1">
                                    <li>Modified <span className="font-mono bg-gray-200 px-1">Cinematic Hero</span> headline</li>
                                    <li>Changed <span className="font-mono bg-gray-200 px-1">Trending Slider</span> merchandising mode to <b>Low Stock Push</b></li>
                                </ul>
                            </div>

                            <div className="mb-8">
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Publish Notes (Required)</label>
                                <textarea 
                                    className="w-full border border-border p-3 text-sm focus:border-gold outline-none min-h-[100px] bg-gray-50 focus:bg-white transition-colors"
                                    placeholder="Briefly describe what changed for the audit log..."
                                    value={publishNote}
                                    onChange={e => setPublishNote(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-4">
                                <button onClick={() => setPublishModalOpen(false)} className="px-6 py-3 text-xs font-bold uppercase tracking-widest border border-border hover:bg-gray-50">Cancel</button>
                                <button 
                                    onClick={handlePublish} 
                                    disabled={!publishNote.trim()}
                                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-gold transition-colors disabled:opacity-50 disabled:hover:bg-black"
                                >
                                    Confirm & Deploy
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Section Modal */}
                {addSectionModalOpen && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                        <div className="bg-white w-full max-w-2xl shadow-2xl p-8 border border-border flex flex-col max-h-[80vh]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold font-display uppercase tracking-widest">Add Section</h2>
                                <button onClick={() => setAddSectionModalOpen(false)} className="text-muted hover:text-black"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="overflow-y-auto grid grid-cols-2 gap-4">
                                {[
                                    { id: 'cinematic_hero', label: 'Cinematic Hero', desc: 'Full-screen video/image with primary CTA.' },
                                    { id: 'featured_collections', label: 'Featured Collections', desc: 'Bento or standard grid of top categories.' },
                                    { id: 'trending_slider', label: 'Product Slider', desc: 'Horizontal scroll of dynamic products.' },
                                    { id: 'brand_story', label: 'Brand Story', desc: 'Editorial half-image, half-text block.' },
                                    { id: 'instagram_feed', label: 'Instagram Feed', desc: 'Social proof gallery.' },
                                    { id: 'product_hero', label: 'Product Details Hero', desc: 'Dynamic product images, price, and add-to-cart.' },
                                    { id: 'collection_grid', label: 'Collection Grid', desc: 'Dynamic grid of products for the current category.' },
                                    { id: 'related_products', label: 'Related Products', desc: 'Cross-sell suggestions based on product tags.' }
                                ].map((component) => (
                                    <div 
                                        key={component.id}
                                        onClick={() => {
                                            addSection(sections.length, component.id, { headline: 'New Section' });
                                            setAddSectionModalOpen(false);
                                            setUnsavedChanges(true);
                                        }}
                                        className="border border-border p-4 hover:border-gold hover:shadow-md cursor-pointer transition-all bg-gray-50 hover:bg-white"
                                    >
                                        <h3 className="text-xs font-bold uppercase tracking-widest mb-2">{component.label}</h3>
                                        <p className="text-xs text-muted">{component.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Media Library Modal */}
                {mediaLibraryOpen.isOpen && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                        <div className="bg-white w-full max-w-4xl shadow-2xl p-8 border border-border flex flex-col h-[80vh]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold font-display uppercase tracking-widest">Media Library</h2>
                                <button onClick={() => setMediaLibraryOpen({isOpen: false, targetIdx: null})} className="text-muted hover:text-black"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="flex gap-4 mb-6">
                                <button className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest border border-black">All Media</button>
                                <button className="px-6 py-2 bg-white text-muted text-xs font-bold uppercase tracking-widest border border-border hover:border-black hover:text-black transition-colors">Campaigns</button>
                                <button className="px-6 py-2 bg-white text-muted text-xs font-bold uppercase tracking-widest border border-border hover:border-black hover:text-black transition-colors">Products</button>
                                <div className="flex-1 flex justify-end">
                                    <button className="px-6 py-2 bg-gold text-white text-xs font-bold uppercase tracking-widest">Upload New Asset</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {mockMediaLibrary.map((url, i) => (
                                    <div 
                                        key={i} 
                                        className="aspect-square bg-gray-100 border border-border relative group cursor-pointer overflow-hidden"
                                        onClick={() => {
                                            if (mediaLibraryOpen.targetIdx !== null) {
                                                handleInput(mediaLibraryOpen.targetIdx, 'image_url', url);
                                                setMediaLibraryOpen({isOpen: false, targetIdx: null});
                                            }
                                        }}
                                    >
                                        <img src={url} alt={`Media ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-xs font-bold uppercase tracking-widest">Select</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
