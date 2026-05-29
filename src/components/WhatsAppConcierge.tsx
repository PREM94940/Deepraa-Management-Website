"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const WhatsAppConcierge = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    const phoneNumber = "919999999999"; // Fallback/demo number
    
    const handleSupportClick = (type: 'styling' | 'support') => {
        const text = type === 'styling' 
            ? "Hi! I need styling advice and recommendations."
            : "Hi! I need help tracking or managing an existing order.";
            
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 bg-white p-4 rounded-2xl shadow-2xl border border-border w-64 origin-bottom-right"
                    >
                        <div className="mb-4 border-b border-border pb-3">
                            <h2 className="font-display font-bold text-lg leading-tight">Deepra Concierge</h2>
                            <p className="text-xs text-muted">How can we assist you today?</p>
                        </div>
                        <div className="space-y-2">
                            <button 
                                onClick={() => handleSupportClick('styling')}
                                className="w-full text-left p-3 hover:bg-surface rounded-xl transition-colors flex items-center gap-3 group"
                            >
                                <div className="bg-accent/10 p-2 rounded-lg text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><path d="M2 12h20"/><path d="m5 17-3-5 3-5"/><path d="m19 17 3-5-3-5"/></svg>
                                </div>
                                <div>
                                    <span className="block text-sm font-bold">Styling Advice</span>
                                    <span className="block text-[10px] text-muted uppercase tracking-widest">Connect with a stylist</span>
                                </div>
                            </button>
                            <button 
                                onClick={() => handleSupportClick('support')}
                                className="w-full text-left p-3 hover:bg-surface rounded-xl transition-colors flex items-center gap-3 group"
                            >
                                <div className="bg-accent/10 p-2 rounded-lg text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                </div>
                                <div>
                                    <span className="block text-sm font-bold">Order Support</span>
                                    <span className="block text-[10px] text-muted uppercase tracking-widest">Track & manage returns</span>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button 
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close WhatsApp Support" : "Open WhatsApp Support"}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 ${isOpen ? 'bg-black text-white' : 'bg-green-500 text-white'}`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                )}
            </button>
        </div>
    );
};
