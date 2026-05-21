"use client";

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function CustomStitching() {
    const [formState, setFormState] = useState({ name: '', email: '', phone: '', requirements: '' });
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, send to Supabase or email service
        setSubmitted(true);
    };

    return (
        <main className="relative bg-surface">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-bold font-display mb-6 leading-tight text-fg">
                            Tailored to <br/> <span className="text-accent italic">Perfection.</span>
                        </h1>
                        <p className="text-lg text-muted mb-8 max-w-md leading-relaxed">
                            Experience the luxury of bespoke Indian wear. From intricate hand-embroidery to the perfect fit, our master artisans bring your vision to life.
                        </p>
                        <div className="space-y-6 mb-12">
                            {[
                                { title: 'Consultation', desc: 'Discuss your vision with our expert stylists.' },
                                { title: 'Fabric Selection', desc: 'Choose from our premium collection of authentic handlooms.' },
                                { title: 'Measurement', desc: 'Virtual or in-person precise measurements.' },
                                { title: 'Creation', desc: 'Crafted with care by master artisans in 2-3 weeks.' }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-fg mb-1">{step.title}</h4>
                                        <p className="text-sm text-muted">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white p-10 rounded-[2rem] shadow-xl border border-border"
                    >
                        {submitted ? (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 bg-accent-emerald/20 text-accent-emerald rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                                </div>
                                <h3 className="text-2xl font-bold font-display mb-2">Request Received!</h3>
                                <p className="text-muted">Our stylist will contact you within 24 hours to begin your bespoke journey.</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold font-display mb-8">Start Your Journey</h3>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-widest">Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formState.name}
                                            onChange={e => setFormState({...formState, name: e.target.value})}
                                            className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-widest">Email</label>
                                        <input 
                                            type="email" 
                                            required
                                            value={formState.email}
                                            onChange={e => setFormState({...formState, email: e.target.value})}
                                            className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-widest">WhatsApp Number</label>
                                        <input 
                                            type="tel" 
                                            required
                                            value={formState.phone}
                                            onChange={e => setFormState({...formState, phone: e.target.value})}
                                            className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-widest">What are you looking for?</label>
                                        <textarea 
                                            required
                                            rows={4}
                                            value={formState.requirements}
                                            onChange={e => setFormState({...formState, requirements: e.target.value})}
                                            placeholder="E.g., A bridal lehenga in Banarasi silk..."
                                            className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-muted mb-2 uppercase tracking-widest">Reference Design (Optional)</label>
                                        <div className="flex items-center justify-center w-full">
                                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
                                                {referenceImage ? (
                                                    <img src={referenceImage} alt="Reference" className="h-full object-contain" />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                                                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                                                    </div>
                                                )}
                                                <input id="dropzone-file" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                            </label>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all">
                                        Request Consultation
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>

            <Footer />
            <CartDrawer />
        </main>
    );
}
