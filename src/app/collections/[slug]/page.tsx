import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import CollectionClient from './CollectionClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const { data: collection } = await supabase
        .from('collections')
        .select('seo_title, seo_description, name')
        .eq('slug', slug)
        .maybeSingle();

    if (!collection) {
        return {
            title: 'Collection Not Found | Deeprastore',
            description: 'The requested collection could not be found.',
        };
    }

    return {
        title: collection.seo_title || `${collection.name} | Deeprastore`,
        description: collection.seo_description || `Explore the luxurious ${collection.name} collection at Deeprastore.`,
        alternates: {
            canonical: `/collections/${slug}`,
        },
    };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
    return <CollectionClient params={params} />;
}
