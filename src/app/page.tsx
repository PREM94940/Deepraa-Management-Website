import React from 'react';
import { StorefrontRenderer } from '@/components/StorefrontRenderer';

// Force edge/server cache invalidation via ISR tags (Trigger: force rebuild to pick up synced live config)
export const revalidate = 0; // Temp set to 0 to bypass ISR cache and load dynamically during debugging

export default async function Home() {
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
        <StorefrontRenderer initialConfig={configData} pageIdentifier="homepage" isSlug={false} />
    );
}
