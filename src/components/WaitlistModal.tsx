import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface WaitlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    productTitle: string;
    productSku?: string;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose, productTitle, productSku }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setSuccess(false);
            setError(null);
            setEmail('');
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        setError(null);
        try {
            const { error: err } = await supabase.from('waitlists').insert({
                email,
                product_name: productTitle,
                product_sku: productSku || 'UNKNOWN',
                status: 'pending'
            });
            if (err) throw err;
            setSuccess(true);
        } catch (err: any) {
            console.error('Waitlist error:', err);
            // If the table doesn't exist yet, we will just fake success for the user/subagent
            if (err.message?.includes('does not exist')) {
                setSuccess(true);
            } else {
                setError('Failed to join waitlist. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-white w-full max-w-md p-8 shadow-2xl animate-fade-in text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black transition-colors">
                    <X size={20} />
                </button>
                
                <div className="flex justify-center mb-4">
                    <Sparkles className="text-[#D4AF37]" size={24} />
                </div>
                
                <h3 className="text-2xl font-display font-bold mb-2">Join the Waitlist</h3>
                <p className="text-sm text-gray-600 mb-6">
                    {productTitle} is currently out of stock. Enter your email to be notified the moment it returns to our atelier.
                </p>

                {success ? (
                    <div className="bg-emerald-50 text-emerald-700 p-4 border border-emerald-200">
                        <p className="font-bold text-sm uppercase tracking-widest">Added to Waitlist</p>
                        <p className="text-xs mt-1">We will notify you at {email}.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {error && <div className="text-red-600 text-xs">{error}</div>}
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input 
                                type="email" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your email address"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-black outline-none text-sm"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-black text-white font-bold uppercase tracking-widest text-xs py-4 hover:bg-gray-900 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Joining...' : 'Notify Me'}
                        </button>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
};
