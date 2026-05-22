import { create } from 'zustand';

interface CMSState {
    themeId: string | null;
    name: string;
    slug: string;
    status: 'draft' | 'published' | 'scheduled' | 'archived' | 'sandbox';
    tokens: Record<string, any>;
    globalSettings: Record<string, any>;
    sections: any[];
    setSections: (sections: any[]) => void;
    setGlobalSettings: (settings: any) => void;
    updateGlobalSetting: (key: string, value: any) => void;
    updateSection: (idx: number, data: any) => void;
    addSection: (index: number, type: string, defaultSettings?: any) => void;
    removeSection: (idx: number) => void;
    moveSection: (idx: number, direction: 'up' | 'down') => void;
    setThemeData: (data: Partial<CMSState>) => void;
}

export const useCMSStore = create<CMSState>((set) => ({
    themeId: null,
    name: 'New Draft',
    slug: 'draft',
    status: 'draft',
    tokens: {},
    globalSettings: {
        announcement_text: 'Complimentary shipping on orders over ₹5,000',
        announcement_link: '/collections',
        logo_url: '',
        primary_menu: [
            { label: 'Collections', link: '/collections' },
            { label: 'Fabrics', link: '/fabrics' },
            { label: 'Stitching', link: '/custom-stitching' }
        ],
        footer_text: 'Deeprastore © 2026. Handcrafted Elegance.'
    },
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
    ],
    setSections: (sections) => set({ sections }),
    setGlobalSettings: (globalSettings) => set({ globalSettings }),
    updateGlobalSetting: (key, value) => set((state) => ({
        globalSettings: { ...state.globalSettings, [key]: value }
    })),
    updateSection: (idx, data) => set((state) => {
        const newSections = [...state.sections];
        newSections[idx] = { ...newSections[idx], settings: { ...newSections[idx].settings, ...data } };
        return { sections: newSections };
    }),
    addSection: (index, type, defaultSettings) => set((state) => {
        const newSections = [...state.sections];
        newSections.splice(index, 0, { type, settings: defaultSettings || {} });
        return { sections: newSections };
    }),
    removeSection: (idx) => set((state) => {
        const newSections = [...state.sections];
        newSections.splice(idx, 1);
        return { sections: newSections };
    }),
    moveSection: (idx, direction) => set((state) => {
        if (direction === 'up' && idx === 0) return state;
        if (direction === 'down' && idx === state.sections.length - 1) return state;
        
        const newSections = [...state.sections];
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        
        const temp = newSections[idx];
        newSections[idx] = newSections[targetIdx];
        newSections[targetIdx] = temp;
        
        return { sections: newSections };
    }),
    setThemeData: (data) => set(data),
}));
