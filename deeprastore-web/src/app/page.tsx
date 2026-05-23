"use client";
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { SECTION_REGISTRY } from '@/registry/sections';
import { useStorefrontCMS } from '@/hooks/useStorefrontCMS';

const DEFAULT_SECTIONS = [
    { type: 'cinematic_hero', settings: {} },
    { type: 'featured_collections', settings: {} },
    { type: 'trending_slider', settings: {} },
    { type: 'brand_story', settings: {} },
    { type: 'instagram_feed', settings: {} }
];

export default function Home() {
    const { sections, globalSettings, loading } = useStorefrontCMS('homepage');

    if (loading) {
        return (
            <main className="min-h-screen bg-surface flex items-center justify-center">
                <div className="animate-pulse text-xl font-bold italic font-display text-muted">Preparing your luxury experience...</div>
            </main>
        );
    }

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
