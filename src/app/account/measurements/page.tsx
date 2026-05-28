"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Scissors, Save, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AccountMeasurements() {
    const { user } = useAuth();
    const [measurements, setMeasurements] = useState({
        chest: '',
        waist: '',
        hips: '',
        inseam: '',
        shoulderWidth: '',
        fitPreference: 'Slim Fit',
        additionalNotes: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (user) {
            fetchMeasurements();
        }
    }, [user]);

    const fetchMeasurements = async () => {
        try {
            const { data } = await supabase
                .from('customers')
                .select('measurements')
                .eq('id', user?.id)
                .single();
            if (data?.measurements && Object.keys(data.measurements).length > 0) {
                setMeasurements({
                    ...measurements,
                    ...data.measurements
                });
            }
        } catch (error) {
            console.error("Error fetching measurements:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        try {
            const { error } = await supabase
                .from('customers')
                .update({ measurements })
                .eq('id', user?.id);
            
            if (error) throw error;
            setSuccessMsg('Your bespoke measurements have been securely saved and will be applied to future curations.');
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error: any) {
            alert('Failed to save measurements: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setMeasurements({
            ...measurements,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return <div className="text-center py-20 text-[#A3A3A3] text-[10px] uppercase tracking-widest font-bold animate-pulse">Loading Profile...</div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl">
            <div>
                <h1 className="text-3xl font-display font-light text-white mb-2 flex items-center gap-3">
                    <Scissors size={28} className="text-[#D4AF37]" /> Bespoke Profile
                </h1>
                <p className="text-[10px] text-[#A3A3A3] uppercase tracking-widest">
                    Maintain your custom tailoring parameters for seamless checkout and perfect fit.
                </p>
            </div>

            <form onSubmit={handleSave} className="bg-[#161616] border border-[#222] p-8 rounded shadow-xl space-y-8">
                
                <div className="space-y-4 border-b border-[#222] pb-8">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Primary Metrics (Inches)</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Chest Circumference</label>
                            <input 
                                type="text" 
                                name="chest"
                                value={measurements.chest} 
                                onChange={handleChange} 
                                placeholder="e.g. 40"
                                className="w-full bg-[#222] border border-[#333] p-3 text-sm focus:border-[#D4AF37] outline-none text-white rounded transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Waist Circumference</label>
                            <input 
                                type="text" 
                                name="waist"
                                value={measurements.waist} 
                                onChange={handleChange} 
                                placeholder="e.g. 32"
                                className="w-full bg-[#222] border border-[#333] p-3 text-sm focus:border-[#D4AF37] outline-none text-white rounded transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Hips Circumference</label>
                            <input 
                                type="text" 
                                name="hips"
                                value={measurements.hips} 
                                onChange={handleChange} 
                                placeholder="e.g. 41"
                                className="w-full bg-[#222] border border-[#333] p-3 text-sm focus:border-[#D4AF37] outline-none text-white rounded transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Shoulder Width</label>
                            <input 
                                type="text" 
                                name="shoulderWidth"
                                value={measurements.shoulderWidth} 
                                onChange={handleChange} 
                                placeholder="e.g. 18"
                                className="w-full bg-[#222] border border-[#333] p-3 text-sm focus:border-[#D4AF37] outline-none text-white rounded transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Inseam Length</label>
                            <input 
                                type="text" 
                                name="inseam"
                                value={measurements.inseam} 
                                onChange={handleChange} 
                                placeholder="e.g. 30"
                                className="w-full bg-[#222] border border-[#333] p-3 text-sm focus:border-[#D4AF37] outline-none text-white rounded transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Styling & Fit Preferences</h2>
                    
                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Overall Fit Preference</label>
                        <select 
                            name="fitPreference"
                            value={measurements.fitPreference} 
                            onChange={handleChange}
                            className="w-full bg-[#222] border border-[#333] p-3 text-sm focus:border-[#D4AF37] outline-none text-white rounded transition-colors appearance-none"
                        >
                            <option value="Skinny Fit">Skinny Fit (Form Hugging)</option>
                            <option value="Slim Fit">Slim Fit (Tailored & Tapered)</option>
                            <option value="Classic Fit">Classic Fit (Standard Ease)</option>
                            <option value="Relaxed Fit">Relaxed Fit (Loose & Comfortable)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-2">Bespoke Artisan Notes</label>
                        <textarea 
                            name="additionalNotes"
                            value={measurements.additionalNotes} 
                            onChange={handleChange} 
                            placeholder="Any specific instructions for our tailoring team? (e.g. 'I prefer a higher rise on trousers')"
                            rows={3}
                            className="w-full bg-[#222] border border-[#333] p-3 text-sm focus:border-[#D4AF37] outline-none text-white rounded transition-colors resize-none"
                        />
                    </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        {successMsg && (
                            <div className="text-[#22C55E] text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                                <AlertCircle size={14} /> {successMsg}
                            </div>
                        )}
                    </div>
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-[#D4AF37] hover:bg-[#B8962B] text-black font-extrabold uppercase tracking-widest text-[10px] px-8 py-3.5 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Save size={14} /> {saving ? 'Saving Profile...' : 'Save Measurements'}
                    </button>
                </div>

            </form>
        </motion.div>
    );
}
