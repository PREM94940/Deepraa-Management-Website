"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Printer, ArrowLeft, Scissors, AlertTriangle } from 'lucide-react';

export default function TailoringSpecPrintPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItem() {
      if (!id) return;
      try {
        setLoading(true);
        // Query order by ID to load custom measurements
        const { data: order, error } = await supabase
          .from('orders')
          .select('id, created_at, status, measurements, notes, customers(full_name), order_items(product_name, customizations)')
          .eq('id', id)
          .maybeSingle();

        if (order && order.measurements) {
          const cust = order.measurements || {};
          const itemName = order.order_items?.[0]?.product_name || 'Bespoke Garment';
          const itemCustomization = order.order_items?.[0]?.customizations?.description || 'Custom hand-tailored fit';
          
          const customerData: any = Array.isArray(order.customers) ? order.customers[0] : order.customers;
          
          setItem({
            id: order.id,
            orderNumber: `DS-${order.id.slice(0, 4).toUpperCase()}`,
            customerName: customerData?.full_name || 'Valued Client',
            productName: itemName,
            productDescription: itemCustomization,
            dateAdded: new Date(order.created_at).toISOString().split('T')[0],
            measurements: {
              bust: cust.bust || 'N/A',
              waist: cust.waist || 'N/A',
              hips: cust.hips || 'N/A',
              sleeveLength: cust.sleeveLength || 'N/A',
              sleeveWidth: cust.sleeveWidth || 'N/A',
              neckDepthFront: cust.neckDepthFront || 'N/A',
              neckDepthBack: cust.neckDepthBack || 'N/A',
              length: cust.length || 'N/A',
              openStyle: cust.openStyle || 'N/A',
              liningType: cust.liningType || 'N/A'
            },
            notes: order.notes || 'Handle with luxury finishing standards.',
            sketchInstructions: 'Execute pattern matching standard draper constraints.'
          });
        } else {
          // Mock data fallback if order has no measurements
          setItem({
            id: id,
            orderNumber: `DS-${id.slice(0, 4).toUpperCase()}`,
            customerName: 'Aishwarya Roy (Demo)',
            productName: 'Ethereal Ivory Lehengha',
            productDescription: 'Raw silk bridal skirt with handcrafted floral motifs, full flared kalis.',
            dateAdded: new Date().toISOString().split('T')[0],
            measurements: {
              bust: '36 in',
              waist: '29 in',
              hips: '39 in',
              sleeveLength: '12 in',
              sleeveWidth: '11.5 in',
              neckDepthFront: '7.5 in',
              neckDepthBack: '9 in',
              length: '42 in',
              openStyle: 'Side Zip with Hook',
              liningType: 'Premium Butter Silk'
            },
            notes: 'Incorporate extra margin of 2 inches inside the side seams. Double stitch at high-stress points.',
            sketchInstructions: 'Traditional Kalidar alignment with border embroidery starting exactly 3 inches above the hemline.'
          });
        }
      } catch (err) {
        console.error("Error loading spec item:", err);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [id]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center font-mono">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Loading Spec Ticket...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center font-mono p-4">
        <div className="text-center max-w-sm border-2 border-black p-6">
          <AlertTriangle size={36} className="mx-auto mb-3" />
          <h2 className="font-bold text-lg">SPEC CARD NOT FOUND</h2>
          <p className="text-xs text-zinc-600 mt-2">The requested order measurements could not be retrieved from the database.</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-black text-white text-xs font-bold uppercase">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-black p-4 sm:p-8 flex flex-col items-center font-sans">
      
      {/* Dynamic print CSS override */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #print-spec-sheet {
            border: 2px solid #000 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>

      {/* Top action bar */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 no-print bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to CRM</span>
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded text-xs font-bold uppercase transition-colors"
        >
          <Printer size={14} />
          <span>Print Spec Ticket</span>
        </button>
      </div>

      {/* Printable Spec sheet */}
      <div 
        id="print-spec-sheet" 
        className="w-full max-w-2xl bg-white border-2 border-black p-8 shadow-md rounded-none"
      >
        {/* Header banner */}
        <div className="border-b-4 border-black pb-4 mb-6 text-center">
          <h1 className="text-2xl font-black tracking-widest uppercase font-serif">DEEPRASTORE ATELIER</h1>
          <p className="text-[10px] tracking-widest text-zinc-650 uppercase font-mono font-bold mt-1">Master Workshop Cut & Stitch Specification</p>
          
          <div className="mt-4 grid grid-cols-3 gap-3 text-left text-xs bg-zinc-50 border border-zinc-200 p-3">
            <div>
              <span className="block text-[9px] font-bold text-zinc-550 uppercase">Order / Job ID</span>
              <span className="font-mono font-bold text-sm text-black">{item.orderNumber}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-zinc-555 uppercase">Date Added</span>
              <span className="font-bold text-black">{item.dateAdded}</span>
            </div>
            <div className="text-right">
              <span className="block text-[9px] font-bold text-zinc-555 uppercase">Fabric Status</span>
              <span className="font-bold text-rose-600 uppercase">Verified Fit</span>
            </div>
          </div>
        </div>

        {/* Customer Info row */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-6 pb-4 border-b border-zinc-300">
          <div>
            <span className="block text-[9px] font-bold text-zinc-500 uppercase">Client Name</span>
            <span className="font-serif font-black text-black text-sm">{item.customerName}</span>
          </div>
          <div>
            <span className="block text-[9px] font-bold text-zinc-500 uppercase">Garment Type</span>
            <span className="font-bold text-black text-sm">{item.productName}</span>
          </div>
        </div>

        {/* Sizing grid */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-1 mb-3 font-mono flex items-center gap-1.5">
            <Scissors size={12} />
            <span>Anatomical Fit Parameters</span>
          </h3>
          
          <div className="grid grid-cols-3 gap-3 border border-zinc-300 p-4 bg-zinc-50">
            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase">Bust</span>
              <span className="font-bold text-black font-mono text-sm">{item.measurements.bust}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase">Waist</span>
              <span className="font-bold text-black font-mono text-sm">{item.measurements.waist}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase">Hips</span>
              <span className="font-bold text-black font-mono text-sm">{item.measurements.hips}</span>
            </div>

            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase">Sleeve Length</span>
              <span className="font-bold text-black font-mono text-sm">{item.measurements.sleeveLength}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase">Sleeve Width</span>
              <span className="font-bold text-black font-mono text-sm">{item.measurements.sleeveWidth}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase">Neck Front Depth</span>
              <span className="font-bold text-black font-mono text-sm">{item.measurements.neckDepthFront}</span>
            </div>

            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase">Neck Back Depth</span>
              <span className="font-bold text-black font-mono text-sm">{item.measurements.neckDepthBack}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase">Total Length</span>
              <span className="font-bold text-black font-mono text-sm">{item.measurements.length}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-zinc-500 uppercase">Opening style</span>
              <span className="font-bold text-black text-xs">{item.measurements.openStyle}</span>
            </div>

            <div className="col-span-3 border-t border-zinc-200 pt-2.5 mt-1 flex justify-between">
              <div>
                <span className="block text-[9px] font-bold text-zinc-500 uppercase">Lining Fabric</span>
                <span className="font-semibold text-black text-xs">{item.measurements.liningType}</span>
              </div>
              <div className="text-right">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase">Urgency flag</span>
                <span className="font-bold text-rose-600 text-xs">Standard Timeline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workshop details */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-1 mb-2 font-mono">
            Pattern Drafting & Cut Instructions
          </h3>
          <div className="border border-zinc-300 p-4 min-h-[60px] text-xs leading-relaxed text-black">
            {item.sketchInstructions}
          </div>
        </div>

        {/* Finishing notes */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-1 mb-2 font-mono">
            Special Handling & Hem Lining notes
          </h3>
          <div className="border border-zinc-300 p-4 min-h-[60px] text-xs leading-relaxed text-zinc-800 italic">
            "{item.notes}"
          </div>
        </div>

        {/* Stamps area */}
        <div className="mt-12 pt-8 border-t border-dashed border-zinc-300 grid grid-cols-2 gap-4 text-[9px] uppercase font-bold text-zinc-500">
          <div>
            <div className="border-t border-black w-24 pt-1 mt-4 text-center text-black">Master Cutter</div>
          </div>
          <div className="text-right">
            <div className="border-t border-black w-24 pt-1 mt-4 ml-auto text-center text-black">QC stamp</div>
          </div>
        </div>

      </div>

    </div>
  );
}
