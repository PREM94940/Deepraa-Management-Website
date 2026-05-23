import React from 'react';
import { StorefrontRenderer } from '@/components/StorefrontRenderer';

// Force edge/server cache invalidation via ISR tags
export const revalidate = 3600;

export default async function CustomCampaignPage({ params }: { params: { slug: string } }) {
    const { slug } = params;

    // Fetch directly from Supabase REST API with Next.js fetch for cache tags
    let configData = null;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/store_ui_settings?id=eq.1&select=config`, {
            headers: {
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
            },
            next: { tags: ['cms-publish'] }
        });
        const data = await res.json();
        configData = data?.[0]?.config || null;
    } catch (e) {
        console.error('Failed to fetch CMS data on server', e);
    }

    return (
        <StorefrontRenderer initialConfig={configData} pageIdentifier={slug} isSlug={true} />
    );
}
