// src/themes/editorial_boutique/components/CinematicHero.tsx
import React from 'react';
import Image from 'next/image';

export type CinematicHeroProps = {
  variant: 'bridal' | 'whatsapp' | 'festival' | 'video';
  mediaUrl?: string;
  headline?: string;
  subheadline?: string;
  primaryCta?: { text: string; link: string };
  secondaryCta?: { text: string; link: string };
};

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  variant,
  mediaUrl,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
}) => {
  // Choose default media per variant if not provided
  const defaultMedia = {
    bridal:
      'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=1200',
    whatsapp:
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200',
    festival:
      'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=1200',
    video: undefined,
  };
  const url = mediaUrl ?? defaultMedia[variant];
  const isVideo = variant === 'video' && !!url;

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-zinc-900">
      <div className="absolute inset-0">
        {isVideo ? (
          <video
            src={url}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-90 transition-opacity duration-1000"
          />
        ) : (
          <Image src={url!} alt={headline ?? 'Hero'} fill priority className="object-cover opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
      </div>
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6 pt-20">
        {subheadline && <p className="text-gold font-semibold uppercase text-xs mb-4">{subheadline}</p>}
        {headline && (
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-10"
            dangerouslySetInnerHTML={{ __html: headline }}
          />
        )}
        <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-4 mb-12">
          {primaryCta && (
            <a
              href={primaryCta.link}
              className="bg-white text-black px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-transparent hover:text-white transition"
            >
              {primaryCta.text}
            </a>
          )}
          {secondaryCta && (
            <a
              href={secondaryCta.link}
              className="bg-transparent border border-white text-white px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition"
            >
              {secondaryCta.text}
            </a>
          )}
        </div>
      </div>
    </section>
  );
};
