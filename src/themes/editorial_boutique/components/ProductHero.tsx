"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

export const ProductHero = ({ 
    data, 
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
}: { 
    data?: any, 
    product?: any, 
    mainImage?: string, 
    setMainImage?: (img: string) => void, 
    qty?: number, 
    setQty?: (qty: number) => void, 
    needsStitching?: boolean, 
    setNeedsStitching?: (n: boolean) => void, 
    needsFallPico?: boolean, 
    setNeedsFallPico?: (n: boolean) => void, 
    selectedSize?: string, 
    setSelectedSize?: (s: string) => void, 
    handleAddToCart?: () => void, 
    handleWhatsAppOrder?: () => void 
}) => {
    const mockProduct = {
        id: 'mock-product',
        title: 'The Royal Banarasi Silk Lehenga',
        price: 45000,
        compare_at_price: 55000,
        category: 'Lehengas',
        sku: 'DP-LHN-001',
        is_customizable: true,
        available_sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: '<p>A masterpiece of handloom weaving, crafted by our master weavers in Varanasi. Featuring intricate gold Zari work across premium raw silk, this bridal lehenga is a timeless celebration of Indian heritage and artisanal excellence.</p>',
        images: [
            'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=800'
        ]
    };

    const p = product || mockProduct;
    const [localMainImage, setLocalMainImage] = useState(p.images?.[0] || '');
    const [localQty, setLocalQty] = useState(1);
    const [localNeedsStitching, setLocalNeedsStitching] = useState(false);
    const [localNeedsFallPico, setLocalNeedsFallPico] = useState(false);
    const [localSelectedSize, setLocalSelectedSize] = useState('');
    const [isHoveringImage, setIsHoveringImage] = useState(false);

    const currentMainImage = mainImage !== undefined ? mainImage : localMainImage;
    const currentQty = qty !== undefined ? qty : localQty;
    const currentNeedsStitching = needsStitching !== undefined ? needsStitching : localNeedsStitching;
    const currentNeedsFallPico = needsFallPico !== undefined ? needsFallPico : localNeedsFallPico;
    const currentSelectedSize = selectedSize !== undefined ? selectedSize : localSelectedSize;

    const changeMainImage = setMainImage || setLocalMainImage;
    const changeQty = setQty || setLocalQty;
    const changeNeedsStitching = setNeedsStitching || setLocalNeedsStitching;
    const changeNeedsFallPico = setNeedsFallPico || setLocalNeedsFallPico;
    const changeSelectedSize = setSelectedSize || setLocalSelectedSize;

    useEffect(() => {
        if (!currentMainImage && p.images?.[0]) {
            changeMainImage(p.images[0]);
        }
    }, [p.images, currentMainImage, changeMainImage]);

    const onAddToCart = handleAddToCart || (() => {
        alert(`Added to cart: ${p.title} (Qty: ${currentQty})`);
    });

    const onWhatsAppOrder = handleWhatsAppOrder || (() => {
        const msg = `Hello, I want to order ${p.title} (SKU: ${p.sku})`;
        window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank');
    });

    const isSplit = data?.layout !== 'full';

    return (
        <section className={`py-12 md:py-16 px-4 md:px-8 max-w-7xl mx-auto ${isSplit ? 'grid lg:grid-cols-2 gap-12 lg:gap-16' : 'flex flex-col'}`}>
            {/* Gallery Column */}
            <div className={`space-y-6`}>
                <div 
                    className="aspect-[4/5] lg:aspect-[3/4] bg-gray-50 overflow-hidden relative group rounded-sm border border-border cursor-zoom-in"
                    onMouseEnter={() => setIsHoveringImage(true)}
                    onMouseLeave={() => setIsHoveringImage(false)}
                >
                    <Image 
                        src={currentMainImage} 
                        alt={p.title} 
                        fill 
                        sizes="(max-width: 768px) 100vw, 50vw" 
                        priority
                        className={`object-cover transition-transform duration-[1.5s] ease-out ${isHoveringImage ? 'scale-110' : 'scale-100'}`} 
                    />
                    
                    {/* Floating Brand Badge */}
                    <div className="absolute top-6 left-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="bg-white/90 backdrop-blur-md px-4 py-2 text-xs font-bold tracking-widest uppercase shadow-sm">
                            Deeprastore Exclusive
                        </span>
                    </div>
                </div>

                {p.images && p.images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 pt-2">
                        {p.images.map((img: string, idx: number) => (
                            <button 
                                key={idx} 
                                onClick={() => changeMainImage(img)}
                                className={`relative w-20 h-28 flex-shrink-0 overflow-hidden transition-all duration-300 ${currentMainImage === img ? 'ring-1 ring-black ring-offset-2 scale-100 opacity-100' : 'border border-transparent opacity-60 hover:opacity-100 hover:scale-[1.02]'}`}
                            >
                                <Image src={img} alt={`${p.title} view ${idx + 1}`} fill sizes="80px" className="object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Details Column */}
            <div className={`flex flex-col lg:pl-4 xl:pl-8 lg:sticky lg:top-32 lg:h-max pb-32 lg:pb-0`}>
                {/* Breadcrumbs & Title */}
                <div className="mb-10">
                    <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted mb-6">
                        <a href="/" className="hover:text-black transition-colors">Home</a>
                        <span>/</span>
                        <a href="/collections" className="hover:text-black transition-colors">{p.category || 'Collection'}</a>
                        <span>/</span>
                        <span className="text-black truncate max-w-[150px]" title={p.title}>{p.title}</span>
                    </nav>

                    <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display font-medium leading-[1.1] mb-6 text-fg tracking-tight">
                        {p.title}
                    </h1>
                    
                    <div className="flex items-end gap-4 mb-4">
                        <p className="text-3xl text-fg font-light tracking-wide">
                            ₹{p.price.toLocaleString('en-IN')}
                        </p>
                        {p.compare_at_price && p.compare_at_price > p.price && (
                            <p className="text-xl text-muted line-through mb-1">
                                ₹{p.compare_at_price.toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>
                    <p className="text-xs text-muted font-medium uppercase tracking-widest">Taxes Included. Free Shipping in India.</p>
                </div>

                <div className="h-px w-full bg-border mb-10"></div>

                {/* Customization Options */}
                {p.is_customizable ? (
                    <div className="mb-10 space-y-5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-fg flex items-center gap-2">
                            Boutique Services
                            <span className="w-full h-px bg-border ml-4 flex-1"></span>
                        </h3>
                        
                        <label className={`flex items-start gap-4 cursor-pointer group border p-5 transition-all duration-300 ${currentNeedsStitching ? 'border-black bg-black/5 shadow-inner' : 'border-border bg-white hover:border-gray-400'}`}>
                            <input 
                                type="checkbox"
                                checked={currentNeedsStitching}
                                onChange={(e) => changeNeedsStitching(e.target.checked)}
                                className="mt-1 accent-black w-4 h-4 cursor-pointer"
                            />
                            <div>
                                <div className="font-bold text-fg text-sm tracking-wide">{data?.stitching_label || 'Custom Stitching'} (+₹{data?.stitching_price || '1,500'})</div>
                                <div className="text-xs text-muted mt-2 font-light leading-relaxed pr-4">{data?.stitching_desc || 'Tailored to your exact measurements. Our stylist will contact you via WhatsApp post-purchase.'}</div>
                            </div>
                        </label>

                        <label className={`flex items-start gap-4 cursor-pointer group border p-5 transition-all duration-300 ${currentNeedsFallPico ? 'border-black bg-black/5 shadow-inner' : 'border-border bg-white hover:border-gray-400'}`}>
                            <input 
                                type="checkbox"
                                checked={currentNeedsFallPico}
                                onChange={(e) => changeNeedsFallPico(e.target.checked)}
                                className="mt-1 accent-black w-4 h-4 cursor-pointer"
                            />
                            <div>
                                <div className="font-bold text-fg text-sm tracking-wide">{data?.fall_pico_label || 'Fall & Pico'} (+₹{data?.fall_pico_price || '300'})</div>
                                <div className="text-xs text-muted mt-2 font-light leading-relaxed pr-4">{data?.fall_pico_desc || 'Saree edges beautifully finished and fall securely attached by our artisans.'}</div>
                            </div>
                        </label>
                    </div>
                ) : p.available_sizes && p.available_sizes.length > 0 && (
                    <div className="mb-10">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-fg">Select Size</h3>
                            <button className="text-xs text-muted hover:text-black underline underline-offset-4">Size Guide</button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {p.available_sizes.map((size: string) => (
                                <button 
                                    key={size}
                                    onClick={() => changeSelectedSize(size)}
                                    className={`w-14 h-14 border flex items-center justify-center font-medium text-sm transition-all duration-300 ${currentSelectedSize === size ? 'border-black bg-black text-white shadow-md scale-105' : 'border-border bg-white text-fg hover:border-black'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="mb-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-fg mb-5">The Details</h3>
                    <div className="prose prose-p:font-light prose-p:leading-loose text-fg text-sm/7" dangerouslySetInnerHTML={{ __html: p.description || '' }} />
                </div>

                {/* Handcrafted Curation Timeline Notice */}
                <div className="mb-8 p-4 bg-[#FCFBF8] border border-[#EBE8E0] rounded-sm flex items-start gap-3">
                    <span className="text-[11px] text-[#A67C1E] font-bold uppercase tracking-widest bg-[#F5F2EA] px-2 py-0.5 rounded-sm shrink-0">Timeline</span>
                    <p className="text-xs text-muted leading-relaxed font-light">
                        <strong className="text-fg font-semibold">Handcrafted to Order:</strong> Fabric sourcing, weaving, and custom tailoring require 7-12 business days before dispatch. Expect premium attention to details.
                    </p>
                </div>

                {/* Actions (Sticky on Mobile) */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-border lg:static lg:bg-transparent lg:border-t-0 lg:p-0 z-40 flex flex-col gap-4">
                    <div className="flex gap-4 items-stretch">
                        <div className="hidden sm:flex items-center border border-black bg-white h-14">
                            <button onClick={() => changeQty(Math.max(1, currentQty - 1))} className="w-12 h-full flex items-center justify-center hover:bg-gray-100 transition-colors">-</button>
                            <span className="w-10 text-center text-sm font-semibold">{currentQty}</span>
                            <button onClick={() => changeQty(currentQty + 1)} className="w-12 h-full flex items-center justify-center hover:bg-gray-100 transition-colors">+</button>
                        </div>
                        <button 
                            onClick={onAddToCart}
                            className="flex-1 bg-black text-white h-14 font-bold text-xs uppercase tracking-widest hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center group relative overflow-hidden">
                            <span className="relative z-10">Add to Cart • ₹{(p.price * currentQty + (currentNeedsStitching ? 1500 : 0) + (currentNeedsFallPico ? 300 : 0)).toLocaleString('en-IN')}</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                        </button>
                    </div>
                    <button 
                        onClick={onWhatsAppOrder}
                        className="w-full bg-[#25D366] text-white h-14 font-bold text-xs uppercase tracking-widest hover:bg-[#1EBE5D] transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Request Video Call / Order
                    </button>
                </div>

                {/* Stylist Banner */}
                <div className="bg-[#25D366]/[0.03] border border-[#25D366]/20 p-6 mt-10 lg:mt-6 rounded-sm">
                    <div className="flex gap-5 items-start">
                        <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-fg mb-1">Need Styling Advice?</p>
                            <p className="text-sm text-muted leading-relaxed mb-3">Our concierge is available to help you with measurements, styling, and any customizations.</p>
                            <button onClick={onWhatsAppOrder} className="text-xs font-bold uppercase tracking-widest text-[#25D366] hover:underline flex items-center gap-1">
                                Chat with Stylist →
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border">
                    <div className="text-center p-4">
                        <span className="block text-xl mb-2">🚚</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Free Shipping</span>
                        <span className="block text-xs text-muted mt-1 font-light">Worldwide on orders over ₹1L</span>
                    </div>
                    <div className="text-center p-4">
                        <span className="block text-xl mb-2">✨</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Authentic Handloom</span>
                        <span className="block text-xs text-muted mt-1 font-light">Certified Weaves</span>
                    </div>
                </div>
            </div>
        </section>
    );
};
