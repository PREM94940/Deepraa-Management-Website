'use client';

/**
 * DynamicSectionRenderer.tsx
 * Deeprastore — CMS Dynamic Section Renderer
 *
 * Maps CMS page_sections rows to rendered JSX components.
 * All section types are styled with the Deeprastore luxury dark design system:
 *   Background: #0A0A0A
 *   Gold accent: #D4AF37
 *   Typography: wide tracking, uppercase labels, premium hierarchy
 *
 * Supported section types:
 *   'hero_banner'      — Full-width hero with headline, subheadline, CTA
 *   'brand_story'      — 2-col editorial brand story block
 *   'bento_grid'       — Responsive feature bento grid
 *   'support_cta'      — WhatsApp support CTA band
 *   'announcement_bar' — Top announcement banner strip
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, ArrowRight, Sparkles, Shield, Scissors, Star, Truck, Award } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// PageSection interface — mirrors public.page_sections table
// ─────────────────────────────────────────────────────────────

export interface PageSection {
  id: string;
  page_identifier: string;
  type: string;
  variant: string;
  settings: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
}

// ─────────────────────────────────────────────────────────────
// Section-specific settings interfaces
// ─────────────────────────────────────────────────────────────

interface HeroBannerSettings {
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  cta_link?: string;
  background_image?: string;
  overlay_opacity?: number;
  pill_label?: string;
}

interface BrandStorySettings {
  tagline?: string;
  headline?: string;
  description?: string;
  image?: string;
  image_alt?: string;
  cta_text?: string;
  cta_link?: string;
}

interface BentoTile {
  icon?: string;
  headline: string;
  description: string;
  span?: 'single' | 'double' | 'tall';
  accent?: boolean;
}

interface BentoGridSettings {
  headline?: string;
  subheadline?: string;
  tiles?: BentoTile[];
}

interface SupportCtaSettings {
  headline?: string;
  subheadline?: string;
  whatsapp_number?: string;
  cta_text?: string;
  intent_message?: string;
}

interface AnnouncementBarSettings {
  text?: string;
  active?: boolean;
  cta_text?: string;
  cta_link?: string;
}

// ─────────────────────────────────────────────────────────────
// Icon resolver for bento tiles
// ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  shield: Shield,
  scissors: Scissors,
  star: Star,
  truck: Truck,
  award: Award,
  message: MessageCircle,
};

function BentoIcon({ name, className }: { name?: string; className?: string }): React.ReactElement {
  if (!name) return <Sparkles className={className} />;
  const IconComponent = ICON_MAP[name.toLowerCase()] ?? Sparkles;
  return <IconComponent className={className} />;
}

// ─────────────────────────────────────────────────────────────
// Section: HeroBanner
// Full-width cinematic hero — dark overlay, gold headline, dual CTA
// ─────────────────────────────────────────────────────────────

function HeroBanner({ settings, variant }: { settings: HeroBannerSettings; variant: string }): React.ReactElement {
  const {
    headline = 'Artisan Indian Couture',
    subheadline = 'Each garment is a collaboration between heritage craft and your personal vision.',
    cta_text = 'Explore Collections',
    cta_link = '/collections',
    background_image,
    overlay_opacity = 0.6,
    pill_label = 'Now Accepting Custom Orders',
  } = settings;

  const isMinimal = variant === 'minimal';

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: isMinimal ? '60vh' : '100vh',
        backgroundColor: '#0A0A0A',
      }}
    >
      {/* Background image layer */}
      {background_image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={background_image}
            alt="Deeprastore hero"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(10,10,10,${overlay_opacity})` }}
          />
        </div>
      )}

      {/* No image — gradient texture */}
      {!background_image && (
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%), #0A0A0A',
          }}
        />
      )}

      {/* Decorative horizontal rule — gold */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #D4AF37 40%, #D4AF37 60%, transparent)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center"
        style={{ minHeight: isMinimal ? '60vh' : '100vh' }}
      >
        {/* Pill */}
        {pill_label && (
          <div
            className="inline-flex items-center gap-2 mb-8"
            style={{
              border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: '9999px',
              padding: '6px 18px',
            }}
          >
            <span
              className="text-xs font-medium"
              style={{ color: '#D4AF37', letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              {pill_label}
            </span>
          </div>
        )}

        {/* Headline */}
        <h1
          className="font-light"
          style={{
            color: '#FAFAFA',
            fontSize: 'clamp(2.5rem, 6vw, 6rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.01em',
            maxWidth: '900px',
          }}
        >
          {headline.split('\\n').map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>

        {/* Gold rule divider */}
        <div
          className="my-8"
          style={{ width: '48px', height: '1px', backgroundColor: '#D4AF37', opacity: 0.7 }}
        />

        {/* Subheadline */}
        <p
          className="font-light"
          style={{
            color: 'rgba(250,250,250,0.65)',
            fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
            lineHeight: 1.7,
            maxWidth: '600px',
            letterSpacing: '0.01em',
          }}
        >
          {subheadline}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-12">
          <Link
            href={cta_link}
            className="inline-flex items-center gap-3 transition-opacity hover:opacity-80"
            style={{
              backgroundColor: '#D4AF37',
              color: '#0A0A0A',
              padding: '14px 32px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            {cta_text}
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/custom-stitching"
            className="inline-flex items-center gap-3 transition-opacity hover:opacity-80"
            style={{
              border: '1px solid rgba(250,250,250,0.3)',
              color: 'rgba(250,250,250,0.8)',
              padding: '14px 32px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              fontWeight: 400,
            }}
          >
            Custom Stitching
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: BrandStory
// 2-column editorial block — copy left, image right
// ─────────────────────────────────────────────────────────────

function BrandStory({ settings, variant }: { settings: BrandStorySettings; variant: string }): React.ReactElement {
  const {
    tagline = 'Our Heritage',
    headline = 'Craftsmanship Born\nfrom Indian Tradition',
    description = 'Deeprastore was founded on a singular belief: that every person deserves a garment made precisely for them. We partner with master artisans across Rajasthan, Banaras, and Lucknow — weavers whose families have practised their craft for generations. Each piece carries that lineage.',
    image,
    image_alt = 'Deeprastore artisan craftsmanship',
    cta_text = 'Our Story',
    cta_link = '/about',
  } = settings;

  const reversed = variant === 'image-left';

  return (
    <section
      style={{ backgroundColor: '#0A0A0A', borderTop: '1px solid rgba(212,175,55,0.12)' }}
    >
      <div
        className={`max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-36 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center ${reversed ? 'lg:[direction:rtl]' : ''}`}
      >
        {/* Copy */}
        <div style={reversed ? { direction: 'ltr' } : {}}>
          <p
            className="mb-6"
            style={{
              color: '#D4AF37',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            {tagline}
          </p>

          <h2
            className="font-light mb-8"
            style={{
              color: '#FAFAFA',
              fontSize: 'clamp(2rem, 3.5vw, 3.25rem)',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {headline.split('\\n').map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>

          <div
            style={{ width: '40px', height: '1px', backgroundColor: '#D4AF37', marginBottom: '2rem', opacity: 0.6 }}
          />

          <p
            style={{
              color: 'rgba(250,250,250,0.6)',
              fontSize: '1.05rem',
              lineHeight: 1.8,
              letterSpacing: '0.005em',
            }}
          >
            {description}
          </p>

          <Link
            href={cta_link}
            className="inline-flex items-center gap-3 mt-10 transition-opacity hover:opacity-70"
            style={{
              color: '#D4AF37',
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 500,
              borderBottom: '1px solid rgba(212,175,55,0.4)',
              paddingBottom: '4px',
            }}
          >
            {cta_text}
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* Image */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: '4/5',
            direction: 'ltr',
            border: '1px solid rgba(212,175,55,0.08)',
          }}
        >
          {image ? (
            <Image
              src={image}
              alt={image_alt}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            // Placeholder when no image is set
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-4"
              style={{ backgroundColor: 'rgba(212,175,55,0.04)' }}
            >
              <Scissors size={40} style={{ color: 'rgba(212,175,55,0.3)' }} />
              <p
                style={{
                  color: 'rgba(250,250,250,0.2)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                }}
              >
                Heritage Craft
              </p>
            </div>
          )}

          {/* Decorative corner accent */}
          <div
            className="absolute top-0 left-0"
            style={{
              width: '40px',
              height: '1px',
              backgroundColor: '#D4AF37',
              opacity: 0.5,
            }}
          />
          <div
            className="absolute top-0 left-0"
            style={{
              width: '1px',
              height: '40px',
              backgroundColor: '#D4AF37',
              opacity: 0.5,
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: BentoGrid
// Responsive bento grid of feature tiles with lucide icons
// ─────────────────────────────────────────────────────────────

const DEFAULT_BENTO_TILES: BentoTile[] = [
  {
    icon: 'scissors',
    headline: 'Bespoke Tailoring',
    description: 'Every garment cut and stitched to your exact measurements by a dedicated Master Tailor.',
    accent: true,
  },
  {
    icon: 'sparkles',
    headline: 'Heritage Fabrics',
    description: 'Sourced directly from generational weavers in Banaras, Lucknow, and Rajasthan.',
  },
  {
    icon: 'shield',
    headline: '60-Day Alteration Guarantee',
    description: 'Any fit issue resolved at no cost within 60 days of delivery. No questions asked.',
  },
  {
    icon: 'truck',
    headline: 'Live Order Tracking',
    description: 'Follow your garment from fabric sourcing through stitching to your doorstep.',
  },
  {
    icon: 'star',
    headline: 'Curated Ready-to-Wear',
    description: 'Premium ready-made collection for those who want boutique quality without the wait.',
  },
  {
    icon: 'award',
    headline: 'Quality Certified',
    description: 'Every piece passes a 12-point quality check before dispatch.',
    accent: false,
  },
];

function BentoGrid({ settings }: { settings: BentoGridSettings }): React.ReactElement {
  const {
    headline = 'Why Deeprastore',
    subheadline = 'A boutique built around the belief that every detail matters.',
    tiles = DEFAULT_BENTO_TILES,
  } = settings;

  return (
    <section
      style={{
        backgroundColor: '#0A0A0A',
        borderTop: '1px solid rgba(212,175,55,0.12)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-36">
        {/* Section header */}
        <div className="text-center mb-20">
          <p
            className="mb-4"
            style={{
              color: '#D4AF37',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Our Promise
          </p>
          <h2
            className="font-light"
            style={{
              color: '#FAFAFA',
              fontSize: 'clamp(2rem, 3vw, 3rem)',
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
            }}
          >
            {headline}
          </h2>
          {subheadline && (
            <p
              className="mt-6 mx-auto"
              style={{
                color: 'rgba(250,250,250,0.5)',
                fontSize: '1rem',
                lineHeight: 1.7,
                maxWidth: '500px',
              }}
            >
              {subheadline}
            </p>
          )}
        </div>

        {/* Bento grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ border: '1px solid rgba(212,175,55,0.1)', backgroundColor: 'rgba(212,175,55,0.1)' }}
        >
          {tiles.map((tile, index) => (
            <div
              key={index}
              className="relative flex flex-col gap-5 p-8 lg:p-10 transition-colors group"
              style={{
                backgroundColor: tile.accent ? 'rgba(212,175,55,0.06)' : '#0A0A0A',
              }}
            >
              {/* Gold top border on accent tiles */}
              {tile.accent && (
                <div
                  className="absolute top-0 left-0 right-0"
                  style={{ height: '2px', background: 'linear-gradient(90deg, #D4AF37, rgba(212,175,55,0.2))' }}
                />
              )}

              {/* Icon */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: '44px',
                  height: '44px',
                  border: '1px solid rgba(212,175,55,0.25)',
                  backgroundColor: 'rgba(212,175,55,0.05)',
                }}
              >
                <BentoIcon
                  name={tile.icon}
                  className="w-5 h-5"
                  // @ts-expect-error — custom style on icon component
                  style={{ color: '#D4AF37' }}
                />
              </div>

              {/* Headline */}
              <h3
                style={{
                  color: '#FAFAFA',
                  fontSize: '1.05rem',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                  lineHeight: 1.3,
                }}
              >
                {tile.headline}
              </h3>

              {/* Description */}
              <p
                style={{
                  color: 'rgba(250,250,250,0.5)',
                  fontSize: '0.9rem',
                  lineHeight: 1.75,
                }}
              >
                {tile.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: SupportCta
// Full-width WhatsApp concierge CTA band
// ─────────────────────────────────────────────────────────────

function SupportCta({ settings }: { settings: SupportCtaSettings }): React.ReactElement {
  const {
    headline = 'Need Help With Your Order?',
    subheadline = 'Our boutique concierge team is available Monday to Saturday, 10am–7pm IST.',
    whatsapp_number = '+919999999999',
    cta_text = 'Message Us on WhatsApp',
    intent_message = 'Hi! I need help with my Deeprastore order.',
  } = settings;

  const waNumber = whatsapp_number.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(intent_message);
  const waLink = `https://wa.me/${waNumber}?text=${encodedMessage}`;

  return (
    <section
      style={{
        backgroundColor: '#0A0A0A',
        borderTop: '1px solid rgba(212,175,55,0.12)',
        borderBottom: '1px solid rgba(212,175,55,0.12)',
      }}
    >
      <div
        className="max-w-7xl mx-auto px-6 lg:px-12 py-20 flex flex-col lg:flex-row items-center justify-between gap-12"
      >
        {/* Copy */}
        <div className="lg:max-w-xl">
          <p
            className="mb-4"
            style={{
              color: '#D4AF37',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Concierge Support
          </p>
          <h2
            className="font-light mb-4"
            style={{
              color: '#FAFAFA',
              fontSize: 'clamp(1.6rem, 3vw, 2.5rem)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {headline}
          </h2>
          <p
            style={{
              color: 'rgba(250,250,250,0.55)',
              fontSize: '1rem',
              lineHeight: 1.7,
            }}
          >
            {subheadline}
          </p>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 transition-opacity hover:opacity-80"
            style={{
              backgroundColor: '#25D366',
              color: '#0A0A0A',
              padding: '16px 36px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            <MessageCircle size={16} />
            {cta_text}
          </a>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: AnnouncementBar
// Slim top announcement strip — dismissible, gold on dark
// ─────────────────────────────────────────────────────────────

function AnnouncementBar({ settings }: { settings: AnnouncementBarSettings }): React.ReactElement | null {
  const {
    text = 'Free domestic shipping on orders above ₹5,000.',
    active = true,
    cta_text,
    cta_link,
  } = settings;

  if (!active) return null;

  return (
    <div
      className="w-full flex items-center justify-center gap-6 px-6 py-3 text-center"
      style={{
        backgroundColor: '#D4AF37',
        color: '#0A0A0A',
      }}
    >
      <p
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {text}
      </p>

      {cta_text && cta_link && (
        <Link
          href={cta_link}
          className="inline-flex items-center gap-1 underline underline-offset-2 transition-opacity hover:opacity-70"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: '#0A0A0A',
          }}
        >
          {cta_text}
          <ArrowRight size={10} />
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main: DynamicSectionRenderer
// Registry pattern — dispatches section type to correct component
// ─────────────────────────────────────────────────────────────

interface DynamicSectionRendererProps {
  section: PageSection;
}

export default function DynamicSectionRenderer({ section }: DynamicSectionRendererProps): React.ReactElement | null {
  if (!section.is_visible) return null;

  const { type, variant, settings } = section;

  switch (type) {
    case 'hero_banner':
      return (
        <HeroBanner
          settings={settings as HeroBannerSettings}
          variant={variant}
        />
      );

    case 'brand_story':
      return (
        <BrandStory
          settings={settings as BrandStorySettings}
          variant={variant}
        />
      );

    case 'bento_grid':
      return (
        <BentoGrid
          settings={settings as BentoGridSettings}
        />
      );

    case 'support_cta':
      return (
        <SupportCta
          settings={settings as SupportCtaSettings}
        />
      );

    case 'announcement_bar':
      return (
        <AnnouncementBar
          settings={settings as AnnouncementBarSettings}
        />
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Named exports for individual section components
// Allows direct use without CMS wiring when needed
// ─────────────────────────────────────────────────────────────

export { HeroBanner, BrandStory, BentoGrid, SupportCta, AnnouncementBar };
