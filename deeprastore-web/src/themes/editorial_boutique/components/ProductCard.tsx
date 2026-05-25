import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export const ProductCard = ({ product }: { product: any }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Fallback images if not provided
    const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=600';
    const secondaryImage = product.images?.[1] || mainImage;
    const title = product.title || product.name || 'Premium Handloom Product';

    return (
        <div 
            className="group flex flex-col cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-gray-50 mb-6">
                <Image 
                    src={mainImage} 
                    alt={title} 
                    fill 
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={`object-cover transition-opacity duration-700 ease-out ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                />
                <Image 
                    src={secondaryImage} 
                    alt={`${title} alternate view`} 
                    fill 
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={`object-cover transition-opacity duration-700 ease-out absolute inset-0 ${isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
                />
                
                {/* Floating Tags */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="bg-red-500 text-white px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
                            Sale
                        </span>
                    )}
                    {product.is_customizable && (
                        <span className="bg-black text-white px-2 py-1 text-[10px] font-bold tracking-widest uppercase">
                            Bespoke
                        </span>
                    )}
                </div>

                {/* Quick Add Overlay */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out bg-gradient-to-t from-black/60 to-transparent z-20`}>
                    <button className="w-full bg-white/90 backdrop-blur-sm text-black h-12 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex items-center justify-center">
                        Quick View
                    </button>
                </div>
            </Link>

            <div className="flex flex-col flex-1">
                <div className="text-[10px] text-muted uppercase tracking-[0.2em] mb-2 font-semibold">
                    {product.categories?.name || product.category || 'Collection'}
                </div>
                <Link href={`/product/${product.id}`} className="group-hover:text-accent transition-colors">
                    <h3 className="text-lg font-display text-fg mb-3 line-clamp-2 leading-snug">
                        {title}
                    </h3>
                </Link>
                <div className="mt-auto flex items-end gap-3">
                    <span className="text-sm font-medium tracking-wide">₹{product.price.toLocaleString('en-IN')}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-xs text-muted line-through">₹{product.compare_at_price.toLocaleString('en-IN')}</span>
                    )}
                </div>
            </div>
        </div>
    );
};
