"use client";
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { SECTION_REGISTRY } from '@/registry/sections';
import { useStorefrontCMS } from '@/hooks/useStorefrontCMS';

export const StorefrontRenderer = ({ initialConfig, pageIdentifier, isSlug }: { initialConfig: any, pageIdentifier: string, isSlug: boolean }) => {
    const { sections, globalSettings, pageData, loading } = useStorefrontCMS(pageIdentifier, isSlug, initialConfig);

    if (loading) {
        return (
            <main className="min-h-screen bg-surface flex items-center justify-center">
                <div className="animate-pulse text-xl font-bold italic font-display text-muted">Preparing your luxury experience...</div>
            </main>
        );
    }

    if (!pageData && isSlug) {
        return (
            <main className="min-h-screen bg-surface flex flex-col justify-between">
                <Navbar globalSettings={globalSettings} />
                <div className="py-32 text-center max-w-xl mx-auto px-6">
                    <h1 className="text-4xl font-display font-bold text-fg mb-4">Collection Not Found</h1>
                    <p className="text-muted mb-8 leading-relaxed">The lookbook or campaign page you are looking for has either been archived or does not exist.</p>
                    <a href="/" className="px-8 py-3 bg-black text-white hover:bg-gold transition-colors text-xs font-bold uppercase tracking-widest">
                        Return to Homepage
                    </a>
                </div>
                <Footer globalSettings={globalSettings} />
            </main>
        );
    }

    return (
        <main className="relative bg-surface min-h-screen w-full">
            <Navbar globalSettings={globalSettings} />
            
            <div className="flex flex-col">
                {sections && sections.length > 0 ? (
                    sections.map((section, idx) => {
                        const ComponentMap = SECTION_REGISTRY[section.type];
                        if (!ComponentMap) {
                            console.warn(`Unknown section type: ${section.type}`);
                            return null;
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
                    })
                ) : (
                    <div className="py-32 text-center text-muted max-w-md mx-auto">
                        <h2 className="text-xl font-bold uppercase tracking-wider mb-2">Empty Layout</h2>
                        <p className="text-sm">No sections have been added to this campaign template yet. Customize it in the Admin CMS.</p>
                    </div>
                )}
            </div>

            <Footer globalSettings={globalSettings} />
            <CartDrawer />
        </main>
    );
};
