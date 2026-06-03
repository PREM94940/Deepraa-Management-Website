import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ProductClient from './ProductClient';

// Use standard fetch/Supabase client since metadata doesn't require session auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!product) {
        return {
            title: 'Product Not Found | Deeprastore',
            description: 'The requested product could not be found.',
        };
    }

    const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '';
    const desc = product.description ? product.description.substring(0, 160) : `Buy ${product.title} at Deeprastore. Luxury handcrafted ethnic wear.`;

    return {
        title: `${product.title} | Deeprastore`,
        description: desc,
        openGraph: {
            title: `${product.title} | Deeprastore`,
            description: desc,
            images: imageUrl ? [{ url: imageUrl, alt: product.title }] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${product.title} | Deeprastore`,
            description: desc,
            images: imageUrl ? [imageUrl] : [],
        },
    };
}

export default function Page({ params }: { params: { id: string } }) {
    return <ProductClient id={params.id} />;
}
