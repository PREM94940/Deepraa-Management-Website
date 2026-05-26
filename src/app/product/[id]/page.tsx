"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStorefrontCMS } from '@/hooks/useStorefrontCMS';
import { SECTION_REGISTRY } from '@/registry/sections';

export default function ProductDetails() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [product, setProduct] = useState<any>(null);
    const [dbLoading, setDbLoading] = useState(true);
    const [mainImage, setMainImage] = useState<string>('');
    const [qty, setQty] = useState(1);
    
    // Customization States
    const [needsStitching, setNeedsStitching] = useState(false);
    const [needsFallPico, setNeedsFallPico] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string>('');
    
    const { addItem } = useCartStore();
    const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore();

    // Fetch product details from DB
    useEffect(() => {
        async function fetchProduct() {
            if (!id) return;
            const { data } = await supabase.from('products').select('*').eq('id', id).single();
            if (data) {
                setProduct(data);
                if (data.images && data.images.length > 0) {
                    setMainImage(data.images[0]);
                }
            }
            setDbLoading(false);
        }
        fetchProduct();
    }, [id]);

    // CMS Config integration
    const { sections, globalSettings, loading: cmsLoading } = useStorefrontCMS('product');

    const handleAddToCart = () => {
        if (!product) return;
        
        let finalPrice = product.price;
        if (needsStitching) finalPrice += 1500;
        if (needsFallPico) finalPrice += 300;

        addItem({
            id: product.id,
            name: product.title,
            price: finalPrice,
            qty: qty,
            img: mainImage || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600'
        });
    };

    const handleWhatsAppOrder = () => {
        if (!product) return;
        const number = globalSettings.whatsapp_number || '919876543210';
        const message = `Hello Deeprastore, I want to order:\n*${product.title}* (SKU: ${product.sku})\nQuantity: ${qty}\nStitching Required: ${needsStitching ? 'Yes' : 'No'}\nFall & Pico: ${needsFallPico ? 'Yes' : 'No'}\nLink: ${window.location.href}`;
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (dbLoading || cmsLoading) {
        return (
            <main className="min-h-screen bg-surface flex items-center justify-center">
                <div className="animate-pulse text-xl font-bold italic font-display text-muted">Preparing your luxury experience...</div>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="min-h-screen bg-surface">
                <Navbar globalSettings={globalSettings} />
                <div className="py-32 text-center">
                    <h1 className="text-4xl font-display font-bold text-fg">Piece Not Found</h1>
                    <Link href="/collections" className="mt-8 inline-block border-b border-black pb-1 uppercase tracking-widest text-sm font-bold">
                        Return to Collections
                    </Link>
                </div>
                <Footer globalSettings={globalSettings} />
            </main>
        );
    }

    return (
        <main className="relative bg-surface min-h-screen w-full">
            <Navbar globalSettings={globalSettings} />
            
            <div className="flex flex-col">
                {sections.length > 0 ? (
                    sections.map((section, idx) => {
                        const ComponentMap = SECTION_REGISTRY[section.type];
                        if (!ComponentMap) {
                            console.warn(`Unknown section type: ${section.type}`);
                            return null;
                        }
                        
                        const Component = ComponentMap.component;
                        
                        // Pass dynamic states if this is the ProductHero section
                        const extraProps = section.type === 'product_hero' ? {
                            product,
                            mainImage,
                            setMainImage,
                            qty,
                            setQty,
                            needsStitching,
                            setNeedsStitching,
                            needsFallPico,
                            setNeedsFallPico,
                            selectedSize,
                            setSelectedSize,
                            handleAddToCart,
                            handleWhatsAppOrder
                        } : {};

                        // Visibility Controls
                        let visibilityClass = '';
                        if (section.settings?.visibility === 'desktop_only') visibilityClass = 'hidden md:block';
                        if (section.settings?.visibility === 'mobile_only') visibilityClass = 'block md:hidden';

                        // Spacing Controls
                        let spacingClass = '';
                        if (section.settings?.padding === 'none') spacingClass = '!py-0';
                        else if (section.settings?.padding === 'small') spacingClass = '!py-8 md:!py-12';
                        else if (section.settings?.padding === 'large') spacingClass = '!py-32 md:!py-48';

                        return (
                            <div key={idx} id={`section-${section.type}`} className={`${visibilityClass} ${spacingClass}`}>
                                <Component data={section.settings} {...extraProps} />
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center text-muted">No sections configured for this template.</div>
                )}
            </div>

            <Footer globalSettings={globalSettings} />
            <CartDrawer />
        </main>
    );
}
