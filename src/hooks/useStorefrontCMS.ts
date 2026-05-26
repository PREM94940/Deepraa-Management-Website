"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PageData {
    id: string;
    name: string;
    slug: string;
    type: string;
    status: string;
    sections: any[];
    seo_metadata?: {
        title: string;
        description: string;
    };
    isDeleted?: boolean;
}

const DEFAULT_PAGES_FALLBACK = [
    { id: 'homepage', name: 'Homepage', slug: 'homepage', type: 'homepage', status: 'published', sections: [] },
    { id: 'collection', name: 'Collection Template', slug: 'collection', type: 'collection', status: 'published', sections: [] },
    { id: 'product', name: 'Product Template', slug: 'product', type: 'product', status: 'published', sections: [] }
];

const DEFAULT_GLOBAL_SETTINGS_FALLBACK = {
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

export const applyThemeTokens = (settings: any) => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.color_bg) root.style.setProperty('--color-bg', settings.color_bg);
    if (settings.color_fg) root.style.setProperty('--color-fg', settings.color_fg);
    if (settings.color_accent) root.style.setProperty('--color-accent', settings.color_accent);
    if (settings.color_gold) root.style.setProperty('--color-gold', settings.color_gold);
    if (settings.font_display) root.style.setProperty('--font-display', settings.font_display);
    if (settings.font_body) root.style.setProperty('--font-body', settings.font_body);
    if (settings.border_radius) root.style.setProperty('--border-radius', settings.border_radius);
    
    // Apply styling buttons, spacings, and links globally as helper variables
    if (settings.button_style === 'rounded') {
        root.style.setProperty('--button-radius', '9999px');
    } else if (settings.button_style === 'square') {
        root.style.setProperty('--button-radius', '0px');
    } else {
        root.style.setProperty('--button-radius', settings.border_radius || '8px');
    }
};

export function useStorefrontCMS(pageIdentifier: string, isSlug = false, initialConfig?: any) {
    // Determine initial page and settings for SSR/immediate hydration
    const getInitialPage = () => {
        if (!initialConfig) return null;
        const pages: PageData[] = initialConfig.pages || DEFAULT_PAGES_FALLBACK;
        return pages.find(p => isSlug ? (p.slug === pageIdentifier && !p.isDeleted) : (p.id === pageIdentifier && !p.isDeleted)) || null;
    };

    const initialPage = getInitialPage();

    const [sections, setSections] = useState<any[]>(initialPage ? (initialPage.sections || []) : []);
    const [globalSettings, setGlobalSettings] = useState<any>(initialConfig?.globalSettings || DEFAULT_GLOBAL_SETTINGS_FALLBACK);
    const [pageData, setPageData] = useState<PageData | null>(initialPage);
    const [loading, setLoading] = useState(!initialConfig);

    useEffect(() => {
        let isMounted = true;

        async function loadCMSConfig() {
            try {
                // Check if preview mode is active in query params
                const urlParams = new URLSearchParams(window.location.search);
                const isPreview = urlParams.get('preview_theme') === 'draft';

                let configData = null;
                if (isPreview) {
                    const { data: draftData } = await supabase
                        .from('store_ui_settings')
                        .select('config')
                        .eq('id', 2)
                        .maybeSingle();
                    if (draftData && draftData.config) {
                        configData = draftData.config;
                    }
                }

                if (!configData) {
                    const { data: liveData } = await supabase
                        .from('store_ui_settings')
                        .select('config')
                        .eq('id', 1)
                        .maybeSingle();
                    if (liveData && liveData.config) {
                        configData = liveData.config;
                    }
                }

                if (!isMounted) return;

                if (configData) {
                    const pages: PageData[] = configData.pages || DEFAULT_PAGES_FALLBACK;
                    const gSettings = configData.globalSettings || DEFAULT_GLOBAL_SETTINGS_FALLBACK;

                    // Match page by ID or Slug
                    const page = pages.find(p => {
                        if (isSlug) {
                            return p.slug === pageIdentifier && !p.isDeleted;
                        }
                        return p.id === pageIdentifier && !p.isDeleted;
                    });

                    console.log("useStorefrontCMS: matched page:", page?.id, "sections count:", page?.sections?.length);

                    if (page) {
                        // Campaign Visibility Governance:
                        // Block viewing custom/campaign pages if their status is 'draft' and the storefront request is not in preview mode.
                        const isSystemPage = ['homepage', 'collection', 'product'].includes(page.id);
                        if (!isSystemPage && page.status === 'draft' && !isPreview) {
                            console.warn(`CMS Page is in draft status and preview mode is not active: ${pageIdentifier}`);
                            setPageData(null);
                            setSections([]);
                        } else {
                            setPageData(page);
                            setSections(page.sections || []);
                        }
                    } else {
                        console.warn(`CMS Page not found for identifier: ${pageIdentifier}`);
                        setPageData(null);
                        setSections([]);
                    }
                    
                    setGlobalSettings(gSettings);
                    applyThemeTokens(gSettings);
                } else {
                    console.warn("No CMS config found in store_ui_settings, utilizing fallback settings.");
                }
            } catch (err) {
                console.error("Error loading storefront CMS config:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        if (initialConfig && isMounted) {
            console.log("useStorefrontCMS: hydrating from initialConfig, pageIdentifier:", pageIdentifier);
            const pages: PageData[] = initialConfig.pages || DEFAULT_PAGES_FALLBACK;
            const gSettings = initialConfig.globalSettings || DEFAULT_GLOBAL_SETTINGS_FALLBACK;
            const page = pages.find(p => isSlug ? (p.slug === pageIdentifier && !p.isDeleted) : (p.id === pageIdentifier && !p.isDeleted));
            console.log("useStorefrontCMS: matched page from initialConfig:", page?.id, "sections:", page?.sections?.length);
            if (page) {
                setPageData(page);
                setSections(page.sections || []);
            }
            setGlobalSettings(gSettings);
            applyThemeTokens(gSettings);
            setLoading(false);
        } else {
            console.log("useStorefrontCMS: no initialConfig or not mounted, calling loadCMSConfig(), pageIdentifier:", pageIdentifier);
            loadCMSConfig();
        }

        // Listen for live postMessage preview updates from the Admin Editor
        const handlePreviewMessage = (event: MessageEvent) => {
            if (event.data?.type === 'CMS_UPDATE') {
                const { payload } = event.data;
                if (payload) {
                    const targetPages: PageData[] = payload.pages || [];
                    const activePageId = payload.currentPageId || pageIdentifier;
                    const gSettings = payload.globalSettings || {};

                    // Find corresponding sections and page metadata
                    const page = targetPages.find(p => {
                        if (isSlug) {
                            return p.slug === pageIdentifier;
                        }
                        return p.id === activePageId;
                    });

                    if (page) {
                        setPageData(page);
                        setSections(page.sections || []);
                    } else if (payload.sections) {
                        setSections(payload.sections);
                    }

                    setGlobalSettings(gSettings);
                    applyThemeTokens(gSettings);
                }
            } else if (event.data?.type === 'CMS_SCROLL_TO') {
                const element = document.getElementById(`section-${event.data.payload}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        };

        window.addEventListener('message', handlePreviewMessage);

        return () => {
            isMounted = false;
            window.removeEventListener('message', handlePreviewMessage);
        };
    }, [pageIdentifier, isSlug]);

    return { sections, globalSettings, pageData, loading };
}
