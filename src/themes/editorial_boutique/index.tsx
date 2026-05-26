// src/themes/editorial_boutique/index.tsx
"use client";
import React from 'react';
import { CinematicHero } from '@/themes/editorial_boutique/components/CinematicHero';
import { CategoryStoryGrid } from '@/themes/editorial_boutique/components/CategoryStoryGrid';
import { CuratedCollection } from '@/themes/editorial_boutique/components/CuratedCollection';
import { SocialProofCarousel } from '@/themes/editorial_boutique/components/SocialProofCarousel';

// Mock data – in production this would come from the CMS section JSON
const heroData = {
  variant: 'bridal' as const,
  headline: 'Experience the Elegance of Bridal Couture',
  subheadline: "Deepra's Signature Collection",
  primaryCta: { text: 'Shop Bridal', link: '/collections?category=Bridal' },
  secondaryCta: { text: 'Custom Orders', link: '/custom-stitching' },
};

const storyGridItems = [
  {
    image: 'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=800',
    title: 'Half Sarees',
    link: '/collections?category=Half%20Sarees',
  },
  {
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
    title: 'Bridal Collections',
    link: '/collections?category=Bridal',
  },
  {
    image: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=800',
    title: 'Ready-to-Dispatch',
    link: '/collections?category=Ready%20Dispatch',
  },
  {
    image: 'https://images.unsplash.com/photo-1617175548912-f8702132e1b?auto=format&fit=crop&q=80&w=800',
    title: 'Celebrity Inspired',
    link: '/collections?category=Celebrity%20Inspired',
  },
];

export default function EditorialBoutiqueTheme() {
  return (
    <>
      {/* Hero */}
      <CinematicHero variant={heroData.variant} headline={heroData.headline} subheadline={heroData.subheadline} primaryCta={heroData.primaryCta} secondaryCta={heroData.secondaryCta} />

      {/* Category Story Grid – Bento layout */}
      <CategoryStoryGrid layout="bento" items={storyGridItems} />

      {/* Curated Collections */}
      <CuratedCollection collectionKey="bridal_picks" title="Bridal Picks" ctaLink="/collections?category=Bridal" />
      <CuratedCollection collectionKey="trending_whatsapp" title="Trending on WhatsApp" ctaLink="/collections?category=Trending" />
      <CuratedCollection collectionKey="festival_edit" title="Festival Edit" ctaLink="/collections?category=Festival" />
      <CuratedCollection collectionKey="ready_dispatch" title="Ready Dispatch" ctaLink="/collections?category=Ready%20Dispatch" />
      <CuratedCollection collectionKey="new_arrivals" title="New Arrivals" ctaLink="/collections?category=New" />
      <CuratedCollection collectionKey="premium_handpicked" title="Premium Handpicked" ctaLink="/collections?category=Premium" />

      {/* Social Proof */}
      <SocialProofCarousel images={[
        'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1617175548912-f8702132e1b?auto=format&fit=crop&q=80&w=400',
      ]} />
    </>
  );
}
