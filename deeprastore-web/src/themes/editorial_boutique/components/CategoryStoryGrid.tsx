// src/themes/editorial_boutique/components/CategoryStoryGrid.tsx
import React from 'react';
import Image from 'next/image';

type GridItem = {
  image: string;
  title: string;
  link: string;
  focal_point?: string;
};

type Props = {
  layout?: 'bento' | 'bento-reverse' | 'grid-2x2';
  items: GridItem[];
};

export const CategoryStoryGrid: React.FC<Props> = ({ layout = 'bento', items }) => {
  // Compute CSS grid classes based on layout
  const containerClass =
    layout === 'grid-2x2'
      ? 'grid grid-cols-2 gap-4'
      : 'grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4';

  const spanForIndex = (idx: number) => {
    if (layout === 'bento') {
      if (idx === 0) return 'col-span-2 row-span-2';
      if (idx === 3) return 'col-span-2 row-span-1';
    }
    if (layout === 'bento-reverse') {
      if (idx === 1) return 'col-span-2 row-span-2';
      if (idx === 0) return 'col-span-2 row-span-1';
    }
    return 'col-span-1 row-span-1';
  };

  return (
    <section className="py-8 md:py-12 px-6 max-w-7xl mx-auto">
      <div className={containerClass}>
        {items.map((item, idx) => (
          <a
            href={item.link}
            key={idx}
            className={`relative overflow-hidden rounded-sm ${spanForIndex(idx)}`}
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ objectPosition: item.focal_point ?? 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-xl font-light mb-2">{item.title}</h3>
              <span className="text-gold text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity">Explore →</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};
