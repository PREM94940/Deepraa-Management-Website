'use client';

import React from 'react';
import { X, Ruler, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface SizingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: 'inches' | 'cm';
}

export default function SizingGuideModal({ isOpen, onClose, unit }: SizingGuideModalProps) {
  if (!isOpen) return null;

  const points = [
    {
      name: 'Bust / Chest',
      description: 'Measure around the fullest part of your bust, keeping the tape horizontal and comfortably loose.',
      tip: 'Ensure the tape is flat across your back and fits snugly but not tightly.',
      diagramSvg: (
        <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#D4AF37] stroke-[1.5] fill-none">
          <circle cx="50" cy="50" r="35" className="stroke-white/10" />
          <path d="M15,50 A35,35 0 0,0 85,50" className="stroke-[#D4AF37] stroke-[2.5]" />
          <line x1="15" y1="50" x2="85" y2="50" className="stroke-white/20 stroke-dasharray-[2,2]" />
          <circle cx="15" cy="50" r="3" className="fill-[#D4AF37]" />
          <circle cx="85" cy="50" r="3" className="fill-[#D4AF37]" />
        </svg>
      )
    },
    {
      name: 'Waist Size',
      description: 'Measure around your natural waistline (narrowest part of your torso, typically just above the belly button).',
      tip: 'Do not pull the tape too tight — leave space for one finger for comfortable breathing.',
      diagramSvg: (
        <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#D4AF37] stroke-[1.5] fill-none">
          <circle cx="50" cy="50" r="30" className="stroke-white/10" />
          <path d="M20,50 A30,30 0 0,0 80,50" className="stroke-[#D4AF37] stroke-[2.5]" />
          <line x1="20" y1="50" x2="80" y2="50" className="stroke-white/20 stroke-dasharray-[2,2]" />
          <circle cx="20" cy="50" r="3" className="fill-[#D4AF37]" />
          <circle cx="80" cy="50" r="3" className="fill-[#D4AF37]" />
        </svg>
      )
    },
    {
      name: 'Shoulder Width',
      description: 'Measure horizontally from the outer edge of one shoulder bone across the back to the outer edge of the other.',
      tip: 'Follow the natural curve of your upper back and shoulders.',
      diagramSvg: (
        <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#D4AF37] stroke-[1.5] fill-none">
          <path d="M10,35 Q50,25 90,35" className="stroke-white/10" />
          <path d="M10,35 Q50,25 90,35" className="stroke-[#D4AF37] stroke-[2.5]" />
          <circle cx="10" cy="35" r="3.5" className="fill-[#D4AF37]" />
          <circle cx="90" cy="35" r="3.5" className="fill-[#D4AF37]" />
          <line x1="10" y1="35" x2="10" y2="45" className="stroke-[#D4AF37] stroke-dasharray-[2,2]" />
          <line x1="90" y1="35" x2="90" y2="45" className="stroke-[#D4AF37] stroke-dasharray-[2,2]" />
        </svg>
      )
    },
    {
      name: 'Neck Depths',
      description: 'Measure diagonally from the inner collarbone/shoulder point down to the deepest part of the front or back neck layout.',
      tip: 'Usually 7-8 inches for standard blouses, deeper (9-11 inches) for deep bespoke necklines.',
      diagramSvg: (
        <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#D4AF37] stroke-[1.5] fill-none">
          <path d="M25,20 Q50,20 75,20" className="stroke-white/10" />
          <path d="M25,20 Q50,65 75,20" className="stroke-[#D4AF37] stroke-[2.5]" />
          <line x1="25" y1="20" x2="50" y2="65" className="stroke-[#D4AF37] stroke-dasharray-[2,2]" />
          <circle cx="25" cy="20" r="3" className="fill-white" />
          <circle cx="50" cy="65" r="3" className="fill-[#D4AF37]" />
        </svg>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0A0A0A] border border-[#D4AF37]/30 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 blur-3xl pointer-events-none rounded-full"></div>

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
              <Ruler size={18} />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-white tracking-wide">Measurement Sizing Guide</h3>
              <p className="text-[10px] text-[#D4AF37] font-mono tracking-widest uppercase font-bold">Deeprastore Atelier Standards ({unit})</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#D4AF37] transition-all text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-4 flex gap-3 items-start leading-relaxed">
            <Info size={16} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-300">
              <strong className="text-white block font-display mb-0.5">Bespoke Fit Promise:</strong>
              We recommend measuring over well-fitting undergarments rather than loose outerwear. Use a flexible measuring tape and keep it level to the ground.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {points.map((pt, idx) => (
              <div 
                key={idx} 
                className="bg-[#111111] border border-white/5 rounded-2xl p-5 flex gap-5 items-start group hover:border-[#D4AF37]/30 transition-all"
              >
                {/* Vector Diagram */}
                <div className="w-24 h-24 bg-black rounded-xl p-2 border border-white/10 flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:border-[#D4AF37]/20 transition-all">
                  {pt.diagramSvg}
                  <span className="absolute bottom-1 right-2 font-mono text-[9px] text-[#D4AF37] opacity-60">0{idx + 1}</span>
                </div>

                <div className="flex-1 space-y-2">
                  <h4 className="font-display font-bold text-white group-hover:text-[#D4AF37] transition-colors">{pt.name}</h4>
                  <p className="text-xs text-gray-400 leading-normal">{pt.description}</p>
                  <p className="text-[10px] text-gray-500 italic leading-snug">{pt.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-[#111111] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            Close Sizing Guide
          </button>
        </div>
      </motion.div>
    </div>
  );
}
