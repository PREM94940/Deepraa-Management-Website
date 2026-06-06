// src/themes/editorial_boutique/components/CuratedCollection.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';

type Props = {
  collectionKey: string; // e.g., "bridal_picks"
  title?: string;
  ctaLink?: string;
  maxItems?: number;
};

export const CuratedCollection: React.FC<Props> = ({
  collectionKey,
  title,
  ctaLink,
  maxItems = 6,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      // Map legacy collectionKeys to actual slugs
      const KEY_TO_SLUG: Record<string, string> = {
        'bridal_picks': 'bridal-collection',
        'trending_whatsapp': 'best-sellers',
        'festival_edit': 'festival-collection',
        'ready_dispatch': 'ready-to-ship-collection',
        'new_arrivals': 'new-arrivals',
        'premium_handpicked': 'premium-collection'
      };
      const slug = KEY_TO_SLUG[collectionKey] || collectionKey;

      // 1. Get collection ID by slug
      const { data: coll, error: collErr } = await supabase
        .from('collections')
        .select('id')
        .eq('slug', slug)
        .single();
        
      if (coll && coll.id) {
        // 2. Get product_ids from collection_products join table
        const { data: mappings } = await supabase
          .from('collection_products')
          .select('product_id')
          .eq('collection_id', coll.id)
          .order('position', { ascending: true })
          .limit(maxItems);

        if (mappings && mappings.length > 0) {
          const ids = mappings.map(m => m.product_id);
          // 3. Fetch products
          const { data: prods } = await supabase
            .from('products')
            .select('*')
            .in('id', ids);
            
          if (prods) {
            // Preserve the ordered sorting from the join table
            const orderedProds = ids.map(id => prods.find(p => p.id === id)).filter(Boolean);
            setProducts(orderedProds);
          }
        }
      } else if (collErr) {
        console.error('Failed to find collection slug:', slug, collErr.message);
      }
      setLoading(false);
    }
    fetch();
  }, [collectionKey, maxItems]);

  if (loading) {
    return <div className="text-center py-8 text-sm opacity-50">Loading curated pieces...</div>;
  }

  return (
    <section className="py-8 md:py-12 max-w-7xl mx-auto px-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl md:text-4xl font-display text-fg">{title}</h2>
        {ctaLink && (
          <a href={ctaLink} className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gold hover:border-gold transition">
            View All
          </a>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
};
