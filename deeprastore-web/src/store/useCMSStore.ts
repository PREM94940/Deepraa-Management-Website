import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { saveDraftCMSAction, publishCMSAction, rollbackCMSAction, requestPublishApprovalCMSAction, approveAndPublishCMSAction, rejectPublishRequestCMSAction } from '@/lib/actions/cms';

export interface PageData {
    id: string; // e.g. 'homepage', 'collection', 'product', or custom uuid
    name: string;
    slug: string;
    type: 'homepage' | 'collection' | 'product' | 'lookbook' | 'campaign' | 'festival' | 'custom';
    status: 'draft' | 'published' | 'scheduled' | 'archived' | 'sandbox';
    sections: any[];
    seo_metadata?: {
        title: string;
        description: string;
    };
    isDeleted?: boolean;
    // Approvals Workflow Extensions
    approval_status?: 'Draft' | 'Pending Review' | 'Approved' | 'Rejected';
    requested_by?: string;
    approval_notes?: string;
    rejection_feedback?: string;
}

interface CMSState {
    pages: PageData[];
    currentPageId: string;
    globalSettings: Record<string, any>;
    sections: any[]; // convenience binding for active page's sections
    isLoading: boolean;
    error: string | null;
    
    // Core Navigation & Configuration
    setCurrentPageId: (id: string) => void;
    setGlobalSettings: (settings: any) => void;
    updateGlobalSetting: (key: string, value: any) => void;
    
    // Section Management
    setSections: (sections: any[]) => void;
    updateSection: (idx: number, data: any) => void;
    addSection: (index: number, type: string, defaultSettings?: any) => void;
    removeSection: (idx: number) => void;
    moveSection: (idx: number, direction: 'up' | 'down') => void;
    
    // Page Operations
    addPage: (page: Omit<PageData, 'sections'> & { sections?: any[] }) => void;
    updatePageMeta: (id: string, updates: Partial<Omit<PageData, 'id' | 'sections'>>) => void;
    duplicatePage: (id: string, name: string, slug: string) => void;
    softDeletePage: (id: string) => void;
    restorePage: (id: string) => void;
    
    // DB Persistence
    loadFromDatabase: () => Promise<void>;
    saveToDatabase: () => Promise<void>;
    publishToDatabase: () => Promise<void>;
    rollbackToPublished: () => Promise<void>;
    
    // Approval Workflow Actions
    requestPublishApproval: (notes: string, submitterEmail: string) => Promise<void>;
    approveAndPublish: (notes: string) => Promise<void>;
    rejectPublishRequest: (feedback: string) => Promise<void>;
}

const ALLOWED_SECTIONS_BY_TYPE: Record<string, string[]> = {
    homepage: ['cinematic_hero', 'featured_collections', 'trending_slider', 'brand_story', 'instagram_feed', 'related_products'],
    collection: ['collection_grid', 'related_products', 'brand_story', 'instagram_feed'],
    product: ['product_hero', 'related_products', 'brand_story', 'instagram_feed'],
    lookbook: ['cinematic_hero', 'featured_collections', 'trending_slider', 'brand_story', 'instagram_feed', 'related_products'],
    campaign: ['cinematic_hero', 'featured_collections', 'trending_slider', 'brand_story', 'instagram_feed', 'related_products'],
    festival: ['cinematic_hero', 'featured_collections', 'trending_slider', 'brand_story', 'instagram_feed', 'related_products'],
    custom: ['cinematic_hero', 'featured_collections', 'trending_slider', 'brand_story', 'instagram_feed', 'related_products']
};

export const checkSectionAllowed = (pageType: string, sectionType: string): boolean => {
    const allowed = ALLOWED_SECTIONS_BY_TYPE[pageType];
    if (!allowed) return true;
    return allowed.includes(sectionType);
};

const DEFAULT_PAGES: PageData[] = [
    {
        id: 'homepage',
        name: 'Homepage',
        slug: 'homepage',
        type: 'homepage',
        status: 'published',
        sections: [
            { 
                type: 'cinematic_hero', 
                settings: {
                    headline: 'The Royal <br class="hidden sm:block"/> <span class="italic font-light">Trousseau.</span>',
                    subheadline: "Deepra Bridal Couture '26",
                    cta_text: 'Explore The Collection',
                    cta_link: '/collections',
                    image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200',
                    focal_point: 'center',
                    padding: 'none'
                } 
            },
            { 
                type: 'featured_collections', 
                settings: {
                    headline: 'Curated <span class="italic">Elegance</span>',
                    layout: 'bento',
                    hide_text: false,
                    text_size: 'medium'
                } 
            },
            { 
                type: 'trending_slider', 
                settings: {
                    headline: 'Trending <span class="italic">Now</span>',
                    subheadline: 'Our most coveted pieces, loved by brides and fashion enthusiasts globally.',
                    cta_text: 'View All',
                    cta_link: '/collections',
                    mode: 'trending'
                } 
            },
            { 
                type: 'brand_story', 
                settings: {
                    tagline: 'The Deepra Heritage',
                    headline: 'Crafted over months. <br/> <span class="italic font-light text-gold">Treasured for generations.</span>',
                    description: '<span class="text-4xl float-left mr-2 font-display text-fg leading-none pt-2">O</span>ur Master Weavers in Banaras spend up to 120 days hand-weaving a single bridal piece. We believe that true luxury lies in the preservation of ancient art forms, brought to life for the modern bride who honors her roots.',
                    cta_text: 'Meet The Artisans',
                    cta_link: '/brand-story',
                    image_url: 'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=800',
                    focal_point: 'center',
                    padding: 'large'
                } 
            },
            { 
                type: 'instagram_feed', 
                settings: {
                    headline: 'Join Our <span class="italic">Community</span>',
                    handle: '@Deeprastore on Instagram',
                    cta_text: 'Follow Us',
                    cta_link: 'https://instagram.com'
                } 
            }
        ]
    },
    {
        id: 'collection',
        name: 'Collection Template',
        slug: 'collection',
        type: 'collection',
        status: 'published',
        sections: [
            { 
                type: 'collection_grid', 
                settings: { 
                    columns: 3, 
                    show_filters: true,
                    padding: 'small'
                } 
            },
            { 
                type: 'related_products', 
                settings: { 
                    headline: 'Complete <span class="italic">The Look</span>',
                    padding: 'default'
                } 
            }
        ]
    },
    {
        id: 'product',
        name: 'Product Template',
        slug: 'product',
        type: 'product',
        status: 'published',
        sections: [
            { 
                type: 'product_hero', 
                settings: { 
                    layout: 'split',
                    padding: 'none'
                } 
            },
            { 
                type: 'related_products', 
                settings: { 
                    headline: 'You May Also <span class="italic">Like</span>',
                    padding: 'default'
                } 
            }
        ]
    }
];

const DEFAULT_GLOBAL_SETTINGS = {
    announcement_text: 'Complimentary shipping on orders over ₹5,000',
    announcement_link: '/collections',
    logo_url: '',
    primary_menu: [
        { label: 'Collections', link: '/collections' },
        { label: 'Fabrics', link: '/collections?category=Fabric' },
        { label: 'Stitching', link: '/custom-stitching' }
    ],
    footer_text: 'Deeprastore © 2026. Handcrafted Elegance.',
    color_bg: '#FCFBF8',
    color_fg: '#1A1A1A',
    color_accent: '#800020',
    color_gold: '#D4AF37',
    font_display: "'Playfair Display', serif",
    font_body: "'Poppins', sans-serif",
    border_radius: '8px',
    button_style: 'classic',
    whatsapp_number: '919876543210',
    whatsapp_enabled: true,
    social_instagram: 'https://instagram.com',
    social_facebook: 'https://facebook.com'
};

export const useCMSStore = create<CMSState>((set, get) => ({
    pages: DEFAULT_PAGES,
    currentPageId: 'homepage',
    globalSettings: DEFAULT_GLOBAL_SETTINGS,
    sections: DEFAULT_PAGES[0].sections,
    isLoading: false,
    error: null,

    setCurrentPageId: (id) => set((state) => {
        const page = state.pages.find(p => p.id === id);
        return { currentPageId: id, sections: page ? page.sections : [] };
    }),

    setGlobalSettings: (globalSettings) => set({ globalSettings }),

    updateGlobalSetting: (key, value) => set((state) => ({
        globalSettings: { ...state.globalSettings, [key]: value }
    })),

    setSections: (sections) => set((state) => {
        const pages = state.pages.map(p => p.id === state.currentPageId ? { ...p, sections } : p);
        return { sections, pages };
    }),

    updateSection: (idx, data) => set((state) => {
        const newSections = [...state.sections];
        newSections[idx] = { ...newSections[idx], settings: { ...newSections[idx].settings, ...data } };
        const pages = state.pages.map(p => p.id === state.currentPageId ? { ...p, sections: newSections } : p);
        return { sections: newSections, pages };
    }),

    addSection: (index, type, defaultSettings) => {
        const state = get();
        const page = state.pages.find(p => p.id === state.currentPageId);
        
        if (page) {
            if (!checkSectionAllowed(page.type, type)) {
                alert(`Section type "${type.replace('_', ' ')}" is not allowed on "${page.type}" templates to maintain strict visual governance.`);
                return;
            }
            if (type === 'collection_grid' && page.sections.some(s => s.type === 'collection_grid')) {
                alert("Collection pages can only have one Collection Grid section.");
                return;
            }
            if (type === 'product_hero' && page.sections.some(s => s.type === 'product_hero')) {
                alert("Product pages can only have one Product Hero section.");
                return;
            }
        }

        const newSections = [...state.sections];
        newSections.splice(index, 0, { type, settings: defaultSettings || {} });
        
        set((state) => {
            const pages = state.pages.map(p => p.id === state.currentPageId ? { ...p, sections: newSections } : p);
            return { sections: newSections, pages };
        });
    },

    removeSection: (idx) => set((state) => {
        const newSections = [...state.sections];
        newSections.splice(idx, 1);
        const pages = state.pages.map(p => p.id === state.currentPageId ? { ...p, sections: newSections } : p);
        return { sections: newSections, pages };
    }),

    moveSection: (idx, direction) => set((state) => {
        if (direction === 'up' && idx === 0) return state;
        if (direction === 'down' && idx === state.sections.length - 1) return state;
        
        const newSections = [...state.sections];
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        
        const temp = newSections[idx];
        newSections[idx] = newSections[targetIdx];
        newSections[targetIdx] = temp;
        
        const pages = state.pages.map(p => p.id === state.currentPageId ? { ...p, sections: newSections } : p);
        return { sections: newSections, pages };
    }),

    addPage: (page) => set((state) => {
        const newPage: PageData = {
            id: page.id,
            name: page.name,
            slug: page.slug,
            type: page.type,
            status: page.status || 'draft',
            sections: page.sections || [],
            seo_metadata: page.seo_metadata || { title: page.name, description: '' }
        };
        const newPages = [...state.pages, newPage];
        return { pages: newPages };
    }),

    updatePageMeta: (id, updates) => set((state) => {
        const newPages = state.pages.map(p => p.id === id ? { ...p, ...updates } : p);
        return { pages: newPages };
    }),

    duplicatePage: (id, name, slug) => set((state) => {
        const targetPage = state.pages.find(p => p.id === id);
        if (!targetPage) return state;

        const newId = `page_${Date.now()}`;
        // Deep copy sections
        const clonedSections = JSON.parse(JSON.stringify(targetPage.sections));
        const newPage: PageData = {
            ...targetPage,
            id: newId,
            name,
            slug,
            type: 'campaign',
            status: 'draft',
            sections: clonedSections,
            seo_metadata: {
                title: name,
                description: targetPage.seo_metadata?.description || ''
            }
        };

        return {
            pages: [...state.pages, newPage],
            currentPageId: newId,
            sections: clonedSections
        };
    }),

    softDeletePage: (id) => set((state) => {
        // Enforce that home, collection, product system templates can't be deleted
        if (id === 'homepage' || id === 'collection' || id === 'product') {
            alert("System template pages cannot be deleted.");
            return state;
        }

        const newPages = state.pages.map(p => p.id === id ? { ...p, isDeleted: true, status: 'archived' as const } : p);
        const nextActivePage = id === state.currentPageId ? 'homepage' : state.currentPageId;
        const page = newPages.find(p => p.id === nextActivePage);

        return {
            pages: newPages,
            currentPageId: nextActivePage,
            sections: page ? page.sections : []
        };
    }),

    restorePage: (id) => set((state) => {
        const newPages = state.pages.map(p => p.id === id ? { ...p, isDeleted: false, status: 'draft' as const } : p);
        return { pages: newPages };
    }),

    loadFromDatabase: async () => {
        set({ isLoading: true, error: null });
        try {
            // 1. Try to load draft (id: 2) first
            let { data, error } = await supabase
                .from('store_ui_settings')
                .select('config')
                .eq('id', 2)
                .maybeSingle();

            // 2. If no draft configuration, fallback to live (id: 1)
            if (!data || !data.config) {
                const { data: liveData } = await supabase
                    .from('store_ui_settings')
                    .select('config')
                    .eq('id', 1)
                    .maybeSingle();
                data = liveData;
            }

            if (data && data.config) {
                const config = data.config;
                set({
                    pages: config.pages || DEFAULT_PAGES,
                    globalSettings: config.globalSettings || DEFAULT_GLOBAL_SETTINGS,
                    currentPageId: config.currentPageId || 'homepage',
                    sections: (config.pages || DEFAULT_PAGES).find((p: any) => p.id === (config.currentPageId || 'homepage'))?.sections || []
                });
            } else {
                // If both are completely missing, seed default configurations
                const config = { pages: DEFAULT_PAGES, globalSettings: DEFAULT_GLOBAL_SETTINGS, currentPageId: 'homepage' };
                await supabase
                    .from('store_ui_settings')
                    .upsert([
                        { id: 1, config, updated_at: new Date().toISOString() },
                        { id: 2, config, updated_at: new Date().toISOString() }
                    ]);
                set({
                    pages: DEFAULT_PAGES,
                    globalSettings: DEFAULT_GLOBAL_SETTINGS,
                    currentPageId: 'homepage',
                    sections: DEFAULT_PAGES[0].sections
                });
            }
        } catch (err: any) {
            console.error('Error loading CMS state from DB:', err);
            set({ error: err.message });
        } finally {
            set({ isLoading: false });
        }
    },

    saveToDatabase: async () => {
        const { pages, globalSettings, currentPageId } = get();
        set({ isLoading: true, error: null });
        try {
            const config = { pages, globalSettings, currentPageId };
            await saveDraftCMSAction(config);
        } catch (err: any) {
            console.error('Error saving draft config to DB:', err);
            set({ error: err.message });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    publishToDatabase: async () => {
        set({ isLoading: true, error: null });
        try {
            const { pages, globalSettings, currentPageId } = get();
            
            // Set active page status to 'published' when deploying live
            const updatedPages = pages.map(p => 
                p.id === currentPageId ? { 
                    ...p, 
                    status: 'published' as const, 
                    approval_status: 'Approved' as const,
                    rejection_feedback: undefined
                } : p
            );
            
            // Sync local store state first
            set({ pages: updatedPages });

            const config = { pages: updatedPages, globalSettings, currentPageId };

            // Use the secure server action
            await publishCMSAction(config);

        } catch (err: any) {
            console.error('Error publishing CMS state to DB:', err);
            set({ error: err.message });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    rollbackToPublished: async () => {
        set({ isLoading: true, error: null });
        try {
            // Use the secure server action
            const res = await rollbackCMSAction();
            const config = res.config;
            
            set({
                pages: config.pages || DEFAULT_PAGES,
                globalSettings: config.globalSettings || DEFAULT_GLOBAL_SETTINGS,
                currentPageId: config.currentPageId || 'homepage',
                sections: (config.pages || DEFAULT_PAGES).find((p: any) => p.id === (config.currentPageId || 'homepage'))?.sections || []
            });
        } catch (err: any) {
            console.error('Error rolling back CMS draft to live:', err);
            set({ error: err.message });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    requestPublishApproval: async (notes: string, submitterEmail: string) => {
        set({ isLoading: true, error: null });
        try {
            const { pages, currentPageId, globalSettings } = get();
            const updatedPages = pages.map(p => 
                p.id === currentPageId ? { 
                    ...p, 
                    approval_status: 'Pending Review' as const,
                    requested_by: submitterEmail,
                    approval_notes: notes,
                    rejection_feedback: undefined
                } : p
            );
            
            set({ pages: updatedPages });
            const config = { pages: updatedPages, globalSettings, currentPageId };
            
            await requestPublishApprovalCMSAction(config, notes, submitterEmail);
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    approveAndPublish: async (notes: string) => {
        set({ isLoading: true, error: null });
        try {
            const { pages, currentPageId, globalSettings } = get();
            const updatedPages = pages.map(p => 
                p.id === currentPageId ? { 
                    ...p, 
                    status: 'published' as const,
                    approval_status: 'Approved' as const,
                    approval_notes: notes,
                    rejection_feedback: undefined
                } : p
            );

            set({ pages: updatedPages });

            const config = { pages: updatedPages, globalSettings, currentPageId };

            // Use the secure server action
            await approveAndPublishCMSAction(config, notes);

        } catch (err: any) {
            set({ error: err.message });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    rejectPublishRequest: async (feedback: string) => {
        set({ isLoading: true, error: null });
        try {
            const { pages, currentPageId, globalSettings } = get();
            const updatedPages = pages.map(p => 
                p.id === currentPageId ? { 
                    ...p, 
                    approval_status: 'Rejected' as const,
                    rejection_feedback: feedback
                } : p
            );

            set({ pages: updatedPages });
            const config = { pages: updatedPages, globalSettings, currentPageId };

            await rejectPublishRequestCMSAction(config, feedback);
        } catch (err: any) {
            set({ error: err.message });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    }
}));
