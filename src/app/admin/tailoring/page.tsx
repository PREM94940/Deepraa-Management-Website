"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  Scissors, 
  Layers, 
  Sparkles, 
  CheckCircle, 
  Printer, 
  User, 
  Calendar, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertTriangle,
  ChevronDown,
  X,
  FileText,
  Bookmark,
  TrendingUp,
  Clock,
  Compass
} from 'lucide-react';

// Status stages
type Stage = 'Cutting' | 'Stitching' | 'Embroidery' | 'QC';

interface TailoringItem {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  productDescription: string;
  stage: Stage;
  dateAdded: string;
  targetDays: number;
  assignedStaffId: string;
  assignedStaffName: string;
  measurements: {
    bust: string;
    waist: string;
    hips: string;
    sleeveLength: string;
    sleeveWidth: string;
    neckDepthFront: string;
    neckDepthBack: string;
    length: string;
    openStyle: string;
    liningType: string;
  };
  notes: string;
  sketchInstructions: string;
}

// Mock staff directory (Tailors and Masters)
const DEFAULT_STAFF = [
  { id: 'st-01', name: 'Master Ramesh', role: 'Master Cutter' },
  { id: 'st-02', name: 'Altaf Bhai', role: 'Lead Tailor' },
  { id: 'st-03', name: 'Guru Singh', role: 'Embroidery Specialist' },
  { id: 'st-04', name: 'Sunita Devi', role: 'QC inspector & Stitching' },
  { id: 'st-05', name: 'Manoj Kumar', role: 'Stitching Hand' },
];

const INITIAL_MOCK_ITEMS: TailoringItem[] = [
  {
    id: 't-101',
    orderNumber: 'DS-9821',
    customerName: 'Aishwarya Roy',
    productName: 'Ethereal Ivory Lehengha',
    productDescription: 'Raw silk bridal skirt with handcrafted floral motifs, full flared kalis.',
    stage: 'Cutting',
    dateAdded: '2026-05-25',
    targetDays: 4,
    assignedStaffId: 'st-01',
    assignedStaffName: 'Master Ramesh',
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
  },
  {
    id: 't-102',
    orderNumber: 'DS-9824',
    customerName: 'Meera Deshmukh',
    productName: 'Crimson Zardozi Sherwani',
    productDescription: 'Royal handloom velvet jacket with intricate gold wire embroidery.',
    stage: 'Stitching',
    dateAdded: '2026-05-24',
    targetDays: 6,
    assignedStaffId: 'st-02',
    assignedStaffName: 'Altaf Bhai',
    measurements: {
      bust: '40 in',
      waist: '35 in',
      hips: '42 in',
      sleeveLength: '24 in',
      sleeveWidth: '14 in',
      neckDepthFront: 'N/A',
      neckDepthBack: 'N/A',
      length: '45 in',
      openStyle: 'Center Front Concealed Buttons',
      liningType: 'Bemberg Satin'
    },
    notes: 'Padded shoulders required (medium density). Split collar style.',
    sketchInstructions: 'Ensure collar sits snugly against the neck. Symmetrical gold wire borders on the cuffs and collar.'
  },
  {
    id: 't-103',
    orderNumber: 'DS-9827',
    customerName: 'Sanjana Sen',
    productName: 'Saffron Organza Anarkali',
    productDescription: 'Gown style flared kurta with sheer sleeves and sweetheart neckline.',
    stage: 'Embroidery',
    dateAdded: '2026-05-23',
    targetDays: 2,
    assignedStaffId: 'st-03',
    assignedStaffName: 'Guru Singh',
    measurements: {
      bust: '34 in',
      waist: '27 in',
      hips: '36 in',
      sleeveLength: '22 in (Sheer)',
      sleeveWidth: '10 in',
      neckDepthFront: '8 in',
      neckDepthBack: '8.5 in',
      length: '54 in',
      openStyle: 'Back invisible zipper',
      liningType: 'Crepe'
    },
    notes: 'Gotta patti laces to be added on the border. Delicate dry clean only organza.',
    sketchInstructions: 'Miniature motif embroidery scattered throughout the upper yoke and bodice, heavier dense pattern on cuffs.'
  },
  {
    id: 't-104',
    orderNumber: 'DS-9830',
    customerName: 'Priyanka Patel',
    productName: 'Midnight Georgette Saree Blouse',
    productDescription: 'Choli style backless blouse with heavy mirror-work details.',
    stage: 'QC',
    dateAdded: '2026-05-26',
    targetDays: 1,
    assignedStaffId: 'st-04',
    assignedStaffName: 'Sunita Devi',
    measurements: {
      bust: '38 in',
      waist: '31 in',
      hips: 'N/A',
      sleeveLength: '5 in',
      sleeveWidth: '13 in',
      neckDepthFront: '7 in',
      neckDepthBack: '11 in (Backless)',
      length: '14.5 in',
      openStyle: 'Back ties (Dori) + Hook at bottom',
      liningType: 'Cotton Voile'
    },
    notes: 'Cups to be built-in. High quality golden tassels on the back ties.',
    sketchInstructions: 'Clean circular finish on the back neckline with piping. Sturdy loops for heavy dori tassels.'
  }
];

const parseVal = (str: string): number => {
  if (!str) return 0;
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

export default function TailoringCRMPage() {
  const [items, setItems] = useState<TailoringItem[]>(INITIAL_MOCK_ITEMS);
  const [staff, setStaff] = useState<any[]>(DEFAULT_STAFF);
  const [selectedItem, setSelectedItem] = useState<TailoringItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('All');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    cutting: 0,
    stitching: 0,
    embroidery: 0,
    qc: 0
  });

  // Fetch db values if possible
  useEffect(() => {
    async function loadData() {
      try {
        // Query orders & customers to build a real representation of tailoring lines if possible
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('id, created_at, measurements, notes, assigned_tailor_id, assigned_tailor_name, customers(full_name), order_items(product_name, customizations)')
          .limit(10);
        
        // Query staff if available
        const { data: dbStaff } = await supabase
          .from('staff_roles')
          .select('id, email, role');
        
        if (dbStaff && dbStaff.length > 0) {
          // Format DB staff for assignment dropdown
          const formattedStaff = dbStaff.map((s, idx) => ({
            id: s.id,
            name: s.email.split('@')[0].toUpperCase(),
            role: s.role
          }));
          setStaff([...formattedStaff, ...DEFAULT_STAFF]);
        }

        // If we got DB orders with measurements/customizations, map them or prepend them to the mock list
        if (dbOrders && dbOrders.length > 0) {
          const mappedDbItems: TailoringItem[] = dbOrders
            .filter(o => o.measurements && Object.keys(o.measurements).length > 0)
            .map((o, idx) => {
              const cust = o.measurements || {};
              const itemName = o.order_items?.[0]?.product_name || 'Custom Garment';
              const itemCustomization = o.order_items?.[0]?.customizations?.description || 'Custom tailor-made fit';
              const stages: Stage[] = ['Cutting', 'Stitching', 'Embroidery', 'QC'];
              
              const customerData: any = Array.isArray(o.customers) ? o.customers[0] : o.customers;
              return {
                id: o.id,
                orderNumber: `DS-${o.id.slice(0, 4).toUpperCase()}`,
                customerName: customerData?.full_name || 'Valued Client',
                productName: itemName,
                productDescription: itemCustomization,
                stage: stages[idx % 4],
                dateAdded: new Date(o.created_at).toISOString().split('T')[0],
                targetDays: Math.max(1, 7 - (idx % 5)),
                assignedStaffId: o.assigned_tailor_id || DEFAULT_STAFF[idx % DEFAULT_STAFF.length].id,
                assignedStaffName: o.assigned_tailor_name || DEFAULT_STAFF[idx % DEFAULT_STAFF.length].name,
                measurements: {
                  bust: cust.bust || '36 in',
                  waist: cust.waist || '30 in',
                  hips: cust.hips || '38 in',
                  sleeveLength: cust.sleeveLength || '15 in',
                  sleeveWidth: cust.sleeveWidth || '12 in',
                  neckDepthFront: cust.neckDepthFront || '7.5 in',
                  neckDepthBack: cust.neckDepthBack || '8 in',
                  length: cust.length || '40 in',
                  openStyle: cust.openStyle || 'Standard zipper',
                  liningType: cust.liningType || 'Cotton silk'
                },
                notes: o.notes || 'Handle with luxury fabrics standard.',
                sketchInstructions: 'Execute per client measurement sheet alignment.'
              };
            });

          if (mappedDbItems.length > 0) {
            // Merge & unique items
            setItems(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const filteredNew = mappedDbItems.filter(item => !existingIds.has(item.id));
              return [...filteredNew, ...prev];
            });
          }
        }
      } catch (err) {
        console.error("DB Load warning (using mock data fallback):", err);
      }
    }
    loadData();
  }, []);

  // Compute column count stats
  useEffect(() => {
    const counts = { cutting: 0, stitching: 0, embroidery: 0, qc: 0 };
    items.forEach(item => {
      if (item.stage === 'Cutting') counts.cutting++;
      if (item.stage === 'Stitching') counts.stitching++;
      if (item.stage === 'Embroidery') counts.embroidery++;
      if (item.stage === 'QC') counts.qc++;
    });
    setStats(counts);
  }, [items]);

  // Update status stage of item
  const updateStage = (itemId: string, newStage: Stage) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        // Also update local DB state in background if needed
        try {
          supabase
            .from('orders')
            .update({ status: `Tailoring: ${newStage}` })
            .eq('id', itemId)
            .then(() => {});
        } catch (_) {}
        return { ...item, stage: newStage };
      }
      return item;
    }));
  };

  // Assign staff
  const assignStaff = async (itemId: string, staffId: string) => {
    const selectedStaff = staff.find(s => s.id === staffId);
    if (!selectedStaff) return;

    // Update local state first for optimistic UI
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { 
          ...item, 
          assignedStaffId: staffId, 
          assignedStaffName: selectedStaff.name 
        };
      }
      return item;
    }));
    setActiveDropdownId(null);

    // Persist to Supabase
    try {
      await supabase
        .from('orders')
        .update({ 
          assigned_tailor_id: staffId,
          assigned_tailor_name: selectedStaff.name 
        })
        .eq('id', itemId);
    } catch (err) {
      console.error("Failed to assign staff", err);
    }
  };

  // Handle printing
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filtered list
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = filterStage === 'All' || item.stage === filterStage;
    return matchesSearch && matchesStage;
  });

  const getStageColor = (stage: Stage) => {
    switch (stage) {
      case 'Cutting': return 'border-amber-500/30 text-amber-400 bg-amber-950/20';
      case 'Stitching': return 'border-blue-500/30 text-blue-400 bg-blue-950/20';
      case 'Embroidery': return 'border-purple-500/30 text-purple-400 bg-purple-950/20';
      case 'QC': return 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20';
    }
  };

  const getStageIcon = (stage: Stage, size = 18) => {
    switch (stage) {
      case 'Cutting': return <Scissors size={size} className="text-amber-400" />;
      case 'Stitching': return <Layers size={size} className="text-blue-400" />;
      case 'Embroidery': return <Sparkles size={size} className="text-purple-400" />;
      case 'QC': return <CheckCircle size={size} className="text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 p-6 md:p-8 font-sans transition-all duration-300">
      
      {/* Dynamic Print stylesheet injection for workshop formatting */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          #print-spec-card, #print-spec-card * {
            visibility: visible;
          }
          #print-spec-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            border-radius: 0px !important;
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-zinc-800/60 no-print">
        <div>
          <div className="flex items-center gap-2 text-[#D4AF37] font-medium tracking-wider text-xs uppercase mb-1">
            <Compass size={14} /> Master Suite & Craft CRM
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white font-serif">
            Atelier & <span className="text-[#D4AF37]">Tailoring Lines</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage premium custom stitch schedules, fabric allocations, and measurements for master tailors.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-300 flex items-center gap-2">
            <Clock size={14} className="text-[#D4AF37]" />
            <span>Master Cutter Active Session</span>
          </div>
        </div>
      </div>

      {/* Counters & Analytics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 no-print">
        <div className="bg-[#121212]/90 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/30">
          <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Cutting Queue</p>
            <h3 className="text-2xl font-semibold text-white mt-1">{stats.cutting} <span className="text-xs text-zinc-400 font-normal">items</span></h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Scissors size={20} className="text-amber-400" />
          </div>
        </div>

        <div className="bg-[#121212]/90 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/30">
          <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Stitching Room</p>
            <h3 className="text-2xl font-semibold text-white mt-1">{stats.stitching} <span className="text-xs text-zinc-400 font-normal">items</span></h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Layers size={20} className="text-blue-400" />
          </div>
        </div>

        <div className="bg-[#121212]/90 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/30">
          <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Embroidery / Karigari</p>
            <h3 className="text-2xl font-semibold text-white mt-1">{stats.embroidery} <span className="text-xs text-zinc-400 font-normal">items</span></h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Sparkles size={20} className="text-purple-400" />
          </div>
        </div>

        <div className="bg-[#121212]/90 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-black/30">
          <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Quality Assurance</p>
            <h3 className="text-2xl font-semibold text-white mt-1">{stats.qc} <span className="text-xs text-zinc-400 font-normal">items</span></h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle size={20} className="text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="bg-[#111]/70 border border-zinc-850 p-4 rounded-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 no-print shadow-md">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search order number, client, garment..."
            className="w-full bg-[#1A1A1A] border border-zinc-800 focus:border-[#D4AF37]/50 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Filter size={16} />
            <span>Filter stage:</span>
          </div>
          <div className="flex bg-[#1A1A1A] border border-zinc-800 p-0.5 rounded-lg">
            {['All', 'Cutting', 'Stitching', 'Embroidery', 'QC'].map((stg) => (
              <button
                key={stg}
                onClick={() => setFilterStage(stg)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterStage === stg 
                    ? 'bg-[#D4AF37] text-black shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {stg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
        
        {/* Column Stage loop */}
        {(['Cutting', 'Stitching', 'Embroidery', 'QC'] as Stage[]).map(stage => {
          const stageItems = filteredItems.filter(item => item.stage === stage);

          return (
            <div 
              key={stage} 
              className="bg-[#0e0e0e]/85 rounded-xl border border-zinc-900 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStageIcon(stage)}
                  <span className="font-medium text-zinc-100 text-sm tracking-wide">{stage}</span>
                  <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full font-mono">
                    {stageItems.length}
                  </span>
                </div>
                
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>
              </div>

              {/* Column Cards Body */}
              <div className="p-3 flex-1 flex flex-col gap-3 overflow-y-auto">
                {stageItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 py-12 px-4 border-2 border-dashed border-zinc-900 rounded-lg">
                    <p className="text-xs text-center">No orders currently in {stage}</p>
                  </div>
                ) : (
                  stageItems.map(item => (
                    <motion.div
                      layoutId={`card-${item.id}`}
                      key={item.id}
                      className="bg-[#151515] border border-zinc-800/80 hover:border-zinc-700/80 rounded-lg p-4 shadow-md transition-all flex flex-col gap-3 group"
                    >
                      {/* Top Meta info */}
                      <div className="flex items-start justify-between">
                        <span className="text-[#D4AF37] font-mono text-xs font-semibold tracking-wider">
                          {item.orderNumber}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${getStageColor(item.stage)}`}>
                            {item.stage}
                          </span>
                          
                          {item.targetDays <= 2 && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Urgent Delivery" />
                          )}
                        </div>
                      </div>

                      {/* Customer / Garment Title */}
                      <div>
                        <h4 className="text-white text-sm font-medium tracking-wide font-serif mb-0.5">
                          {item.customerName}
                        </h4>
                        <p className="text-zinc-300 text-xs font-semibold mt-1">
                          {item.productName}
                        </p>
                        <p className="text-zinc-500 text-[11px] line-clamp-2 mt-0.5 leading-relaxed font-light">
                          {item.productDescription}
                        </p>
                      </div>

                      {(() => {
                        const bustVal = parseVal(item.measurements.bust);
                        const waistVal = parseVal(item.measurements.waist);
                        const shoulderVal = parseVal((item.measurements as any).shoulder);
                        const frontNeckVal = parseVal(item.measurements.neckDepthFront);
                        const backNeckVal = parseVal(item.measurements.neckDepthBack);

                        const isSuspicious = 
                          (bustVal > 0 && waistVal > 0 && bustVal <= waistVal) ||
                          (shoulderVal > 0 && (shoulderVal <= 8 || shoulderVal >= 22)) ||
                          (frontNeckVal > 0 && frontNeckVal >= 12) ||
                          (backNeckVal > 0 && backNeckVal >= 15);

                        if (!isSuspicious) return null;

                        return (
                          <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-2.5 flex items-start gap-2 text-[10px] text-amber-400">
                            <AlertTriangle size={14} className="flex-shrink-0 text-amber-400 mt-0.5" />
                            <div>
                              <span className="font-bold block uppercase tracking-wider text-amber-300">Suspicious Sizing Warning</span>
                              <span className="block mt-0.5 leading-relaxed text-zinc-400 font-mono">
                                {bustVal > 0 && waistVal > 0 && bustVal <= waistVal && `• Bust (${bustVal}") <= Waist (${waistVal}"). `}
                                {shoulderVal > 0 && (shoulderVal <= 8 || shoulderVal >= 22) && `• Shoulder (${shoulderVal}") out of scale. `}
                                {frontNeckVal >= 12 && `• Front Neck (${frontNeckVal}") too deep. `}
                                {backNeckVal >= 15 && `• Back Neck (${backNeckVal}") too deep. `}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Quick Details Grid */}
                      <div className="grid grid-cols-2 gap-2 py-2 border-y border-zinc-900 text-[10px] text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={10} className="text-zinc-500" />
                          <span>Added {item.dateAdded}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end font-semibold">
                          <span className={item.targetDays <= 2 ? 'text-rose-400' : 'text-amber-400'}>
                            {item.targetDays} {item.targetDays === 1 ? 'day' : 'days'} left
                          </span>
                        </div>
                      </div>

                      {/* Interactive Staff Assignment Dropdown */}
                      <div className="relative">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500">Assignee:</span>
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : item.id)}
                            className="bg-[#1F1F1F] border border-zinc-800 text-zinc-300 hover:text-white px-2 py-1 rounded flex items-center gap-1.5 text-xs transition-colors"
                          >
                            <User size={10} className="text-[#D4AF37]" />
                            <span className="max-w-[80px] truncate">{item.assignedStaffName}</span>
                            <ChevronDown size={10} className="text-zinc-500" />
                          </button>
                        </div>

                        {/* Dropdown Options */}
                        <AnimatePresence>
                          {activeDropdownId === item.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setActiveDropdownId(null)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute bottom-full right-0 mb-1 w-48 bg-[#181818] border border-zinc-800 rounded-lg shadow-xl z-20 overflow-hidden"
                              >
                                <div className="p-1.5 border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500 font-bold px-2">
                                  Workshop Directory
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                  {staff.map(person => (
                                    <button
                                      key={person.id}
                                      onClick={() => assignStaff(item.id, person.id)}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all flex flex-col border-b border-zinc-900/40 last:border-0"
                                    >
                                      <span className="font-medium text-white">{person.name}</span>
                                      <span className="text-[10px] text-zinc-500">{person.role}</span>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 text-zinc-300 hover:text-white py-1.5 rounded text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <FileText size={12} className="text-[#D4AF37]" />
                          <span>Spec Ticket</span>
                        </button>

                        <div className="flex border border-zinc-800 rounded overflow-hidden">
                          {(['Cutting', 'Stitching', 'Embroidery', 'QC'] as Stage[]).map(stageOpt => {
                            if (stageOpt === item.stage) return null;
                            return (
                              <button
                                key={stageOpt}
                                onClick={() => updateStage(item.id, stageOpt)}
                                className="p-1 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] text-zinc-500 transition-colors border-r border-zinc-800 last:border-0"
                                title={`Move to ${stageOpt}`}
                              >
                                {getStageIcon(stageOpt, 12)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SPEC TICKET GENERATOR MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121212] border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              
              {/* Modal Header */}
              <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex justify-between items-center no-print">
                <div className="flex items-center gap-2">
                  <Printer size={18} className="text-[#D4AF37]" />
                  <span className="font-medium text-white text-sm">Spec Card Generator</span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Printable Ticket Area */}
              <div className="p-6 overflow-y-auto flex-1 bg-[#121212]">
                <div 
                  id="print-spec-card" 
                  className="bg-white text-black p-6 rounded-md shadow-inner border border-zinc-200"
                >
                  {/* Ticket Header */}
                  <div className="border-b-2 border-black pb-4 mb-4 text-center">
                    <h2 className="text-xl font-bold tracking-widest uppercase font-serif">DEEPRASTORE ATELIER</h2>
                    <p className="text-[10px] tracking-wider text-zinc-500 uppercase mt-0.5">Master Tailoring Spec & Job Sheet</p>
                    
                    <div className="mt-3 grid grid-cols-3 gap-2 text-left text-xs bg-zinc-50 p-2 rounded">
                      <div>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase">Order / Job ID</span>
                        <span className="font-mono font-bold text-sm text-black">{selectedItem.orderNumber}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase">Assigned Master</span>
                        <span className="font-semibold text-black">{selectedItem.assignedStaffName}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-bold text-zinc-500 uppercase">Target Time</span>
                        <span className="font-semibold text-rose-600 font-mono">{selectedItem.targetDays} Days remaining</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Core details */}
                  <div className="grid grid-cols-2 gap-4 text-xs mb-4 pb-4 border-b border-zinc-200">
                    <div>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase">Client Name</span>
                      <span className="font-serif font-bold text-black text-sm">{selectedItem.customerName}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase">Garment Type</span>
                      <span className="font-bold text-black text-sm">{selectedItem.productName}</span>
                    </div>
                  </div>

                  {/* CUSTOMER MEASUREMENTS SECTION */}
                  <div className="mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-1 mb-2 font-serif">
                      Anatomical Fit Measurements
                    </h3>
                    <div className="grid grid-cols-3 gap-3 border border-zinc-300 p-3 rounded bg-zinc-50">
                      <div>
                        <span className="block text-[9px] font-bold text-zinc-500 uppercase">Bust</span>
                        <span className="font-bold text-black font-mono text-sm">{selectedItem.measurements.bust || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-zinc-500 uppercase">Waist</span>
                        <span className="font-bold text-black font-mono text-sm">{selectedItem.measurements.waist || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-zinc-500 uppercase">Hips</span>
                        <span className="font-bold text-black font-mono text-sm">{selectedItem.measurements.hips || 'N/A'}</span>
                      </div>

                      <div>
                        <span className="block text-[9px] font-bold text-zinc-500 uppercase">Sleeve Details</span>
                        <span className="font-medium text-black text-xs">
                          Len: {selectedItem.measurements.sleeveLength} <br />
                          Wid: {selectedItem.measurements.sleeveWidth}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-zinc-500 uppercase">Neck Depth</span>
                        <span className="font-medium text-black text-xs">
                          Front: {selectedItem.measurements.neckDepthFront} <br />
                          Back: {selectedItem.measurements.neckDepthBack}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-zinc-500 uppercase">Total Length</span>
                        <span className="font-bold text-black font-mono text-sm">{selectedItem.measurements.length || 'N/A'}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="block text-[9px] font-bold text-zinc-500 uppercase">Open Style details</span>
                        <span className="font-medium text-black text-xs">{selectedItem.measurements.openStyle || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-zinc-500 uppercase">Lining Allocation</span>
                        <span className="font-medium text-black text-xs">{selectedItem.measurements.liningType || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* WORKSHOP DETAILS / SKETCH NOTE */}
                  <div className="mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-1 mb-2 font-serif">
                      Styling & Sketch Instructions
                    </h3>
                    <div className="border border-zinc-300 p-3 rounded min-h-[60px] text-xs leading-relaxed text-black">
                      {selectedItem.sketchInstructions}
                    </div>
                  </div>

                  {/* SPECIAL INSTRUCTIONS */}
                  <div className="mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2 py-1 mb-2 font-serif">
                      Special Handling & Finishing notes
                    </h3>
                    <div className="border border-zinc-300 p-3 rounded min-h-[60px] text-xs leading-relaxed text-zinc-800 italic">
                      "{selectedItem.notes}"
                    </div>
                  </div>

                  {/* SIGNATURE / APPROVAL STAMP */}
                  <div className="mt-8 pt-8 border-t border-dashed border-zinc-300 grid grid-cols-2 gap-4 text-[10px] uppercase font-bold text-zinc-500">
                    <div>
                      <div className="border-t border-black w-24 pt-1 mt-4 text-center text-black">Master Cutter</div>
                    </div>
                    <div className="text-right">
                      <div className="border-t border-black w-24 pt-1 mt-4 ml-auto text-center text-black">Quality Passed</div>
                    </div>
                  </div>
                </div>

                {/* WHATSAPP CONCIERGE TEXT HANDOFF */}
                <div className="mt-6 border-t border-zinc-200 pt-6 no-print">
                  <h3 className="text-xs font-bold uppercase tracking-wider bg-zinc-800 text-white px-2 py-1.5 mb-2 rounded flex justify-between items-center">
                    <span>WhatsApp Handoff Concierge</span>
                  </h3>
                  <div className="bg-zinc-50 border border-zinc-200 rounded p-3 relative">
                    <pre className="text-xs leading-relaxed text-zinc-800 select-all font-sans whitespace-pre-wrap">
                      {`*DEEPRASTORE ATELIER JOB SHEET*
Order ID: ${selectedItem.orderNumber}
Client Name: ${selectedItem.customerName}
Garment: ${selectedItem.productName}
Master Assigned: ${selectedItem.assignedStaffName}

*Measurements:*
- Bust: ${selectedItem.measurements.bust}
- Waist: ${selectedItem.measurements.waist}
- Hips: ${selectedItem.measurements.hips}
- Sleeve: ${selectedItem.measurements.sleeveLength} (Width: ${selectedItem.measurements.sleeveWidth})
- Neck Depth (Front/Back): ${selectedItem.measurements.neckDepthFront} / ${selectedItem.measurements.neckDepthBack}
- Length: ${selectedItem.measurements.length}
- Open Style: ${selectedItem.measurements.openStyle}
- Lining Type: ${selectedItem.measurements.liningType}

*Special Notes:* ${selectedItem.notes}
*Instructions:* ${selectedItem.sketchInstructions}

Please proceed with cutting/stitching as scheduled.`}
                    </pre>
                    <button
                      onClick={() => {
                        const msg = `*DEEPRASTORE ATELIER JOB SHEET*
Order ID: ${selectedItem.orderNumber}
Client Name: ${selectedItem.customerName}
Garment: ${selectedItem.productName}
Master Assigned: ${selectedItem.assignedStaffName}

*Measurements:*
- Bust: ${selectedItem.measurements.bust}
- Waist: ${selectedItem.measurements.waist}
- Hips: ${selectedItem.measurements.hips}
- Sleeve: ${selectedItem.measurements.sleeveLength} (Width: ${selectedItem.measurements.sleeveWidth})
- Neck Depth (Front/Back): ${selectedItem.measurements.neckDepthFront} / ${selectedItem.measurements.neckDepthBack}
- Length: ${selectedItem.measurements.length}
- Open Style: ${selectedItem.measurements.openStyle}
- Lining Type: ${selectedItem.measurements.liningType}

*Special Notes:* ${selectedItem.notes}
*Instructions:* ${selectedItem.sketchInstructions}

Please proceed with cutting/stitching as scheduled.`;
                        navigator.clipboard.writeText(msg);
                        alert("WhatsApp Concierge text copied to clipboard!");
                      }}
                      className="mt-3 w-full py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-0"
                    >
                      Copy for WhatsApp Share
                    </button>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center no-print">
                <span className="text-xs text-zinc-400">
                  Ready to send to physical workshop printer.
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 border border-zinc-800 text-zinc-300 hover:text-white rounded text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b8952d] text-black font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Printer size={14} />
                    <span>Print Spec Card</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
