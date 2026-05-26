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
      // Assume a "collections" table mapping collectionKey to product IDs
      const { data: coll } = await supabase
        .from('collections')
        .select('product_ids')
        .eq('key', collectionKey)
        .single();
      if (coll && coll.product_ids?.length) {
        const ids = coll.product_ids.slice(0, maxItems);
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .in('id', ids);
        if (prods) setProducts(prods);
      }
      setLoading(false);
    }
    fetch();
  }, [collectionKey, maxItems]);

  if (loading) {
    return <p className="text-center py-8">Loading collection...</p>;
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
