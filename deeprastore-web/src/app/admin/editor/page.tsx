"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useCMSStore } from '@/store/useCMSStore';
import { 
    Search, Save, Globe, Lock, Unlock, AlertTriangle, 
    ChevronDown, ChevronRight, X, ArrowUp, ArrowDown, 
    Plus, Trash2, Copy, RotateCcw, Sparkles, AlertCircle, Check, History
} from 'lucide-react';
import { validateCMSPage } from '@/lib/validations/cms';
import { getCurrentUserRoleAction, grantManagerRoleAction } from '@/lib/actions/auth';
import { supabase } from '@/lib/supabase';

export default function ThemeEditor() {
    const { 
        pages, 
        currentPageId, 
        setCurrentPageId, 
        duplicatePage, 
        softDeletePage, 
        restorePage, 
        updatePageMeta,
        sections, 
        updateSection, 
        setSections, 
        moveSection, 
        removeSection, 
        addSection, 
        globalSettings, 
        updateGlobalSetting,
        loadFromDatabase,
        saveToDatabase,
        publishToDatabase,
        rollbackToPublished,
        requestPublishApproval,
        approveAndPublish,
        rejectPublishRequest,
        isLoading
    } = useCMSStore();

    const [viewport, setViewport] = useState<'desktop'|'tablet'|'mobile'>('desktop');
    const [openSectionIdx, setOpenSectionIdx] = useState<number | 'global' | 'seo' | null>('global');
    const [searchQuery, setSearchQuery] = useState('');
    const [interactionLock, setInteractionLock] = useState(true);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);
    const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
    const [cloneModalOpen, setCloneModalOpen] = useState(false);
    const [publishNote, setPublishNote] = useState('');
    const [mediaLibraryOpen, setMediaLibraryOpen] = useState<{isOpen: boolean, targetIdx: number | null}>({isOpen: false, targetIdx: null});
    
    // Page Clone states
    const [cloneName, setCloneName] = useState('');
    const [cloneSlug, setCloneSlug] = useState('');

    // Role-based workflows state hooks
    const [userRole, setUserRole] = useState<'Manager' | 'Staff' | 'anonymous'>('Staff');
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [rejectionFeedback, setRejectionFeedback] = useState('');
    
    // Version History state hooks
    const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [loadingSnapshots, setLoadingSnapshots] = useState(false);

    // Media Library state
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<string[]>([
        'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1617175548912-f8702132e1b1?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1565289945195-2abf1baee058?auto=format&fit=crop&q=80&w=1200'
    ]);
    const [activeMediaTab, setActiveMediaTab] = useState<'all' | 'images' | 'videos'>('all');
    const [mediaSearchQuery, setMediaSearchQuery] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const [isDraggingMedia, setIsDraggingMedia] = useState(false);

    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Initialize from Supabase DB on mount
    useEffect(() => {
        loadFromDatabase();

        async function fetchUserRole() {
            const res = await getCurrentUserRoleAction();
            if (res.success) {
                setUserRole(res.role);
                setUserEmail(res.email);
            } else {
                setUserRole(res.role || 'Staff');
            }
        }
        fetchUserRole();
    }, []);

    // Expose store to window for browser-tested reality validation flows
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).supabase = supabase;
            (window as any).__cms_store = {
                pages, 
                currentPageId, 
                setCurrentPageId, 
                duplicatePage, 
                softDeletePage, 
                restorePage, 
                updatePageMeta,
                sections, 
                updateSection, 
                setSections, 
                moveSection, 
                removeSection, 
                addSection, 
                globalSettings, 
                updateGlobalSetting,
                loadFromDatabase,
                saveToDatabase,
                publishToDatabase,
                rollbackToPublished,
                requestPublishApproval,
                approveAndPublish,
                rejectPublishRequest,
                isLoading,
                validateCMSPage,
                userRole,
                setUserRole,
                grantManagerRole: grantManagerRoleAction
            };
        }
    }, [pages, currentPageId, sections, globalSettings, isLoading, userRole]);

    // Active Page object
    const activePage = useMemo(() => {
        return pages.find(p => p.id === currentPageId) || pages[0];
    }, [pages, currentPageId]);

    // Active Iframe URL computation
    const iframeUrl = useMemo(() => {
        if (!activePage) return '/?preview_theme=draft';
        if (activePage.type === 'homepage') return '/?preview_theme=draft';
        if (activePage.type === 'collection') return '/collections?preview_theme=draft';
        if (activePage.type === 'product') return '/product/1?preview_theme=draft'; // default to product id 1
        return `/c/${activePage.slug}?preview_theme=draft`;
    }, [activePage]);

    // Sync with iframe, autosave local draft
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ 
                type: 'CMS_UPDATE', 
                payload: { 
                    pages,
                    currentPageId,
                    sections, 
                    globalSettings 
                } 
            }, '*');
        }
        
        // Local Autosave (as fallback/backup)
        const timer = setTimeout(() => {
            localStorage.setItem('deeprastore_cms_draft_backup', JSON.stringify({ pages, globalSettings }));
        }, 1500);

        return () => clearTimeout(timer);
    }, [sections, globalSettings, pages, currentPageId]);

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
                handleSaveDraft();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pages, globalSettings, currentPageId]);

    const handleInput = (idx: number, field: string, value: string | boolean) => {
        setUnsavedChanges(true);
        updateSection(idx, { [field]: value });
    };

    const handleSaveDraft = async () => {
        try {
            await saveToDatabase();
            setUnsavedChanges(false);
            alert('CMS configuration saved to draft successfully!');
        } catch (err: any) {
            alert(`Error saving configuration: ${err.message}`);
        }
    };

    const handlePublish = async () => {
        setPublishModalOpen(false);
        try {
            await publishToDatabase();
            setUnsavedChanges(false);
            alert(`Theme configuration successfully published live!\nRelease Note: ${publishNote || 'Manual CMS update'}`);
        } catch (err: any) {
            alert(`Publish failed: ${err.message}`);
        }
    };

    const handleRollback = async (snapshotId?: string) => {
        const msg = snapshotId 
            ? "Are you sure you want to revert the LIVE site and Draft to this historical snapshot? This will immediately alter the production store." 
            : "Are you sure you want to discard your draft edits and revert to the live version? This cannot be undone.";
            
        if (confirm(msg)) {
            try {
                await rollbackToPublished(snapshotId);
                setUnsavedChanges(false);
                setVersionHistoryOpen(false);
                alert(snapshotId ? "Store reverted to historical snapshot successfully." : "Workspace rolled back to the live published configuration successfully.");
            } catch (err: any) {
                alert(`Rollback failed: ${err.message}`);
            }
        }
    };

    const fetchSnapshots = async () => {
        setVersionHistoryOpen(true);
        setLoadingSnapshots(true);
        try {
            const { data, error } = await supabase
                .from('cms_publish_snapshots')
                .select('id, published_at, publish_notes, rollback_source_metadata, published_by')
                .order('published_at', { ascending: false })
                .limit(20);
                
            if (error) throw error;
            setSnapshots(data || []);
        } catch (err: any) {
            console.error("Failed to fetch snapshots", err);
            alert(`Failed to load version history. Error: ${err.message || 'Check console'}`);
        } finally {
            setLoadingSnapshots(false);
        }
    };

    const fetchMediaFromBucket = async () => {
        try {
            const { data, error } = await supabase.storage.from('product-images').list();
            if (error) return; // Silent fail if bucket doesn't exist yet
            
            const urls = data.filter(f => f.name !== '.emptyFolderPlaceholder').map(file => {
                return supabase.storage.from('product-images').getPublicUrl(file.name).data.publicUrl;
            });
            if (urls.length > 0) {
                setMediaFiles(prev => {
                    const unique = Array.from(new Set([...urls, ...prev]));
                    return unique;
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (mediaLibraryOpen.isOpen) {
            fetchMediaFromBucket();
        }
    }, [mediaLibraryOpen.isOpen]);

    const uploadFiles = async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;
        setIsUploadingMedia(true);
        try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
                
                if (error) throw error;
                
                const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path);
                uploadedUrls.push(publicUrl);
            }
            
            setMediaFiles(prev => [...uploadedUrls, ...prev]);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('Failed to upload media: ' + error.message);
        } finally {
            setIsUploadingMedia(false);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            await uploadFiles(e.target.files);
            e.target.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingMedia(true);
    };
    
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingMedia(false);
    };
    
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingMedia(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await uploadFiles(e.dataTransfer.files);
        }
    };

    const handleDeleteMedia = async (url: string) => {
        if (!confirm("Are you sure you want to permanently delete this asset?")) return;
        try {
            const fileName = url.split('/').pop();
            if (fileName && fileName.length > 5 && !url.includes('unsplash')) {
                const { error } = await supabase.storage.from('product-images').remove([fileName]);
                if (error) throw error;
            }
            setMediaFiles(prev => prev.filter(f => f !== url));
        } catch (err: any) {
            alert("Failed to delete media: " + err.message);
        }
    };

    const filteredMediaFiles = mediaFiles.filter(url => {
        const isVid = Boolean(url.match(/\.(mp4|webm)$/i) || url.includes('vimeo'));
        
        let matchesTab = true;
        if (activeMediaTab === 'images') matchesTab = !isVid;
        if (activeMediaTab === 'videos') matchesTab = isVid;

        let matchesSearch = true;
        if (mediaSearchQuery.trim()) {
            const fileName = url.split('/').pop()?.toLowerCase() || '';
            matchesSearch = fileName.includes(mediaSearchQuery.toLowerCase());
        }

        return matchesTab && matchesSearch;
    });

    // Performance & Governance Auditing
    const auditReport = useMemo(() => {
        if (!activePage) return { errors: [], warnings: [] };
        return validateCMSPage(activePage);
    }, [activePage]);

    const handleAddSectionWithPreset = (type: string, presetName?: string) => {
        setAddSectionModalOpen(false);
        setUnsavedChanges(true);

        let defaultSettings: any = {};
        if (type === 'cinematic_hero') {
            if (presetName === 'Luxury') {
                defaultSettings = {
                    headline: 'The Royal <br class="hidden sm:block"/> <span class="italic font-light">Trousseau.</span>',
                    subheadline: "Deepra Bridal Couture '26",
                    cta_text: 'Explore The Collection',
                    cta_link: '/collections',
                    image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200',
                    focal_point: 'center',
                    padding: 'none'
                };
            } else if (presetName === 'Editorial') {
                defaultSettings = {
                    headline: 'Sartorial <br/> <span class="italic font-light">Simplicity.</span>',
                    subheadline: 'Minimalist Silks',
                    cta_text: 'View Lookbook',
                    cta_link: '/collections',
                    image_url: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=1200',
                    focal_point: 'center',
                    padding: 'none'
                };
            } else if (presetName === 'Festival') {
                defaultSettings = {
                    headline: 'Festival of <br/> <span class="italic font-bold text-gold">Lights.</span>',
                    subheadline: 'Deepra Festive \'26',
                    cta_text: 'Shop Festive Specials',
                    cta_link: '/collections',
                    image_url: 'https://images.unsplash.com/photo-1565289945195-2abf1baee058?auto=format&fit=crop&q=80&w=1200',
                    focal_point: 'center',
                    padding: 'none'
                };
            } else {
                // Minimal
                defaultSettings = {
                    headline: 'Pure Silk.',
                    subheadline: 'Raw & Unrefined',
                    cta_text: 'Shop Now',
                    cta_link: '/collections',
                    image_url: 'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=1200',
                    focal_point: 'center',
                    padding: 'none'
                };
            }
        } else if (type === 'brand_story') {
            if (presetName === 'Luxury') {
                defaultSettings = {
                    tagline: 'The Deepra Heritage',
                    headline: 'Crafted over months. <br/> <span class="italic font-light text-gold">Treasured for generations.</span>',
                    description: '<span class="text-4xl float-left mr-2 font-display text-fg leading-none pt-2">O</span>ur Master Weavers spend up to 120 days hand-weaving a single bridal piece. We believe that true luxury lies in the preservation of ancient art forms.',
                    cta_text: 'Meet The Artisans',
                    cta_link: '/collections',
                    image_url: 'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=800',
                    focal_point: 'center',
                    padding: 'large'
                };
            } else {
                defaultSettings = {
                    tagline: 'Pure Artistry',
                    headline: 'Simplicity In Design.',
                    description: 'Every collection embodies our core philosophy of sustainable luxury, showcasing raw organic fabrics dyed with natural extracts.',
                    cta_text: 'Read Our Story',
                    cta_link: '/collections',
                    image_url: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=800',
                    focal_point: 'center',
                    padding: 'default'
                };
            }
        } else {
            defaultSettings = { headline: 'New ' + type.replace('_', ' ') };
        }

        addSection(sections.length, type, defaultSettings);
    };

    const handleCloneSubmit = () => {
        if (!cloneName.trim() || !cloneSlug.trim()) {
            alert('Please specify name and slug.');
            return;
        }
        // Enforce URL safety on slug
        const sanitizedSlug = cloneSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        
        duplicatePage(currentPageId, cloneName, sanitizedSlug);
        setCloneModalOpen(false);
        setCloneName('');
        setCloneSlug('');
        setUnsavedChanges(true);
        alert('Campaign template cloned successfully!');
    };

    const handleSoftDelete = () => {
        if (confirm('Are you sure you want to archive this page? It will be removed from navigation and customer routing.')) {
            softDeletePage(currentPageId);
            setUnsavedChanges(true);
        }
    };

    const filteredSections = sections.map((sec, idx) => ({ ...sec, _idx: idx })).filter(sec => 
        sec.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-[#111111] text-[#E5E5E5] font-sans">
            {/* Sidebar Controls */}
            <div className="w-96 border-r border-[#262626] bg-[#1A1A1A] flex flex-col shadow-2xl z-20">
                <div className="p-6 border-b border-[#262626] bg-[#161616]">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-sm font-bold font-display uppercase tracking-[0.2em] text-[#D4AF37]">Deeprastore CMS</h1>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                            unsavedChanges ? "bg-amber-950/80 border border-amber-600 text-amber-400" : "bg-green-950/80 border border-green-600 text-green-400"
                        }`}>
                            {unsavedChanges ? 'Unsaved Changes' : 'Draft Synced'}
                        </span>
                    </div>

                    {/* Page Selector & Status Badge */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-[#A3A3A3]">Active Page</label>
                            {activePage && (
                                <span className={`text-[9px] px-2 py-0.2 rounded-full uppercase font-bold border ${
                                    activePage.status === 'published' ? 'border-green-600 bg-green-950 text-green-400' :
                                    activePage.status === 'draft' ? 'border-amber-600 bg-amber-950 text-amber-400' :
                                    activePage.status === 'archived' ? 'border-red-600 bg-red-950 text-red-400' :
                                    'border-gray-600 bg-gray-900 text-gray-400'
                                }`}>
                                    {activePage.status}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <select 
                                className="flex-1 text-xs p-2.5 border border-[#262626] bg-[#262626] text-white outline-none cursor-pointer focus:border-[#D4AF37] rounded"
                                value={currentPageId}
                                onChange={e => {
                                    setCurrentPageId(e.target.value);
                                }}
                            >
                                {pages.filter(p => !p.isDeleted).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            
                            <button 
                                onClick={() => setCloneModalOpen(true)}
                                className="p-2 border border-[#262626] bg-[#262626] hover:bg-[#333333] transition-colors rounded text-muted-foreground hover:text-white"
                                title="Clone/Duplicate Page"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                            
                            {activePage && activePage.id !== 'homepage' && activePage.id !== 'collection' && activePage.id !== 'product' && (
                                <button 
                                    onClick={handleSoftDelete}
                                    className="p-2 border border-red-950 bg-red-950/20 hover:bg-red-950 transition-colors rounded text-red-400 hover:text-red-300"
                                    title="Archive Page"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Page Meta Title & Slug editing */}
                    {activePage && activePage.id !== 'homepage' && activePage.id !== 'collection' && activePage.id !== 'product' && (
                        <div className="grid grid-cols-2 gap-2 mb-4 bg-[#202020] p-3 border border-[#262626] rounded">
                            <div>
                                <label className="block text-[8px] text-[#A3A3A3] uppercase tracking-widest mb-1">Route Slug</label>
                                <input 
                                    type="text" 
                                    className="w-full text-xs p-1.5 border border-[#333] bg-[#161616] text-white outline-none rounded"
                                    value={activePage.slug}
                                    onChange={e => {
                                        setUnsavedChanges(true);
                                        updatePageMeta(activePage.id, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') });
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] text-[#A3A3A3] uppercase tracking-widest mb-1">Display Name</label>
                                <input 
                                    type="text" 
                                    className="w-full text-xs p-1.5 border border-[#333] bg-[#161616] text-white outline-none rounded"
                                    value={activePage.name}
                                    onChange={e => {
                                        setUnsavedChanges(true);
                                        updatePageMeta(activePage.id, { name: e.target.value });
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Find layout section..." 
                            className="w-full pl-9 pr-4 py-2 text-xs border border-[#262626] bg-[#262626] focus:border-[#D4AF37] outline-none transition-colors text-white rounded"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* QUALITY & GOVERNANCE AUDITS */}
                    {auditReport.errors && auditReport.errors.length > 0 && (
                        <div className="border border-rose-950 bg-rose-950/20 p-3.5 space-y-2 rounded">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Publishing Blocked (Critical)
                            </span>
                            <ul className="space-y-1">
                                {auditReport.errors.map((e, i) => (
                                    <li key={i} className="text-[10px] text-rose-200/90 leading-relaxed list-disc pl-2 ml-2">{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {auditReport.warnings && auditReport.warnings.length > 0 && (
                        <div className="border border-amber-950 bg-amber-950/20 p-3.5 space-y-2 rounded">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Optimization Warnings
                            </span>
                            <ul className="space-y-1">
                                {auditReport.warnings.map((w, i) => (
                                    <li key={i} className="text-[10px] text-amber-200/90 leading-relaxed list-disc pl-2 ml-2">{w}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {(!auditReport.errors || auditReport.errors.length === 0) && (!auditReport.warnings || auditReport.warnings.length === 0) && (
                        <div className="border border-green-950 bg-green-950/20 p-3.5 space-y-1 rounded flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
                                Quality Gates Passed
                            </span>
                        </div>
                    )}

                    {/* GLOBAL SETTINGS ACCORDION */}
                    <div className="border border-[#262626] bg-[#1C1C1C] rounded overflow-hidden">
                        <div 
                            className={`w-full flex items-center justify-between p-4 text-left hover:bg-[#262626] transition-colors cursor-pointer ${openSectionIdx === 'global' ? 'bg-[#262626] border-b border-[#333]' : ''}`}
                            onClick={() => setOpenSectionIdx(openSectionIdx === 'global' ? null : 'global')}
                        >
                            <div className="flex items-center gap-2">
                                {openSectionIdx === 'global' ? <ChevronDown className="w-4 h-4 text-[#D4AF37]" /> : <ChevronRight className="w-4 h-4 text-[#D4AF37]" />}
                                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Global Store Tokens</span>
                            </div>
                            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </div>
                        {openSectionIdx === 'global' && (
                            <div className="p-4 space-y-4 bg-[#161616] text-xs">
                                <div>
                                    <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Announcement Banner</label>
                                    <input 
                                        type="text" 
                                        className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                        value={globalSettings?.announcement_text || ''}
                                        onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('announcement_text', e.target.value); }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Background</label>
                                        <div className="flex gap-2 items-center">
                                            <input 
                                                type="color" 
                                                className="w-8 h-8 p-0.5 border border-[#333] bg-transparent cursor-pointer rounded"
                                                value={globalSettings?.color_bg || '#FCFBF8'}
                                                onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('color_bg', e.target.value); }}
                                            />
                                            <span className="font-mono text-[10px]">{globalSettings?.color_bg}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Text Color</label>
                                        <div className="flex gap-2 items-center">
                                            <input 
                                                type="color" 
                                                className="w-8 h-8 p-0.5 border border-[#333] bg-transparent cursor-pointer rounded"
                                                value={globalSettings?.color_fg || '#1A1A1A'}
                                                onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('color_fg', e.target.value); }}
                                            />
                                            <span className="font-mono text-[10px]">{globalSettings?.color_fg}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Accent (Velvet)</label>
                                        <div className="flex gap-2 items-center">
                                            <input 
                                                type="color" 
                                                className="w-8 h-8 p-0.5 border border-[#333] bg-transparent cursor-pointer rounded"
                                                value={globalSettings?.color_accent || '#800020'}
                                                onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('color_accent', e.target.value); }}
                                            />
                                            <span className="font-mono text-[10px]">{globalSettings?.color_accent}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Accent (Gold)</label>
                                        <div className="flex gap-2 items-center">
                                            <input 
                                                type="color" 
                                                className="w-8 h-8 p-0.5 border border-[#333] bg-transparent cursor-pointer rounded"
                                                value={globalSettings?.color_gold || '#D4AF37'}
                                                onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('color_gold', e.target.value); }}
                                            />
                                            <span className="font-mono text-[10px]">{globalSettings?.color_gold}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Display Font</label>
                                        <select 
                                            className="w-full p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                            value={globalSettings?.font_display || "'Playfair Display', serif"}
                                            onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('font_display', e.target.value); }}
                                        >
                                            <option value="'Playfair Display', serif">Playfair Serif</option>
                                            <option value="'Outfit', sans-serif">Outfit Modern</option>
                                            <option value="'Cinzel', serif">Cinzel Traditional</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Body Font</label>
                                        <select 
                                            className="w-full p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                            value={globalSettings?.font_body || "'Poppins', sans-serif"}
                                            onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('font_body', e.target.value); }}
                                        >
                                            <option value="'Poppins', sans-serif">Poppins Soft</option>
                                            <option value="'Inter', sans-serif">Inter Technical</option>
                                            <option value="'Montserrat', sans-serif">Montserrat Elegant</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Border Radius</label>
                                        <input 
                                            type="text" 
                                            placeholder="8px"
                                            className="w-full p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                            value={globalSettings?.border_radius || ''}
                                            onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('border_radius', e.target.value); }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Button Style</label>
                                        <select 
                                            className="w-full p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                            value={globalSettings?.button_style || 'classic'}
                                            onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('button_style', e.target.value); }}
                                        >
                                            <option value="classic">Classic Sharp</option>
                                            <option value="rounded">Pill Rounded</option>
                                            <option value="square">Strict Square</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="border-t border-[#262626] pt-3 mt-3">
                                    <h4 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">WhatsApp & Contact</h4>
                                    <div className="flex gap-2 items-center mb-2">
                                        <input 
                                            type="checkbox" 
                                            id="wa-enabled" 
                                            className="accent-[#25D366]"
                                            checked={globalSettings?.whatsapp_enabled !== false}
                                            onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('whatsapp_enabled', e.target.checked); }}
                                        />
                                        <label htmlFor="wa-enabled" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">Enable Concierge</label>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="WhatsApp phone number"
                                        className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                        value={globalSettings?.whatsapp_number || ''}
                                        onChange={(e) => { setUnsavedChanges(true); updateGlobalSetting('whatsapp_number', e.target.value); }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SEO METADATA ACCORDION */}
                    <div className="border border-[#262626] bg-[#1C1C1C] rounded overflow-hidden">
                        <div 
                            className={`w-full flex items-center justify-between p-4 text-left hover:bg-[#262626] transition-colors cursor-pointer ${openSectionIdx === 'seo' ? 'bg-[#262626] border-b border-[#333]' : ''}`}
                            onClick={() => setOpenSectionIdx(openSectionIdx === 'seo' ? null : 'seo')}
                        >
                            <div className="flex items-center gap-2">
                                {openSectionIdx === 'seo' ? <ChevronDown className="w-4 h-4 text-[#D4AF37]" /> : <ChevronRight className="w-4 h-4 text-[#D4AF37]" />}
                                <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">SEO & Social Tags</span>
                            </div>
                            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </div>
                        {openSectionIdx === 'seo' && (
                            <div className="p-4 space-y-4 bg-[#161616] text-xs">
                                <div>
                                    <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Meta Title</label>
                                    <input 
                                        type="text" 
                                        className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                        placeholder={activePage?.name || ''}
                                        value={activePage?.seo_metadata?.title || ''}
                                        onChange={(e) => { 
                                            setUnsavedChanges(true); 
                                            updatePageMeta(activePage.id, { 
                                                seo_metadata: { 
                                                    title: e.target.value, 
                                                    description: activePage?.seo_metadata?.description || '' 
                                                } 
                                            }); 
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Meta Description</label>
                                    <textarea 
                                        className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded min-h-[60px]"
                                        placeholder="Add compelling description for Google search rankings..."
                                        value={activePage?.seo_metadata?.description || ''}
                                        onChange={(e) => { 
                                            setUnsavedChanges(true); 
                                            updatePageMeta(activePage.id, { 
                                                seo_metadata: { 
                                                    title: activePage?.seo_metadata?.title || activePage?.name || '', 
                                                    description: e.target.value 
                                                } 
                                            }); 
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION BUILDER LIST */}
                    <div className="space-y-2.5 pt-2">
                        <label className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-[#A3A3A3]">Layout Sections</label>
                        {filteredSections.length > 0 ? (
                            filteredSections.map((sec) => {
                                const idx = sec._idx;
                                const isOpen = openSectionIdx === idx;
                                
                                return (
                                    <div key={idx} className="border border-[#262626] bg-[#1E1E1E] rounded overflow-hidden">
                                        <div 
                                            role="button"
                                            className={`w-full flex items-center justify-between p-4 text-left hover:bg-[#2b2b2b] transition-colors cursor-pointer ${isOpen ? 'bg-[#262626] border-b border-[#333]' : ''}`}
                                            onClick={() => {
                                                const newIdx = isOpen ? null : idx;
                                                setOpenSectionIdx(newIdx);
                                                if (newIdx !== null && iframeRef.current?.contentWindow) {
                                                    iframeRef.current.contentWindow.postMessage({ type: 'CMS_SCROLL_TO', payload: `${sec.type}-${idx}` }, '*');
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isOpen ? <ChevronDown className="w-4 h-4 text-[#A3A3A3]" /> : <ChevronRight className="w-4 h-4 text-[#A3A3A3]" />}
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-white">{sec.type.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex bg-[#262626] rounded border border-[#333]">
                                                    <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="p-1 text-muted-foreground hover:text-white disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                                                    <button onClick={() => moveSection(idx, 'down')} disabled={idx === sections.length - 1} className="p-1 text-muted-foreground hover:text-white disabled:opacity-30 border-l border-[#333]"><ArrowDown className="w-3 h-3" /></button>
                                                </div>
                                                <button onClick={() => { removeSection(idx); setUnsavedChanges(true); }} className="text-muted-foreground hover:text-red-500 transition-colors p-1" title="Remove Section">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {isOpen && (
                                            <div className="p-4 space-y-4 bg-[#161616] text-xs">
                                                <div>
                                                    <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Headline (HTML Allowed)</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                        value={sec.settings?.headline || ''}
                                                        onChange={(e) => handleInput(idx, 'headline', e.target.value)}
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Subheadline / Paragraph Description</label>
                                                    <textarea 
                                                        className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded min-h-[60px]"
                                                        value={sec.settings?.description || sec.settings?.subheadline || ''}
                                                        onChange={(e) => handleInput(idx, 'description', e.target.value)}
                                                    />
                                                </div>

                                                {(sec.type === 'cinematic_hero' || sec.type === 'brand_story') && (
                                                    <>
                                                        <div>
                                                            <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Media Image / Video Source URL</label>
                                                            <div className="flex gap-2">
                                                                <input 
                                                                    type="text" 
                                                                    className="flex-1 text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                    placeholder="Paste asset URL..."
                                                                    value={sec.settings?.image_url || ''}
                                                                    onChange={(e) => handleInput(idx, 'image_url', e.target.value)}
                                                                />
                                                                <button 
                                                                    onClick={() => setMediaLibraryOpen({isOpen: true, targetIdx: idx})}
                                                                    className="px-3 border border-[#D4AF37] text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-colors rounded text-[#D4AF37]"
                                                                >
                                                                    Browse
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Media Alt Text (SEO & Screen Readers)</label>
                                                            <input 
                                                                type="text" 
                                                                className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                placeholder="Describe the image..."
                                                                value={sec.settings?.alt_text || ''}
                                                                onChange={(e) => handleInput(idx, 'alt_text', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Focal Point</label>
                                                            <div className="flex gap-2 items-center mt-3">
                                                                <label className="text-[9px] text-[#A3A3A3] uppercase font-bold tracking-widest">Focal Point</label>
                                                                <select 
                                                                    className="flex-1 text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded cursor-pointer"
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
                                                                <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">CTA Button Text</label>
                                                                <input 
                                                                    type="text" 
                                                                    className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                    value={sec.settings?.cta_text || ''}
                                                                    onChange={(e) => handleInput(idx, 'cta_text', e.target.value)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">CTA Target Link</label>
                                                                <input 
                                                                    type="text" 
                                                                    className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                    value={sec.settings?.cta_link || ''}
                                                                    onChange={(e) => handleInput(idx, 'cta_link', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        {sec.type === 'cinematic_hero' && (
                                                            <div className="space-y-3 mt-4 border-t border-[#333] pt-4">
                                                                <label className="block text-[9px] text-[#A3A3A3] uppercase font-bold tracking-widest mb-2">Trust Badges (Bottom Strip)</label>
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Badge 1 (e.g. Authentic Heritage Silks)"
                                                                    className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                    value={sec.settings?.trust_badge_1_text || ''}
                                                                    onChange={(e) => handleInput(idx, 'trust_badge_1_text', e.target.value)}
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Badge 2 (e.g. Secure Checkout)"
                                                                    className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                    value={sec.settings?.trust_badge_2_text || ''}
                                                                    onChange={(e) => handleInput(idx, 'trust_badge_2_text', e.target.value)}
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Badge 3 (e.g. 24/7 Styling Support)"
                                                                    className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                    value={sec.settings?.trust_badge_3_text || ''}
                                                                    onChange={(e) => handleInput(idx, 'trust_badge_3_text', e.target.value)}
                                                                />
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {sec.type === 'featured_collections' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Layout Style</label>
                                                            <select 
                                                                className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded cursor-pointer"
                                                                value={sec.settings?.layout || 'bento'}
                                                                onChange={(e) => handleInput(idx, 'layout', e.target.value)}
                                                            >
                                                                <option value="bento">Bento Grid (Dynamic Grid)</option>
                                                                <option value="standard">Standard Balanced Grid</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <input 
                                                                type="checkbox" 
                                                                id={`hide-text-${idx}`}
                                                                className="cursor-pointer accent-[#D4AF37]"
                                                                checked={sec.settings?.hide_text || false}
                                                                onChange={(e) => handleInput(idx, 'hide_text', e.target.checked)}
                                                            />
                                                            <label htmlFor={`hide-text-${idx}`} className="text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] cursor-pointer">Hide Category Text Overlay</label>
                                                        </div>
                                                        <div className="border-t border-[#333] pt-4 mt-4">
                                                            <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Source Data</label>
                                                            <select 
                                                                className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded cursor-pointer"
                                                                value={sec.settings?.source || 'auto'}
                                                                onChange={(e) => handleInput(idx, 'source', e.target.value)}
                                                            >
                                                                <option value="auto">Auto (from Database)</option>
                                                                <option value="manual">Manual Override</option>
                                                            </select>
                                                        </div>
                                                        {sec.settings?.source === 'manual' && (
                                                            <div className="space-y-4 pt-2">
                                                                <label className="block text-[9px] text-[#A3A3A3] uppercase font-bold tracking-widest mb-2">Manual Categories (4 slots)</label>
                                                                {[0,1,2,3].map((slotIdx) => {
                                                                    const cats = sec.settings?.categories || [];
                                                                    const slot = cats[slotIdx] || {};
                                                                    return (
                                                                        <div key={slotIdx} className="p-3 bg-[#262626] border border-[#333] rounded space-y-3">
                                                                            <h4 className="text-[10px] font-bold text-[#D4AF37] mb-2">Grid Slot {slotIdx + 1}</h4>
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="Title (e.g. Sarees)"
                                                                                className="w-full text-xs p-2 border border-[#333] bg-[#1a1a1a] text-white outline-none rounded"
                                                                                value={slot.name || ''}
                                                                                onChange={(e) => {
                                                                                    const newCats = [...cats];
                                                                                    newCats[slotIdx] = { ...slot, name: e.target.value, queryName: e.target.value };
                                                                                    handleInput(idx, 'categories', newCats);
                                                                                }}
                                                                            />
                                                                            <div className="flex gap-2">
                                                                                <input 
                                                                                    type="text" 
                                                                                    placeholder="Image URL"
                                                                                    className="flex-1 text-xs p-2 border border-[#333] bg-[#1a1a1a] text-white outline-none rounded"
                                                                                    value={slot.image || ''}
                                                                                    onChange={(e) => {
                                                                                        const newCats = [...cats];
                                                                                        newCats[slotIdx] = { ...slot, image: e.target.value };
                                                                                        handleInput(idx, 'categories', newCats);
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <select 
                                                                                className="w-full text-xs p-2 border border-[#333] bg-[#1a1a1a] text-white outline-none rounded"
                                                                                value={slot.focal_point || 'center'}
                                                                                onChange={(e) => {
                                                                                    const newCats = [...cats];
                                                                                    newCats[slotIdx] = { ...slot, focal_point: e.target.value };
                                                                                    handleInput(idx, 'categories', newCats);
                                                                                }}
                                                                            >
                                                                                <option value="center">Image Crop: Center</option>
                                                                                <option value="top">Image Crop: Top</option>
                                                                                <option value="bottom">Image Crop: Bottom</option>
                                                                                <option value="left">Image Crop: Left</option>
                                                                                <option value="right">Image Crop: Right</option>
                                                                            </select>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {(sec.type === 'trending_slider' || sec.type === 'collection_grid') && (
                                                    <div>
                                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Select Product Category</label>
                                                        <select 
                                                            className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded cursor-pointer"
                                                            value={sec.settings?.category || 'Half Sarees'}
                                                            onChange={(e) => handleInput(idx, 'category', e.target.value)}
                                                        >
                                                            <option value="Half Sarees">Half Sarees</option>
                                                            <option value="Bridal">Bridal</option>
                                                            <option value="Fabrics">Fabrics</option>
                                                            <option value="Festive">Festive</option>
                                                            <option value="Ready-to-Ship">Ready-to-Ship</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {sec.type === 'product_hero' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-[9px] text-[#A3A3A3] uppercase font-bold tracking-widest mb-2">Boutique Services</label>
                                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Service 1 Name (e.g. Custom Stitching)"
                                                                    className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                    value={sec.settings?.stitching_label || ''}
                                                                    onChange={(e) => handleInput(idx, 'stitching_label', e.target.value)}
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Price (e.g. 1,500)"
                                                                    className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                    value={sec.settings?.stitching_price || ''}
                                                                    onChange={(e) => handleInput(idx, 'stitching_price', e.target.value)}
                                                                />
                                                            </div>
                                                            <textarea 
                                                                className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded min-h-[40px] mb-4"
                                                                placeholder="Service 1 Description"
                                                                value={sec.settings?.stitching_desc || ''}
                                                                onChange={(e) => handleInput(idx, 'stitching_desc', e.target.value)}
                                                            />
                                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Service 2 Name (e.g. Fall & Pico)"
                                                                    className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                    value={sec.settings?.fall_pico_label || ''}
                                                                    onChange={(e) => handleInput(idx, 'fall_pico_label', e.target.value)}
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Price (e.g. 300)"
                                                                    className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded"
                                                                    value={sec.settings?.fall_pico_price || ''}
                                                                    onChange={(e) => handleInput(idx, 'fall_pico_price', e.target.value)}
                                                                />
                                                            </div>
                                                            <textarea 
                                                                className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded min-h-[40px]"
                                                                placeholder="Service 2 Description"
                                                                value={sec.settings?.fall_pico_desc || ''}
                                                                onChange={(e) => handleInput(idx, 'fall_pico_desc', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#262626]">
                                                    <div>
                                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Responsive View</label>
                                                        <select 
                                                            className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded cursor-pointer"
                                                            value={sec.settings?.visibility || 'all'}
                                                            onChange={(e) => handleInput(idx, 'visibility', e.target.value)}
                                                        >
                                                            <option value="all">Show Everywhere</option>
                                                            <option value="desktop_only">Desktop Only</option>
                                                            <option value="mobile_only">Mobile Only</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] text-[#A3A3A3] mb-1 uppercase font-bold tracking-widest">Vertical Padding</label>
                                                        <select 
                                                            className="w-full text-xs p-2 border border-[#333] bg-[#222] text-white outline-none rounded cursor-pointer"
                                                            value={sec.settings?.padding || 'default'}
                                                            onChange={(e) => handleInput(idx, 'padding', e.target.value)}
                                                        >
                                                            <option value="default">Default Padding</option>
                                                            <option value="none">No Padding</option>
                                                            <option value="small">Compact Padding</option>
                                                            <option value="large">Spacious (Editorial)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-[#333]">
                                No page layout sections match your query.
                            </div>
                        )}
                        
                        <button 
                            onClick={() => setAddSectionModalOpen(true)}
                            className="w-full mt-4 py-4 border-2 border-dashed border-[#333] text-[#A3A3A3] hover:text-white hover:border-[#D4AF37] transition-colors flex flex-col items-center justify-center gap-1.5 bg-[#1F1F1F] rounded"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Add New Section</span>
                        </button>
                    </div>

                    {/* RESTORE ARCHIVED PAGES PANEL */}
                    {pages.some(p => p.isDeleted) && (
                        <div className="border border-[#262626] bg-red-950/5 rounded p-4 mt-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#EF4444] mb-3 flex items-center gap-1.5">
                                <RotateCcw className="w-3.5 h-3.5" /> Recover Archived Pages
                            </h3>
                            <div className="space-y-2">
                                {pages.filter(p => p.isDeleted).map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-[#161616] p-2 border border-[#262626] rounded text-xs">
                                        <div>
                                            <span className="font-bold text-white block">{p.name}</span>
                                            <span className="text-[9px] text-[#A3A3A3] font-mono">c/{p.slug}</span>
                                        </div>
                                        <button 
                                            onClick={() => { restorePage(p.id); setUnsavedChanges(true); }}
                                            className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold bg-[#262626] hover:bg-[#D4AF37] hover:text-black transition-colors rounded"
                                        >
                                            Restore
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Canvas preview */}
            <div className="flex-1 flex flex-col bg-[#141414] relative">
                <div className="h-16 border-b border-[#262626] flex items-center justify-between px-6 bg-[#161616] shadow-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-[#262626] p-1 rounded border border-[#333]">
                            <button onClick={() => setViewport('desktop')} className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors rounded-sm ${viewport === 'desktop' ? 'bg-[#D4AF37] text-black shadow-sm font-extrabold' : 'text-muted-foreground hover:text-white'}`}>Desktop</button>
                            <button onClick={() => setViewport('tablet')} className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors rounded-sm ${viewport === 'tablet' ? 'bg-[#D4AF37] text-black shadow-sm font-extrabold' : 'text-muted-foreground hover:text-white'}`}>Tablet</button>
                            <button onClick={() => setViewport('mobile')} className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors rounded-sm ${viewport === 'mobile' ? 'bg-[#D4AF37] text-black shadow-sm font-extrabold' : 'text-muted-foreground hover:text-white'}`}>Mobile</button>
                        </div>
                        
                        <button 
                            onClick={() => setInteractionLock(!interactionLock)} 
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#333] text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors rounded"
                        >
                            {interactionLock ? <Lock className="w-3 h-3 text-[#EF4444]" /> : <Unlock className="w-3 h-3 text-green-500" />}
                            {interactionLock ? 'Lock Editor Interactions' : 'Live Iframe Navigation'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {userRole === 'Manager' && (
                            <button 
                                onClick={fetchSnapshots}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 border border-[#333] hover:bg-[#262626] text-[#A3A3A3] hover:text-white px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-colors rounded disabled:opacity-50"
                                title="View Publishing History & Rollbacks"
                            >
                                <History className="w-3 h-3" /> Version History
                            </button>
                        )}

                        <button 
                            onClick={() => handleRollback()}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 border border-red-950 bg-red-950/20 hover:bg-red-950/40 text-red-400 px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-colors rounded disabled:opacity-50"
                            title="Discard draft edits and revert to live published configuration"
                        >
                            <RotateCcw className="w-3 h-3 text-red-400" /> Discard Draft
                        </button>

                        <button 
                            onClick={handleSaveDraft}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 border border-[#333] hover:bg-[#262626] text-white px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-colors rounded disabled:opacity-50"
                        >
                            <Save className="w-3 h-3" /> Save Draft
                        </button>
                        
                        {userRole === 'Manager' ? (
                            <button 
                                onClick={() => {
                                    setWarningsAcknowledged(false);
                                    setPublishModalOpen(true);
                                }}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 bg-[#D4AF37] text-black px-6 py-2.5 text-[9px] font-extrabold uppercase tracking-widest hover:bg-[#B8962B] transition-colors rounded disabled:opacity-50"
                            >
                                <Globe className="w-3.5 h-3.5" /> Publish Live
                            </button>
                        ) : (
                            <button 
                                onClick={() => {
                                    setApprovalNotes('');
                                    setApprovalModalOpen(true);
                                }}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 bg-amber-500 text-black px-5 py-2.5 text-[9px] font-extrabold uppercase tracking-widest hover:bg-amber-400 transition-colors rounded disabled:opacity-50"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Request Approval
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Canvas Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0C0C0C]">
                    {/* Banners */}
                    {activePage?.approval_status === 'Pending Review' && (
                        <div className="bg-[#1C1510] border-b border-[#D4AF37]/30 px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 w-full shrink-0">
                            <div className="space-y-0.5 text-left">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5 animate-pulse">
                                    <Sparkles className="w-3.5 h-3.5" /> Pending Curation Approval
                                </p>
                                <p className="text-[11px] text-[#E5E5E5]/90">
                                    Submitted by: <span className="text-[#D4AF37] font-medium">{activePage.requested_by || 'Staff'}</span> • Note: <span className="italic">"{activePage.approval_notes || 'No description'}"</span>
                                </p>
                            </div>
                            
                            {userRole === 'Manager' && (
                                <div className="flex gap-2 shrink-0">
                                    <button 
                                        onClick={() => {
                                            setRejectionFeedback('');
                                            setRejectionModalOpen(true);
                                        }}
                                        className="px-4 py-2 border border-rose-950 hover:bg-rose-950/20 text-rose-400 text-[9px] font-extrabold uppercase tracking-widest transition-colors rounded"
                                    >
                                        Reject Request
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                await approveAndPublish(activePage.approval_notes || 'Approved');
                                                alert("Curation draft approved and published live successfully!");
                                            } catch (err: any) {
                                                alert(`Failed to publish: ${err.message}`);
                                            }
                                        }}
                                        className="px-5 py-2 bg-[#D4AF37] text-black hover:bg-[#B8962B] text-[9px] font-extrabold uppercase tracking-widest transition-colors rounded"
                                    >
                                        Approve & Publish Live
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activePage?.approval_status === 'Rejected' && (
                        <div className="bg-rose-950/20 border-b border-rose-900/40 px-6 py-3.5 text-left z-20 w-full shrink-0 space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" /> Curation Request Rejected
                            </p>
                            <p className="text-[11px] text-rose-200/90 leading-relaxed">
                                Feedback: <span className="font-medium">"{activePage.rejection_feedback || 'No feedback provided'}"</span>. Make the required adjustments and submit again.
                            </p>
                        </div>
                    )}

                    {/* Preview Workspace */}
                    <div className="flex-1 p-8 flex justify-center items-center overflow-auto relative w-full h-full">
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center backdrop-blur-sm">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4AF37] mb-2 mr-3"></div>
                                <span className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]">Saving changes securely...</span>
                            </div>
                        )}
                        <div className={`bg-white border border-[#262626] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] h-full overflow-hidden ${
                            viewport === 'mobile' ? 'w-[390px] max-h-[844px] rounded-[2.5rem] border-[12px] border-black ring-4 ring-[#262626]' : 
                            viewport === 'tablet' ? 'w-[768px] max-h-[1024px] rounded-xl border-[8px] border-black ring-2 ring-[#262626]' : 'w-full rounded-md'
                        }`}>
                            <iframe 
                                ref={iframeRef}
                                id="preview-iframe"
                                src={iframeUrl} 
                                className={`w-full h-full border-none bg-white transition-opacity duration-300 ${interactionLock ? 'pointer-events-none' : ''}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Clone Page Modal */}
                {cloneModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
                        <div className="bg-[#1C1C1C] w-full max-w-md shadow-2xl p-6 border border-[#262626] flex flex-col rounded">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#262626]">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">Clone Current Page</h2>
                                <button onClick={() => setCloneModalOpen(false)} className="text-muted-foreground hover:text-white"><X className="w-4 h-4" /></button>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1.5">New Page Title</label>
                                    <input 
                                        type="text" 
                                        className="w-full text-xs p-2.5 border border-[#333] bg-[#262626] text-white outline-none rounded focus:border-[#D4AF37]"
                                        placeholder="e.g. Diwali bridal Campaign"
                                        value={cloneName}
                                        onChange={e => {
                                            setCloneName(e.target.value);
                                            // auto generate matching URL slug
                                            setCloneSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1.5">Route URL Path</label>
                                    <div className="flex items-center bg-[#262626] border border-[#333] rounded overflow-hidden">
                                        <span className="text-[10px] font-mono px-3 text-[#A3A3A3] border-r border-[#333] bg-[#1C1C1C] py-2">/c/</span>
                                        <input 
                                            type="text" 
                                            className="flex-1 text-xs p-2.5 bg-transparent text-white outline-none"
                                            placeholder="diwali-bridal"
                                            value={cloneSlug}
                                            onChange={e => setCloneSlug(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button onClick={() => setCloneModalOpen(false)} className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-[#333] hover:bg-[#262626] rounded">Cancel</button>
                                <button 
                                    onClick={handleCloneSubmit} 
                                    className="px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest bg-[#D4AF37] text-black hover:bg-[#B8962B] transition-colors rounded"
                                >
                                    Confirm Clone
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Publish Modal */}
                {publishModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
                        <div className="bg-[#1C1C1C] w-full max-w-lg shadow-2xl p-7 border border-[#262626] flex flex-col rounded">
                            <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#262626]">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">Confirm Deployment</h2>
                                <button onClick={() => setPublishModalOpen(false)} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            
                            {/* Validation Quality Gates */}
                            {auditReport.errors && auditReport.errors.length > 0 ? (
                                <div className="bg-rose-950/20 border border-rose-900/60 p-4 mb-6 rounded text-xs">
                                    <div className="flex items-center gap-2 mb-3 text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                                        <AlertCircle className="w-4 h-4 text-rose-500" /> Production Publish Blocked
                                    </div>
                                    <p className="text-rose-200/80 mb-3 leading-relaxed">
                                        The following critical issues must be resolved in the editor before this page can be published live:
                                    </p>
                                    <ul className="space-y-2 text-[#E5E5E5]/90 max-h-[160px] overflow-y-auto pr-2 list-disc pl-4">
                                        {auditReport.errors.map((err, i) => (
                                            <li key={i} className="text-rose-100/90 leading-normal">{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : auditReport.warnings && auditReport.warnings.length > 0 ? (
                                <div className="bg-amber-950/20 border border-amber-900/60 p-4 mb-6 rounded text-xs">
                                    <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Pre-Publish Recommendations
                                    </div>
                                    <p className="text-amber-200/80 mb-3 leading-relaxed">
                                        Optimization warnings were detected. While these do not block publishing, fixing them is highly recommended:
                                    </p>
                                    <ul className="space-y-2 text-[#E5E5E5]/90 max-h-[120px] overflow-y-auto pr-2 list-disc pl-4 mb-4">
                                        {auditReport.warnings.map((warn, i) => (
                                            <li key={i} className="text-amber-100/90 leading-normal">{warn}</li>
                                        ))}
                                    </ul>
                                    <label className="flex items-start gap-2.5 p-2 bg-[#222] border border-[#333] hover:border-amber-700/50 cursor-pointer rounded transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="mt-0.5 border-[#333] accent-[#D4AF37]" 
                                            checked={warningsAcknowledged}
                                            onChange={e => setWarningsAcknowledged(e.target.checked)}
                                        />
                                        <span className="text-[10px] text-amber-200 select-none leading-tight font-medium">
                                            I acknowledge these warnings and want to publish live anyway
                                        </span>
                                    </label>
                                </div>
                            ) : (
                                <div className="bg-green-950/20 border border-green-900/60 p-4 mb-6 rounded text-xs flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2 text-green-400 font-bold uppercase tracking-wider text-[10px]">
                                        <Check className="w-4 h-4 text-green-500" /> All Quality Gates Passed
                                    </div>
                                    <p className="text-green-200/80 leading-normal">
                                        This page successfully matches all SEO, accessibility, links, and mobile performance budgets. Live deployment is cleared.
                                    </p>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Audit Deployment Notes</label>
                                <textarea 
                                    className="w-full border border-[#333] p-3 text-xs focus:border-[#D4AF37] outline-none min-h-[80px] bg-[#222] text-white rounded"
                                    placeholder="Summarize changes for boutique revision history log..."
                                    value={publishNote}
                                    onChange={e => setPublishNote(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button onClick={() => setPublishModalOpen(false)} className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-[#333] hover:bg-[#262626] rounded">
                                    {auditReport.errors && auditReport.errors.length > 0 ? "Return to Editor" : "Cancel"}
                                </button>
                                
                                {(!auditReport.errors || auditReport.errors.length === 0) && (
                                    <button 
                                        onClick={handlePublish}
                                        disabled={auditReport.warnings && auditReport.warnings.length > 0 && !warningsAcknowledged}
                                        className="px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest bg-[#D4AF37] text-black hover:bg-[#B8962B] transition-colors rounded disabled:opacity-30 disabled:hover:bg-[#D4AF37] disabled:cursor-not-allowed"
                                    >
                                        Deploy & Publish
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Request Approval Modal */}
                {approvalModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
                        <div className="bg-[#1C1C1C] w-full max-w-lg shadow-2xl p-7 border border-[#262626] flex flex-col rounded">
                            <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#262626]">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500">Request Publish Approval</h2>
                                <button onClick={() => setApprovalModalOpen(false)} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Curation Request Notes</label>
                                <textarea 
                                    className="w-full border border-[#333] p-3 text-xs focus:border-[#D4AF37] outline-none min-h-[100px] bg-[#222] text-white rounded"
                                    placeholder="Describe your design updates and visual adjustments..."
                                    value={approvalNotes}
                                    onChange={e => setApprovalNotes(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 text-xs font-bold uppercase tracking-widest">
                                <button onClick={() => setApprovalModalOpen(false)} className="px-5 py-2.5 border border-[#333] hover:bg-[#262626] text-white rounded text-[10px]">Cancel</button>
                                <button 
                                    onClick={async () => {
                                        try {
                                            await requestPublishApproval(approvalNotes, userEmail || 'staff@deeprastore.com');
                                            setApprovalModalOpen(false);
                                            alert("Curation draft submitted for review successfully.");
                                        } catch (err: any) {
                                            alert(`Failed to submit review request: ${err.message}`);
                                        }
                                    }}
                                    disabled={isLoading}
                                    className="px-5 py-2.5 bg-amber-500 text-black hover:bg-amber-400 rounded text-[10px]"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejection Modal */}
                {rejectionModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
                        <div className="bg-[#1C1C1C] w-full max-w-lg shadow-2xl p-7 border border-[#262626] flex flex-col rounded">
                            <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#262626]">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-rose-500">Reject Curation Request</h2>
                                <button onClick={() => setRejectionModalOpen(false)} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Rejection Feedback / Constructive Critique</label>
                                <textarea 
                                    className="w-full border border-rose-950 p-3 text-xs focus:border-rose-500 outline-none min-h-[100px] bg-[#222] text-white rounded"
                                    placeholder="Specify what needs to be changed (e.g. contrast, alignment, styling rules)..."
                                    value={rejectionFeedback}
                                    onChange={e => setRejectionFeedback(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 text-xs font-bold uppercase tracking-widest">
                                <button onClick={() => setRejectionModalOpen(false)} className="px-5 py-2.5 border border-[#333] hover:bg-[#262626] text-white rounded text-[10px]">Cancel</button>
                                <button 
                                    onClick={async () => {
                                        try {
                                            await rejectPublishRequest(rejectionFeedback);
                                            setRejectionModalOpen(false);
                                            alert("Curation request rejected and feedback recorded.");
                                        } catch (err: any) {
                                            alert(`Failed to reject request: ${err.message}`);
                                        }
                                    }}
                                    disabled={isLoading}
                                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px]"
                                >
                                    Reject Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Version History Modal */}
                {versionHistoryOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
                        <div className="bg-[#1C1C1C] w-full max-w-3xl shadow-2xl p-7 border border-[#262626] flex flex-col max-h-[85vh] rounded">
                            <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#262626]">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                                    <History className="w-4 h-4" /> Immutable Publish History
                                </h2>
                                <button onClick={() => setVersionHistoryOpen(false)} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
                                {loadingSnapshots ? (
                                    <div className="py-12 text-center text-xs text-[#A3A3A3] uppercase tracking-widest animate-pulse">Loading immutable snapshots...</div>
                                ) : snapshots.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-[#A3A3A3] uppercase tracking-widest border border-dashed border-[#333] rounded">No historical snapshots found.</div>
                                ) : (
                                    snapshots.map((snap, i) => (
                                        <div key={snap.id} className="bg-[#161616] border border-[#262626] p-4 rounded flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:border-[#333] transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-white">
                                                        {new Date(snap.published_at).toLocaleString()}
                                                    </span>
                                                    {i === 0 && <span className="text-[8px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded uppercase font-bold tracking-widest border border-[#D4AF37]/30">Current Live</span>}
                                                    {snap.rollback_source_metadata && <span className="text-[8px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest border border-red-900/50">Rollback</span>}
                                                </div>
                                                <p className="text-[10px] text-[#A3A3A3] max-w-lg">
                                                    <span className="text-[#D4AF37]">Notes:</span> {snap.publish_notes || 'Manual Publish'}
                                                </p>
                                                <p className="text-[8px] text-muted-foreground font-mono mt-2 opacity-50">ID: {snap.id}</p>
                                            </div>
                                            <div className="shrink-0 flex items-center">
                                                {i !== 0 && (
                                                    <button 
                                                        onClick={() => handleRollback(snap.id)}
                                                        disabled={isLoading}
                                                        className="px-4 py-2 border border-red-950 hover:bg-red-950/30 text-red-400 text-[9px] font-extrabold uppercase tracking-widest transition-colors rounded disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        <RotateCcw className="w-3 h-3" /> Revert to this Version
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Section Modal with Presets */}
                {addSectionModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
                        <div className="bg-[#1C1C1C] w-full max-w-3xl shadow-2xl p-8 border border-[#262626] flex flex-col max-h-[85vh] rounded">
                            <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#262626]">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">Add Section with Style Preset</h2>
                                <button onClick={() => setAddSectionModalOpen(false)} className="text-muted-foreground hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5 pr-2">
                                {/* Cinematic Hero presets */}
                                <div className="border border-[#262626] p-4 bg-[#161616] rounded space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Cinematic Hero</h3>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">Full-bleed header block showcasing collections with custom headlines, call-to-actions, and focal positioning.</p>
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#262626]">
                                        <button onClick={() => handleAddSectionWithPreset('cinematic_hero', 'Luxury')} className="p-2 border border-[#333] hover:border-[#D4AF37] bg-[#222] hover:bg-[#262626] rounded text-[10px] font-bold uppercase tracking-wider text-white">Luxury Preset</button>
                                        <button onClick={() => handleAddSectionWithPreset('cinematic_hero', 'Editorial')} className="p-2 border border-[#333] hover:border-[#D4AF37] bg-[#222] hover:bg-[#262626] rounded text-[10px] font-bold uppercase tracking-wider text-white">Editorial Preset</button>
                                        <button onClick={() => handleAddSectionWithPreset('cinematic_hero', 'Festival')} className="p-2 border border-[#333] hover:border-[#D4AF37] bg-[#222] hover:bg-[#262626] rounded text-[10px] font-bold uppercase tracking-wider text-white">Festival Preset</button>
                                        <button onClick={() => handleAddSectionWithPreset('cinematic_hero', 'Minimal')} className="p-2 border border-[#333] hover:border-[#D4AF37] bg-[#222] hover:bg-[#262626] rounded text-[10px] font-bold uppercase tracking-wider text-white">Minimal Preset</button>
                                    </div>
                                </div>

                                {/* Brand Story presets */}
                                <div className="border border-[#262626] p-4 bg-[#161616] rounded space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Brand Story</h3>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">Boutique editorial column blending handloom craftsmanship stories with beautiful imagery and boutique values.</p>
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#262626]">
                                        <button onClick={() => handleAddSectionWithPreset('brand_story', 'Luxury')} className="p-2 border border-[#333] hover:border-[#D4AF37] bg-[#222] hover:bg-[#262626] rounded text-[10px] font-bold uppercase tracking-wider text-white">Luxury Story</button>
                                        <button onClick={() => handleAddSectionWithPreset('brand_story', 'Minimal')} className="p-2 border border-[#333] hover:border-[#D4AF37] bg-[#222] hover:bg-[#262626] rounded text-[10px] font-bold uppercase tracking-wider text-white">Minimal Story</button>
                                    </div>
                                </div>

                                {/* System templates & simple blocks */}
                                {[
                                    { id: 'featured_collections', label: 'Featured Collections', desc: 'Bento category layout block targeting collections.' },
                                    { id: 'trending_slider', label: 'Trending Product Slider', desc: 'Horizontal scrollable grid presenting trending or stock push products.' },
                                    { id: 'instagram_feed', label: 'Social Gallery Grid', desc: 'Six-column Instagram style grid showcasing community photos.' },
                                    { id: 'product_hero', label: 'Product Details Hero', desc: 'Product imagery details, boutique services checkbox, and buy flows.' },
                                    { id: 'collection_grid', label: 'Collection Grid & Sidebar', desc: 'Collection product listing with sidebar category selector and price sliders.' },
                                    { id: 'related_products', label: 'Related Cross-Sell Suggestions', desc: 'Three-column related products recommendation block.' }
                                ].map((component) => (
                                    <div 
                                        key={component.id}
                                        onClick={() => handleAddSectionWithPreset(component.id)}
                                        className="border border-[#262626] p-4 hover:border-[#D4AF37] cursor-pointer transition-all bg-[#161616] hover:bg-[#1E1E1E] rounded flex flex-col justify-between"
                                    >
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest mb-1 text-white">{component.label}</h3>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">{component.desc}</p>
                                        </div>
                                        <div className="text-[9px] uppercase tracking-wider font-extrabold text-[#D4AF37] mt-3 self-end">Add Section →</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Media Library Browser (Shopify Style Split Pane) */}
                {mediaLibraryOpen.isOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
                        <div 
                            className={`bg-[#1C1C1C] w-full max-w-6xl shadow-2xl border ${isDraggingMedia ? 'border-[#D4AF37] border-2 scale-[1.01]' : 'border-[#262626]'} flex flex-col h-[85vh] rounded-lg overflow-hidden transition-all duration-200`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            
                            {/* Header Area */}
                            <div className="flex justify-between items-center p-5 border-b border-[#262626] bg-[#161616]">
                                <div className="flex items-center gap-6 flex-1">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">Select file</h2>
                                    
                                    {/* Search Bar */}
                                    <div className="relative w-full max-w-md">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input 
                                            type="text" 
                                            placeholder="Search files..." 
                                            value={mediaSearchQuery}
                                            onChange={(e) => setMediaSearchQuery(e.target.value)}
                                            className="w-full bg-[#111] border border-[#333] text-sm text-white rounded px-9 py-2 focus:outline-none focus:border-[#D4AF37]"
                                        />
                                    </div>
                                </div>
                                
                                <button onClick={() => setMediaLibraryOpen({isOpen: false, targetIdx: null})} className="text-muted-foreground hover:text-white p-2">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Toolbar */}
                            <div className="flex justify-between items-center px-5 py-3 border-b border-[#262626] bg-[#1a1a1a]">
                                <div className="flex gap-2">
                                    <button onClick={() => setActiveMediaTab('all')} className={`px-4 py-1.5 text-[11px] font-bold rounded transition-colors ${activeMediaTab === 'all' ? 'bg-[#333] text-white' : 'text-[#A3A3A3] hover:text-white hover:bg-[#222]'}`}>All files</button>
                                    <button onClick={() => setActiveMediaTab('images')} className={`px-4 py-1.5 text-[11px] font-bold rounded transition-colors ${activeMediaTab === 'images' ? 'bg-[#333] text-white' : 'text-[#A3A3A3] hover:text-white hover:bg-[#222]'}`}>Images</button>
                                    <button onClick={() => setActiveMediaTab('videos')} className={`px-4 py-1.5 text-[11px] font-bold rounded transition-colors ${activeMediaTab === 'videos' ? 'bg-[#333] text-white' : 'text-[#A3A3A3] hover:text-white hover:bg-[#222]'}`}>Videos</button>
                                </div>
                                <div>
                                    <input 
                                        type="file" 
                                        id="media-upload" 
                                        className="hidden" 
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={handleMediaUpload} 
                                        disabled={isUploadingMedia} 
                                    />
                                    <label htmlFor="media-upload" className="px-4 py-1.5 bg-[#D4AF37] text-black text-[11px] font-extrabold cursor-pointer hover:bg-[#B8962B] transition-colors rounded flex items-center gap-2">
                                        {isUploadingMedia ? <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" /> : <Plus className="w-3.5 h-3.5" />}
                                        {isUploadingMedia ? 'Uploading...' : 'Add media'}
                                    </label>
                                </div>
                            </div>
                            
                            {/* Main Split Content */}
                            <div className="flex flex-1 overflow-hidden">
                                
                                {/* Left Side: Grid */}
                                <div className="flex-1 overflow-y-auto p-5 bg-[#111]">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                        {filteredMediaFiles.map((url, i) => {
                                            const isVid = url.match(/\.(mp4|webm)$/i) || url.includes('vimeo');
                                            const isSelected = selectedAsset === url;
                                            const fileName = url.split('/').pop() || `File ${i}`;
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    onClick={() => setSelectedAsset(isSelected ? null : url)}
                                                    className={`aspect-square bg-[#1C1C1C] border ${isSelected ? 'border-[#D4AF37] shadow-[0_0_0_1px_#D4AF37]' : 'border-[#333] hover:border-[#555]'} relative group cursor-pointer overflow-hidden rounded-md transition-all`}
                                                >
                                                    {isVid ? (
                                                        <video src={url} className="w-full h-full object-cover" muted />
                                                    ) : (
                                                        <Image src={url} alt={fileName} fill className="object-cover" sizes="(max-width: 768px) 33vw, 20vw" />
                                                    )}
                                                    
                                                    {/* Checkbox (Top Left) */}
                                                    <div className="absolute top-2 left-2 z-10">
                                                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-black/40 border-white/40 group-hover:border-white'}`}>
                                                            {isSelected && <Check className="w-3 h-3 text-black" />}
                                                        </div>
                                                    </div>

                                                    {/* File Label (Bottom) */}
                                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                                                        <p className="text-[9px] text-white truncate text-center font-medium opacity-90">{fileName.split('.')[0].substring(0, 15)}...</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Side: Preview Panel */}
                                {selectedAsset && (
                                    <div className="w-[320px] bg-[#1C1C1C] border-l border-[#262626] flex flex-col overflow-y-auto">
                                        <div className="p-4 border-b border-[#262626] flex justify-between items-center bg-[#161616]">
                                            <h3 className="text-sm font-semibold text-white">Preview</h3>
                                            <button onClick={() => setSelectedAsset(null)} className="text-zinc-500 hover:text-white">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col gap-4">
                                            <div className="w-full aspect-[3/4] bg-black rounded-lg border border-[#333] relative overflow-hidden flex items-center justify-center">
                                                {(selectedAsset.match(/\.(mp4|webm)$/i) || selectedAsset.includes('vimeo')) ? (
                                                    <video src={selectedAsset} className="max-w-full max-h-full object-contain" controls autoPlay loop />
                                                ) : (
                                                    <Image src={selectedAsset} alt="Preview" fill className="object-contain" />
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-col gap-1 mt-2">
                                                <p className="text-xs text-white break-words font-medium">{selectedAsset.split('/').pop()}</p>
                                                <p className="text-[10px] text-zinc-500">
                                                    {(selectedAsset.match(/\.(mp4|webm)$/i) || selectedAsset.includes('vimeo')) ? 'Video' : 'Image'}
                                                </p>
                                            </div>

                                            <div className="mt-auto pt-4 flex gap-2">
                                                <button 
                                                    onClick={() => handleDeleteMedia(selectedAsset)}
                                                    className="flex-1 px-4 py-2 bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900 hover:text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Action Bar */}
                            <div className="p-4 border-t border-[#262626] bg-[#161616] flex justify-end gap-3">
                                <button 
                                    onClick={() => setMediaLibraryOpen({isOpen: false, targetIdx: null})}
                                    className="px-5 py-2 text-xs font-bold text-white bg-[#222] border border-[#333] hover:bg-[#333] rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={!selectedAsset}
                                    onClick={() => {
                                        if (selectedAsset && mediaLibraryOpen.targetIdx !== null) {
                                            handleInput(mediaLibraryOpen.targetIdx, 'image_url', selectedAsset);
                                            if (sections[mediaLibraryOpen.targetIdx]?.type === 'cinematic_hero') {
                                                handleInput(mediaLibraryOpen.targetIdx, 'media_url', selectedAsset);
                                            }
                                            setMediaLibraryOpen({isOpen: false, targetIdx: null});
                                            setSelectedAsset(null); // Reset selection
                                        }
                                    }}
                                    className={`px-5 py-2 text-xs font-bold rounded transition-colors ${selectedAsset ? 'bg-[#D4AF37] text-black hover:bg-[#B8962B]' : 'bg-[#333] text-zinc-500 cursor-not-allowed'}`}
                                >
                                    Done
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
