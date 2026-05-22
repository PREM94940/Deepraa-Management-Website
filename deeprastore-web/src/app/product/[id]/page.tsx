"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useCartStore } from '@/store/useCartStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProductDetails() {
    const params = useParams();
    const id = params.id as string;

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState<string>('');
    const [qty, setQty] = useState(1);
    
    // Customization States
    const [needsStitching, setNeedsStitching] = useState(false);
    const [needsFallPico, setNeedsFallPico] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string>('');
    
    const { addItem } = useCartStore();
    const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlistStore();
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
            setLoading(false);
        }
        fetchProduct();
    }, [id]);

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
        const message = `Hello Deeprastore, I want to order:\n*${product.title}* (SKU: ${product.sku})\nQuantity: ${qty}\nStitching Required: ${needsStitching ? 'Yes' : 'No'}\nFall & Pico: ${needsFallPico ? 'Yes' : 'No'}\nLink: ${window.location.href}`;
        window.open(`https://wa.me/919876543210?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-surface flex items-center justify-center">
                <div className="animate-pulse text-xl font-bold italic font-display text-muted">Preparing your luxury experience...</div>
            </main>
        );
    }

    if (!product) {
        return (
            <main className="min-h-screen bg-surface">
                <Navbar />
                <div className="py-32 text-center">
                    <h1 className="text-4xl font-display font-bold text-fg">Piece Not Found</h1>
                    <Link href="/collections" className="mt-8 inline-block border-b border-black pb-1 uppercase tracking-widest text-sm font-bold">
                        Return to Collections
                    </Link>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="relative bg-surface min-h-screen">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid lg:grid-cols-2 gap-16">
                {/* Images Section */}
                <div className="space-y-6 lg:sticky lg:top-24 h-fit">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="aspect-[4/5] -mx-6 md:mx-0 w-[calc(100%+3rem)] md:w-full bg-gray-100 overflow-hidden cursor-zoom-in relative group"
                    >
                        <img src={mainImage} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </motion.div>
                    
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                            {product.video_link && (
                                <a 
                                    href={product.video_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-20 h-28 flex-shrink-0 relative overflow-hidden bg-black flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                                >
                                    <img src={mainImage} alt="Video Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                    <svg className="w-8 h-8 text-white relative z-10" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                                </a>
                            )}
                            {product.images.map((img: string, idx: number) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setMainImage(img)}
                                    className={`w-20 h-28 flex-shrink-0 overflow-hidden transition-all ${mainImage === img ? 'opacity-100 ring-1 ring-black ring-offset-2' : 'opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col"
                >
                    {/* Header */}
                    <div className="mb-8 border-b border-border pb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-accent font-bold tracking-widest uppercase text-xs mb-3 block">
                                    {product.category || 'Premium Collection'}
                                </span>
                                <h1 className="text-4xl md:text-5xl font-display leading-[1.1] mb-6 text-fg">
                                    {product.title}
                                </h1>
                            </div>
                            <button 
                                onClick={() => {
                                    const inWishlist = isInWishlist(product.id);
                                    if (inWishlist) removeWishlist(product.id);
                                    else addWishlist({ id: product.id, name: product.title, price: product.price, img: mainImage || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b' });
                                }}
                                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform shrink-0 border border-border"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? "#ef4444" : "none"} stroke={isInWishlist(product.id) ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                            </button>
                        </div>
                        <div className="flex items-end gap-3">
                            <p className="text-2xl text-fg font-light">
                                ₹{product.price.toLocaleString('en-IN')}
                            </p>
                            {product.compare_at_price && product.compare_at_price > product.price && (
                                <p className="text-lg text-muted line-through mb-1">
                                    ₹{product.compare_at_price.toLocaleString('en-IN')}
                                </p>
                            )}
                        </div>
                        <span className="text-sm text-muted block mt-1 uppercase tracking-widest">Inclusive of all taxes</span>
                    </div>

                    {product.is_customizable ? (
                        <div className="mb-8 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Boutique Services</h3>
                            
                            <label className={`flex items-start gap-4 cursor-pointer group border p-4 transition-all ${needsStitching ? 'border-black bg-gray-50' : 'border-border bg-white hover:border-gray-400'}`}>
                                <div className={`mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${needsStitching ? 'bg-black border-black' : 'border-gray-300'}`}>
                                    {needsStitching && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <div>
                                    <div className="font-bold text-fg text-sm">Custom Stitching (+₹1,500)</div>
                                    <div className="text-xs text-muted mt-1 font-light leading-relaxed">We will contact you for your exact measurements on WhatsApp to ensure a perfect fit.</div>
                                </div>
                            </label>

                            <label className={`flex items-start gap-4 cursor-pointer group border p-4 transition-all ${needsFallPico ? 'border-black bg-gray-50' : 'border-border bg-white hover:border-gray-400'}`}>
                                <div className={`mt-0.5 w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${needsFallPico ? 'bg-black border-black' : 'border-gray-300'}`}>
                                    {needsFallPico && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <div>
                                    <div className="font-bold text-fg text-sm">Fall & Pico (+₹300)</div>
                                    <div className="text-xs text-muted mt-1 font-light leading-relaxed">Edges finished and fall attached for ready-to-drape elegance.</div>
                                </div>
                            </label>
                        </div>
                    ) : product.available_sizes && product.available_sizes.length > 0 && (
                        <div className="mb-10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-fg border-b border-border pb-2 mb-4">Select Size</h3>
                            <div className="flex flex-wrap gap-3">
                                {product.available_sizes.map((size: string) => (
                                    <button 
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-6 py-3 border font-bold text-sm transition-colors ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-300 bg-white text-fg hover:border-black'}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-12">
                        <div className="flex items-center border border-black bg-white">
                            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-6 py-4 font-bold">-</button>
                            <span className="px-4 font-bold w-12 text-center">{qty}</span>
                            <button onClick={() => setQty(qty + 1)} className="px-6 py-4 font-bold">+</button>
                        </div>
                        <button 
                            onClick={handleAddToCart}
                            className="flex-1 bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-gold transition-colors">
                            Add to Cart
                        </button>
                    </div>

                    {/* WhatsApp Concierge */}
                    <div className="bg-[#25D366]/5 border border-[#25D366]/20 p-5 mb-10 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-fg mb-1">Need Styling Advice?</p>
                            <p className="text-xs text-muted leading-relaxed mb-3">Our concierge is available to help you with customization details, measurements, and styling.</p>
                            <button onClick={handleWhatsAppOrder} className="text-xs font-bold uppercase tracking-widest text-[#25D366] hover:underline flex items-center gap-1">
                                Chat with Stylist
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Trust Strip */}
                    <div className="bg-surface rounded-xl p-4 mb-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted border border-border">
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
                            <span>Authentic Collection</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            <span>Secure Checkout</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                            <span>Easy Returns</span>
                        </div>
                    </div>

                    {/* Description & Disclaimers */}
                    <div className="prose prose-p:font-light prose-p:leading-relaxed text-fg mb-12" dangerouslySetInnerHTML={{ __html: product.description || '<p>A timeless piece of elegance.</p>' }} />
                    
                    <div className="bg-gray-50 border border-border p-6 mt-8 space-y-4">
                        <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-fg mb-3 flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-gold block"></span>
                            The Deepra Promise
                        </h4>
                        <p className="text-xs text-muted font-light leading-relaxed">
                            Handcrafted by artisans in India. Slight variations in weave or color are the hallmark of authentic handloom, adding to its unique charm and exclusivity. Dry clean only to preserve the intricate Zari work and delicate fabric.
                        </p>
                    </div>

                    {/* Product Metadata */}
                    <div className="border-t border-border pt-8 space-y-4 text-sm">
                        {product.sku && (
                            <div className="flex">
                                <span className="w-32 font-bold uppercase tracking-widest text-muted text-xs">SKU</span>
                                <span className="font-medium">{product.sku}</span>
                            </div>
                        )}
                        <div className="flex">
                            <span className="w-32 font-bold uppercase tracking-widest text-muted text-xs">Shipping</span>
                            <span className="font-medium">
                                {product.status === 'Active' ? 'Ships in 2-3 business days' : 'Contact for availability'}
                            </span>
                        </div>
                    </div>

                    {/* Reviews Section (Mocked) */}
                    <div className="mt-16 pt-12 border-t border-border">
                        <h3 className="text-2xl font-bold font-display mb-8">Customer Reviews</h3>
                        <div className="space-y-8">
                            {/* Review 1 */}
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex text-accent">
                                        {[1,2,3,4,5].map(star => (
                                            <svg key={star} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted ml-2">Verified Buyer</span>
                                </div>
                                <p className="font-bold mb-2">Absolutely stunning craftsmanship</p>
                                <p className="text-muted text-sm leading-relaxed mb-4">The fabric quality and embroidery detail exceeded my expectations. Wore it to a wedding and received so many compliments!</p>
                                <p className="text-xs font-bold tracking-widest uppercase text-muted">- Anjali S.</p>
                            </div>
                            
                            {/* Review 2 */}
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex text-accent">
                                        {[1,2,3,4,5].map(star => (
                                            <svg key={star} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted ml-2">Verified Buyer</span>
                                </div>
                                <p className="font-bold mb-2">Perfect fit with custom stitching</p>
                                <p className="text-muted text-sm leading-relaxed mb-4">I opted for the custom stitching service. The team reached out on WhatsApp promptly, and the final piece fits like a dream.</p>
                                <p className="text-xs font-bold tracking-widest uppercase text-muted">- Priya M.</p>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-4 border border-black font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-colors">
                            Write a Review
                        </button>
                    </div>
                </motion.div>
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
