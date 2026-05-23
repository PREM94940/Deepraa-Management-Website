export interface AuditResult {
    errors: string[];
    warnings: string[];
}

export function validateCMSPage(page: any): AuditResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!page) {
        return { errors: ["No page data available"], warnings: [] };
    }

    // 1. SEO Completeness
    const title = page.seo_metadata?.title || '';
    const desc = page.seo_metadata?.description || '';
    
    if (!title || title.trim().length === 0) {
        errors.push("SEO Audit: Meta Title is missing. Every published page must have a search title.");
    } else if (title.trim().length < 10) {
        errors.push(`SEO Audit: Meta Title is too short ("${title}"). Must be at least 10 characters for search relevance.`);
    }

    if (!desc || desc.trim().length === 0) {
        errors.push("SEO Audit: Meta Description is missing. Every published page must have a search snippet.");
    } else if (desc.trim().length < 30) {
        errors.push(`SEO Audit: Meta Description is too short (${desc.trim().length} chars). Must be at least 30 characters for rich search snippets.`);
    }

    // Slug validation (only for campaigns and custom pages, homepage slug is usually empty or "/")
    if (page.type !== 'homepage' && page.type !== 'collection' && page.type !== 'product') {
        const slug = page.slug || '';
        if (!slug || slug.trim().length === 0) {
            errors.push("SEO Audit: URL Slug is missing.");
        } else {
            const slugRegex = /^[a-z0-9-]+$/;
            if (!slugRegex.test(slug)) {
                errors.push(`SEO Audit: URL Slug ("${slug}") contains invalid characters. Must be lowercase, numbers, and hyphens only (no spaces, slashes, or uppercase).`);
            }
        }
    }

    // 2. Layout Stability & Template Guards
    if (page.type === 'collection') {
        const hasGrid = page.sections?.some((s: any) => s.type === 'collection_grid');
        if (!hasGrid) {
            errors.push("Governance Guard: Collection template is missing the 'Collection Grid' section (buyers cannot find products).");
        }
    }

    if (page.type === 'product') {
        const hasHero = page.sections?.some((s: any) => s.type === 'product_hero');
        if (!hasHero) {
            errors.push("Governance Guard: Product template is missing the 'Product Details Hero' section (buyers cannot select options or add to cart).");
        }
    }

    if (page.sections?.length > 8) {
        warnings.push(`Heavy page size: ${page.sections.length} sections found. Keeping under 6 sections is recommended for optimal mobile performance.`);
    }

    // 3. Media & Performance & Accessibility
    let videoCount = 0;
    page.sections?.forEach((sec: any, index: number) => {
        const sName = `Section #${index + 1} (${sec.type.replace(/_/g, ' ')})`;
        const imgUrl = sec.settings?.image_url || '';

        // Media Optimization
        if (imgUrl) {
            const isVideo = imgUrl.endsWith('.mp4') || imgUrl.includes('video');
            if (isVideo) {
                videoCount++;
                // If it's a video, check if it's hosted unoptimized or doesn't have width parameters
                if (!imgUrl.includes('w=') && !imgUrl.includes('width=') && !imgUrl.includes('quality=')) {
                    warnings.push(`${sName}: Autoplay video has no compression parameters. Large video payloads can drain mobile bandwidth.`);
                }
            } else {
                // Image Optimization
                const hasModernFormat = imgUrl.includes('.webp') || imgUrl.includes('.avif') || imgUrl.includes('auto=format');
                if (!hasModernFormat) {
                    warnings.push(`${sName}: Unoptimized image format detected. Use WebP/AVIF or append 'auto=format' to reduce loading speeds.`);
                }
                
                // Oversized Media check (if it has w= width setting, make sure it is not too wide)
                const widthMatch = imgUrl.match(/[?&]w=(\d+)/);
                if (widthMatch) {
                    const widthVal = parseInt(widthMatch[1], 10);
                    if (widthVal > 1600) {
                        warnings.push(`${sName}: Media width is oversized (${widthVal}px). Limit images to w=1200 or w=1600 to prevent layout memory pressure.`);
                    }
                } else if (imgUrl.includes('unsplash.com') && !imgUrl.includes('w=')) {
                    warnings.push(`${sName}: Unsplash image URL lacks a width parameter. Set w=1200 to avoid loading raw 4K resolutions.`);
                }
            }
        }

        // Mobile performance: focal point
        if (sec.type === 'cinematic_hero') {
            const focal = sec.settings?.focal_point;
            if (!focal || focal.trim().length === 0) {
                warnings.push(`${sName}: Focal-point is not configured. Set a mobile crop focal point to keep the subject visible on mobile screens.`);
            }
        }

        // Accessibility alt text
        if (sec.type === 'cinematic_hero' || sec.type === 'brand_story') {
            const alt = sec.settings?.alt_text || sec.settings?.alt;
            if (!alt || alt.trim().length === 0) {
                warnings.push(`${sName}: Missing media alt text. Screen readers and SEO crawlers require descriptive alt text.`);
            }
        }

        // Contrast / overlay
        if (sec.type === 'cinematic_hero') {
            const hasOverlay = sec.settings?.overlay !== false; // defaults to true
            if (!hasOverlay) {
                warnings.push(`${sName}: Text overlay is disabled. Light text placed directly on bright backgrounds without an overlay violates accessibility readability rules.`);
            }
        }

        // CTA Links Validation
        const ctaText = sec.settings?.cta_text || '';
        const ctaLink = sec.settings?.cta_link || '';

        if (ctaText.trim().length > 0) {
            if (!ctaLink || ctaLink.trim().length === 0 || ctaLink.trim() === '#') {
                errors.push(`${sName}: CTA text is active ("${ctaText}") but the destination link is empty or "#".`);
            } else {
                const isValidLink = ctaLink.startsWith('/') || 
                                    ctaLink.startsWith('http://') || 
                                    ctaLink.startsWith('https://') || 
                                    ctaLink.startsWith('mailto:') || 
                                    ctaLink.startsWith('tel:') || 
                                    ctaLink.startsWith('#');
                if (!isValidLink) {
                    errors.push(`${sName}: CTA link destination ("${ctaLink}") is invalid. Must be a relative path (starts with "/") or absolute URL.`);
                }
            }
        }
    });

    if (videoCount > 1) {
        errors.push(`Mobile Performance Audit: ${videoCount} autoplaying videos detected. Pages are restricted to a maximum of 1 autoplaying video to prevent severe browser slowdown and mobile data drainage.`);
    }

    return { errors, warnings };
}
