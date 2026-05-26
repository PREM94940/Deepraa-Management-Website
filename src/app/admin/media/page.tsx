"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, AlertCircle, X, Check, Crop } from 'lucide-react';

export default function MediaLibrary() {
    const [media, setMedia] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

    // Simulated focal point local state before saving
    const [focal, setFocal] = useState({ x: 50, y: 50 });

    useEffect(() => {
        async function fetchMedia() {
            // Simulated fetch for UI build-out
            const mockData = [
                { id: '1', url: 'https://images.unsplash.com/photo-1605000523098-944208a0d7d9?auto=format&fit=crop&q=80&w=1200', focal_x: 50, focal_y: 50, tags: ['bridal', 'hero'] },
                { id: '2', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800', focal_x: 50, focal_y: 20, tags: ['collection'] },
            ];
            setMedia(mockData);
        }
        fetchMedia();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        
        // 1. Max Size Validation (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File exceeds 5MB luxury governance limit.');
            return;
        }

        // 2. Minimum Resolution Validation
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            if (img.width < 1080) {
                setError('Resolution too low. Minimum width is 1080px to maintain luxury fidelity.');
                return;
            }
            // Simulate upload success
            setUploading(true);
            setTimeout(() => {
                setMedia([{ id: Date.now().toString(), url: img.src, focal_x: 50, focal_y: 50, tags: ['new'] }, ...media]);
                setUploading(false);
            }, 1000);
        };
    };

    const openFocalEditor = (item: any) => {
        setSelectedMedia(item);
        setFocal({ x: item.focal_x || 50, y: item.focal_y || 50 });
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setFocal({ x: Math.round(x), y: Math.round(y) });
    };

    const saveFocalPoint = () => {
        // Mock save to DB
        setMedia(media.map(m => m.id === selectedMedia.id ? { ...m, focal_x: focal.x, focal_y: focal.y } : m));
        setSelectedMedia(null);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto bg-bg min-h-screen">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-display text-fg mb-2">Media Pipeline</h1>
                    <p className="text-muted text-sm">Governed asset ingestion and focal-point optimization.</p>
                </div>
                
                <div className="relative">
                    <input type="file" id="upload" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
                    <label htmlFor="upload" className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center gap-2 hover:bg-gray-800 transition-colors">
                        <Camera className="w-4 h-4" />
                        {uploading ? 'Processing...' : 'Ingest Asset'}
                    </label>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {media.map((item) => (
                    <div key={item.id} onClick={() => openFocalEditor(item)} className="relative aspect-square bg-surface border border-border group cursor-pointer overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <img 
                            src={item.url} 
                            alt="Media" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            style={{ objectPosition: `${item.focal_x}% ${item.focal_y}%` }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4">
                            <Crop className="w-6 h-6 mb-2 text-gold" />
                            <span className="text-xs font-bold uppercase tracking-widest text-center">Edit Focal Point</span>
                        </div>
                        {item.tags?.map((tag: string, i: number) => (
                            <span key={i} className="absolute top-2 left-2 bg-white/90 text-black text-[9px] px-2 py-1 uppercase tracking-wider font-bold">#{tag}</span>
                        ))}
                    </div>
                ))}
            </div>

            {/* Focal Point Editor Modal */}
            {selectedMedia && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="bg-surface w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
                        
                        <div className="flex justify-between items-center p-6 border-b border-border bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-widest">Focal-Point Preview Matrix</h2>
                                <p className="text-xs text-muted mt-1">Click the source image to set the anchor point. Previews update instantly.</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setSelectedMedia(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row p-6 gap-10 bg-gray-50 flex-1">
                            {/* Editor Canvas */}
                            <div className="lg:w-1/2 flex flex-col">
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-muted">Source Image</h3>
                                <div className="relative border border-border shadow-sm cursor-crosshair inline-block bg-white">
                                    <img 
                                        src={selectedMedia.url} 
                                        onClick={handleImageClick} 
                                        className="max-w-full max-h-[60vh] object-contain" 
                                        alt="Editor" 
                                    />
                                    {/* Reticle */}
                                    <div 
                                        className="absolute w-4 h-4 rounded-full border-2 border-white bg-gold/80 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all"
                                        style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center mt-6">
                                    <div className="text-xs font-mono bg-white border border-border px-3 py-1">X: {focal.x}% | Y: {focal.y}%</div>
                                    <button onClick={saveFocalPoint} className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gold transition-colors">
                                        <Check className="w-4 h-4" /> Save Metadata
                                    </button>
                                </div>
                            </div>

                            {/* Preview Matrix */}
                            <div className="lg:w-1/2">
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-muted">Live Device Cropping</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    
                                    {/* 4:5 Mobile Portrait */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 aspect-[4/5] bg-gray-200 border border-border shadow-sm overflow-hidden relative">
                                            <img src={selectedMedia.url} className="w-full h-full object-cover transition-all" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
                                            <div className="absolute inset-0 border border-black/10"></div>
                                        </div>
                                        <span className="text-[10px] mt-2 font-bold text-muted uppercase">4:5 (Mobile)</span>
                                    </div>

                                    {/* 1:1 Square */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 aspect-square bg-gray-200 border border-border shadow-sm overflow-hidden relative">
                                            <img src={selectedMedia.url} className="w-full h-full object-cover transition-all" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
                                            <div className="absolute inset-0 border border-black/10"></div>
                                        </div>
                                        <span className="text-[10px] mt-2 font-bold text-muted uppercase">1:1 (Social Feed)</span>
                                    </div>

                                    {/* 16:9 Desktop */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-48 aspect-video bg-gray-200 border border-border shadow-sm overflow-hidden relative">
                                            <img src={selectedMedia.url} className="w-full h-full object-cover transition-all" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
                                            <div className="absolute inset-0 border border-black/10"></div>
                                        </div>
                                        <span className="text-[10px] mt-2 font-bold text-muted uppercase">16:9 (Desktop Hero)</span>
                                    </div>

                                    {/* 9:16 Full Bleed */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 aspect-[9/16] bg-gray-200 border border-border shadow-sm overflow-hidden relative">
                                            <img src={selectedMedia.url} className="w-full h-full object-cover transition-all" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
                                            <div className="absolute inset-0 border border-black/10"></div>
                                        </div>
                                        <span className="text-[10px] mt-2 font-bold text-muted uppercase">9:16 (Full Bleed)</span>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
