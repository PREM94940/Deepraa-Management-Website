"use client";
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { motion } from 'framer-motion';
import Link from 'next/link';

const looks = [
    {
        id: 1,
        title: 'The Royal Banarasi',
        category: 'Bridal',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550905b92?auto=format&fit=crop&q=80&w=800',
        description: 'A deep dive into the heritage of handwoven silk.'
    },
    {
        id: 2,
        title: 'Modern Minimalism',
        category: 'Editorial',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
        description: 'How to style traditional pieces for contemporary events.'
    },
    {
        id: 3,
        title: 'Festive Hues',
        category: 'Collection',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800',
        description: 'Vibrant colors that define the joy of celebration.'
    }
];

export default function Lookbook() {
    return (
        <main className="relative bg-surface min-h-screen flex flex-col">
            <Navbar />
            
            <div className="flex-1 max-w-7xl mx-auto px-6 py-24 w-full">
                <div className="text-center mb-20">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-display font-bold mb-6"
                    >
                        The <span className="text-accent italic">Lookbook</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted max-w-2xl mx-auto text-lg"
                    >
                        Explore our curated style stories, editorial campaigns, and styling guides.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {looks.map((look, idx) => (
                        <motion.div 
                            key={look.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.6 }}
                            className="group cursor-pointer"
                        >
                            <div className="aspect-[4/5] overflow-hidden rounded-2xl mb-6 relative">
                                <img 
                                    src={look.image} 
                                    alt={look.title} 
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <span className="text-white border border-white px-6 py-3 font-bold uppercase tracking-widest text-xs backdrop-blur-sm">
                                        View Story
                                    </span>
                                </div>
                            </div>
                            <div className="text-center">
                                <span className="text-accent font-bold tracking-widest uppercase text-xs mb-3 block">
                                    {look.category}
                                </span>
                                <h3 className="text-2xl font-bold font-display mb-3 group-hover:text-accent transition-colors">
                                    {look.title}
                                </h3>
                                <p className="text-muted line-clamp-2">
                                    {look.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-32 text-center bg-gray-50 p-16 rounded-[3rem]">
                    <h2 className="text-3xl font-display font-bold mb-6">Want to be featured?</h2>
                    <p className="text-muted mb-8 max-w-xl mx-auto">
                        Tag us on Instagram <span className="text-black font-bold">@deeprastore</span> or use the hashtag <span className="text-black font-bold">#DeepraWoman</span> to be featured in our community gallery.
                    </p>
                    <Link 
                        href="https://instagram.com"
                        target="_blank"
                        className="inline-block bg-black text-white px-10 py-4 font-bold uppercase tracking-widest text-sm hover:bg-gold transition-colors"
                    >
                        Follow our Journey
                    </Link>
                </div>
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
