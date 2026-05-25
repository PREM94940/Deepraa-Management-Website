// src/themes/editorial_boutique/components/SocialProofCarousel.tsx
import React from 'react';
import Image from 'next/image';

type Props = {
  images: string[]; // array of curated UGC image URLs
  autoplay?: boolean;
};

export const SocialProofCarousel: React.FC<Props> = ({ images, autoplay = false }) => {
  // Simple manual carousel – can be enhanced later.
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!autoplay) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoplay, images.length]);

  if (images.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative overflow-hidden">
          <div
            className="grid grid-cols-3 md:grid-cols-6 gap-[2px]"
            style={{ transform: `translateX(-${current * 100}% )` }}
          >
            {images.map((src, i) => (
              <div key={i} className="relative aspect-[4/5] group">
                <Image
                  src={src}
                  alt={`UGC ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
