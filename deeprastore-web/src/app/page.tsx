"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { SECTION_REGISTRY } from '@/registry/sections';

const DEFAULT_SECTIONS = [
    { type: 'cinematic_hero', settings: {} },
    { type: 'featured_collections', settings: {} },
    { type: 'trending_slider', settings: {} },
    { type: 'brand_story', settings: {} },
    { type: 'instagram_feed', settings: {} }
];

export default function Home() {
    const [sections, setSections] = useState<any[]>(DEFAULT_SECTIONS);
    const [globalSettings, setGlobalSettings] = useState<any>({});

    useEffect(() => {
        async function fetchTheme() {
            try {
                // Check for ?preview_theme=slug in URL
                const urlParams = new URLSearchParams(window.location.search);
                const previewSlug = urlParams.get('preview_theme');

                let query = supabase.from('storefront_themes').select('*');
                if (previewSlug) {
                    query = query.eq('slug', previewSlug).eq('status', 'draft');
                } else {
                    query = query.eq('status', 'published');
                }

                const { data, error } = await query.single();
                
                if (data) {
                    if (data.sections && data.sections.length > 0) {
                        setSections(data.sections);
                    }
                    if (data.global_settings) {
                        setGlobalSettings(data.global_settings);
                    }
                }
            } catch (err) {
                console.warn('CMS Schema not found or error fetching theme. Falling back to default architecture.', err);
            }
        }
        fetchTheme();

        // Listen for live preview updates from Admin Editor
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'CMS_UPDATE') {
                if (event.data.payload.sections) {
                    setSections(event.data.payload.sections);
                    setGlobalSettings(event.data.payload.globalSettings || {});
                } else {
                    // Backwards compatibility if payload is just sections array
                    setSections(event.data.payload);
                }
            } else if (event.data?.type === 'CMS_SCROLL_TO') {
                const element = document.getElementById(`section-${event.data.payload}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        };
        window.addEventListener('message', handleMessage);
        
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <main className="w-full">
            <Navbar globalSettings={globalSettings} />
            
            <div className="flex flex-col">
                {sections.map((section, idx) => {
                    const ComponentMap = SECTION_REGISTRY[section.type];
                    if (!ComponentMap) {
                        console.warn(`Unknown section type: ${section.type}`);
                        return null; // Graceful fallback
                    }
                    
                    const Component = ComponentMap.component;
                    
                    // Visibility Controls
                    let visibilityClass = '';
                    if (section.settings?.visibility === 'desktop_only') visibilityClass = 'hidden md:block';
                    if (section.settings?.visibility === 'mobile_only') visibilityClass = 'block md:hidden';

                    // Spacing Controls
                    let spacingClass = '';
                    if (section.settings?.padding === 'none') spacingClass = '!py-0';
                    else if (section.settings?.padding === 'small') spacingClass = '!py-8 md:!py-12';
                    else if (section.settings?.padding === 'large') spacingClass = '!py-32 md:!py-48';

                    return (
                        <div key={idx} id={`section-${section.type}`} className={`${visibilityClass} ${spacingClass}`}>
                            <Component data={section.settings} variant={section.variant} />
                        </div>
                    );
                })}
            </div>
            
            <Footer globalSettings={globalSettings} />
            <CartDrawer />
        </main>
    );
}
