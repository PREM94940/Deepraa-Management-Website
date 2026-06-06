import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ProductClient from './ProductClient';

// Use standard fetch/Supabase client since metadata doesn't require session auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

    if (!product) {
        return {
            title: 'Product Not Found | Deeprastore',
            description: 'The requested product could not be found.',
        };
    }

    const stripHtml = (html: string) => {
        if (!html) return '';
        // Remove HTML tags
        let text = html.replace(/<[^>]*>?/gm, ' ');
        // Decode common entities or mojibake
        text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/â€“/g, '-');
        return text.replace(/\s\s+/g, ' ').trim();
    };

    const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
    const cleanTitle = stripHtml(product.title);
    const rawDesc = product.description ? stripHtml(product.description) : `Buy ${cleanTitle} at Deeprastore. Luxury handcrafted ethnic wear.`;
    const desc = rawDesc.substring(0, 160);

    return {
        title: `${cleanTitle} | Deeprastore`,
        description: desc,
        openGraph: {
            title: `${cleanTitle} | Deeprastore`,
            description: desc,
            images: imageUrl ? [{ url: imageUrl, alt: cleanTitle }] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${cleanTitle} | Deeprastore`,
            description: desc,
            images: imageUrl ? [imageUrl] : [],
        },
    };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return <ProductClient id={resolvedParams.id} />;
}
