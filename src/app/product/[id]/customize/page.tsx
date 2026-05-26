"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useCartStore } from '@/store/useCartStore';
import { useStorefrontCMS } from '@/hooks/useStorefrontCMS';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, 
  Ruler, 
  ShieldCheck, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  ShoppingBag, 
  ArrowLeft, 
  Info,
  Maximize2
} from 'lucide-react';

// Steps list
const STEPS = [
  { id: 'neck', name: 'Neckline Style', description: 'Select your preferred front and back neck patterns' },
  { id: 'sleeve', name: 'Sleeve Design', description: 'Choose sleeve length and styling' },
  { id: 'closure', name: 'Padding & Opening', description: 'Select padding options and closures' },
  { id: 'measurements', name: 'Measurements', description: 'Provide precise body measurements' },
  { id: 'summary', name: 'Confirm Design', description: 'Review your personalized configuration' }
];

// Design options configuration
const NECK_OPTIONS = [
  { id: 'Round Neck', name: 'Round Neck', desc: 'Classic, versatile curved neckline suitable for all sarees.', preview: '⭕' },
  { id: 'V-Neck', name: 'V-Neck', desc: 'Elegant plunging design that creates an elongating effect.', preview: '📐' },
  { id: 'Sabyasachi Sweetheart', name: 'Sabyasachi Sweetheart', desc: 'Bespoke signature deep curved sweetheart neckline.', preview: '💖' },
  { id: 'Boat Neck', name: 'Boat Neck', desc: 'Sophisticated wide neckline grazing the collarbones.', preview: '⛵' }
];

const SLEEVE_OPTIONS = [
  { id: 'Sleeveless', name: 'Sleeveless', desc: 'Modern and chic style highlighting shoulders.', preview: '💪' },
  { id: 'Cap Sleeve', name: 'Cap Sleeve', desc: 'Delicate short coverage over the shoulder line.', preview: '👕' },
  { id: 'Elbow Sleeve', name: 'Elbow Sleeve', desc: 'Traditional mid-arm length, perfect for rich zari borders.', preview: '👚' },
  { id: 'Full Sleeve', name: 'Full Sleeve', desc: 'Graceful full-arm length for a regal and elegant silhouette.', preview: '🧥' }
];

const PADDING_OPTIONS = [
  { id: 'Padded', name: 'Padded', desc: 'Premium sewn-in cups for seamless shaping and support.' },
  { id: 'Non-Padded', name: 'Non-Padded', desc: 'Classic lightweight lining that drapes naturally.' }
];

const OPENING_OPTIONS = [
  { id: 'Back Open', name: 'Back Open', desc: 'Traditional hook and eye closure along the spine.' },
  { id: 'Side Zip', name: 'Side Zip', desc: 'Seamless back and front styling with hidden zipper.' },
  { id: 'Front Open', name: 'Front Open', desc: 'Convenient front hook and eye closure.' }
];

// Standard/Default measurements based on average sizing (in inches)
const DEFAULT_MEASUREMENTS = {
  bust: 36,
  waist: 30,
  shoulder: 14.5,
  frontNeckDepth: 7.5,
  backNeckDepth: 8,
  sleeveLength: 10,
  armHole: 16
};

type MeasurementKey = keyof typeof DEFAULT_MEASUREMENTS;

export default function CustomizeBlousePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { addItem } = useCartStore();
  const { globalSettings, loading: cmsLoading } = useStorefrontCMS('product');

  // Context loading state
  const [contextType, setContextType] = useState<'product' | 'order_item' | 'unknown'>('unknown');
  const [productData, setProductData] = useState<any>(null);
  const [orderItemData, setOrderItemData] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Wizard Flow States
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Selected Customization Values
  const [selectedNeck, setSelectedNeck] = useState('Round Neck');
  const [selectedSleeve, setSelectedSleeve] = useState('Elbow Sleeve');
  const [selectedPadding, setSelectedPadding] = useState('Padded');
  const [selectedOpening, setSelectedOpening] = useState('Back Open');
  
  // Measurements State
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');
  const [measurements, setMeasurements] = useState<Record<MeasurementKey, number>>(DEFAULT_MEASUREMENTS);
  const [notes, setNotes] = useState('');
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Saved profiles state
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [saveAsProfile, setSaveAsProfile] = useState(false);
  const [profileLabel, setProfileLabel] = useState('');

  // Fetch Saved Sizing Profiles on mount
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const { data, error } = await supabase
          .from('measurement_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) {
          setSavedProfiles(data);
        }
      } catch (err) {
        console.error('Error fetching measurement profiles:', err);
      }
    }
    fetchProfiles();
  }, []);

  // Fetch Page Context
  useEffect(() => {
    async function determineContext() {
      if (!id) return;
      try {
        // 1. Try fetching as order item
        const { data: orderItem, error: orderItemErr } = await supabase
          .from('order_items')
          .select('*, orders(notes, delivery_date)')
          .eq('id', id)
          .maybeSingle();

        if (orderItem) {
          setContextType('order_item');
          setOrderItemData(orderItem);
          
          // Also fetch product details if possible for images/descriptions
          if (orderItem.product_id) {
            const { data: prod } = await supabase
              .from('products')
              .select('*')
              .eq('id', orderItem.product_id)
              .maybeSingle();
            if (prod) {
              setProductData(prod);
            }
          }
          setPageLoading(false);
          return;
        }

        // 2. Try fetching as product
        const { data: product, error: productErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (product) {
          setContextType('product');
          setProductData(product);
          setPageLoading(false);
          return;
        }

        setContextType('unknown');
      } catch (err) {
        console.error('Error fetching context:', err);
      } finally {
        setPageLoading(false);
      }
    }
    determineContext();
  }, [id]);

  // Unit conversion helper
  const handleUnitToggle = (newUnit: 'inches' | 'cm') => {
    if (newUnit === unit) return;
    
    const scale = newUnit === 'cm' ? 2.54 : 1 / 2.54;
    const updated = { ...measurements };
    
    (Object.keys(measurements) as Array<MeasurementKey>).forEach((key) => {
      updated[key] = parseFloat((measurements[key] * scale).toFixed(1));
    });
    
    setMeasurements(updated);
    setUnit(newUnit);
  };

  const handleInputChange = (field: MeasurementKey, val: string) => {
    const numVal = parseFloat(val);
    setMeasurements(prev => ({
      ...prev,
      [field]: isNaN(numVal) ? 0 : numVal
    }));
  };

  // Submission handler
  const handleSaveCustomization = async () => {
    setIsSubmitting(true);
    try {
      let profileId = null;
      if (saveAsProfile) {
        const { data: profData, error: profErr } = await supabase
          .from('measurement_profiles')
          .insert([
            {
              profile_label: profileLabel || 'Bespoke Fit Profile',
              bust: measurements.bust,
              waist: measurements.waist,
              shoulder: measurements.shoulder,
              front_neck_depth: measurements.frontNeckDepth,
              back_neck_depth: measurements.backNeckDepth,
              sleeve_length: measurements.sleeveLength,
              sleeve_round: measurements.armHole,
              unit: unit
            }
          ])
          .select()
          .single();

        if (profErr) {
          console.error("Failed to save sizing profile:", profErr.message);
        } else if (profData) {
          profileId = profData.id;
          setSavedProfiles(prev => [profData, ...prev]);
        }
      }

      const payload = {
        blouse_style: `${selectedNeck} - ${selectedSleeve}`,
        sleeve_length: selectedSleeve,
        neck_design_front: selectedNeck,
        neck_design_back: `${selectedNeck} (Back Open/Zip: ${selectedOpening})`,
        measurements: {
          ...measurements,
          unit
        },
        notes: `Padding: ${selectedPadding}. Opening: ${selectedOpening}. Notes: ${notes}`,
        profile_id: profileId,
        created_at: new Date().toISOString()
      };

      if (contextType === 'order_item' && orderItemData) {
        // Insert into database linked to order_item_id
        const { data, error } = await supabase
          .from('stitching_customizations')
          .insert([
            {
              order_item_id: orderItemData.id,
              ...payload
            }
          ])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setSubmissionId(data.id);
        }
      } else {
        // Product customization: Save to local storage for cart use
        localStorage.setItem(`customization_${productData?.id || id}`, JSON.stringify(payload));
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Failed to save customization:', err);
      alert(`Error saving customization: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add to cart with custom options (if product context)
  const handleAddToCartWithCustomization = () => {
    if (!productData) return;
    
    // Stitching adds 1500 to the base price
    const finalPrice = productData.price + 1500;
    const mainImage = productData.images?.[0] || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600';
    
    addItem({
      id: `${productData.id}-customized`,
      name: `${productData.title} (Bespoke Tailored)`,
      price: finalPrice,
      qty: 1,
      img: mainImage
    });
    
    router.push('/collections');
  };

  if (pageLoading || cmsLoading) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-display font-medium text-[#D4AF37]/80 tracking-widest text-sm uppercase">Loading custom tailor shop...</p>
        </div>
      </main>
    );
  }

  // Header display variables
  const title = contextType === 'order_item' 
    ? `Tailor Blouse for Order Item` 
    : (productData ? `Customize ${productData.title}` : 'Bespoke Blouse Customizer');

  const subtitle = contextType === 'order_item' 
    ? `Order ID: ${orderItemData.order_id.slice(0, 8)}...` 
    : (productData ? `SKU: ${productData.sku}` : 'Deeprastore Luxury Atelier');

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-gray-100 flex flex-col selection:bg-[#D4AF37]/30 selection:text-white">
      <Navbar globalSettings={globalSettings} />
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Left Side: Step Progress & Workspace */}
        <div className="flex-1 w-full flex flex-col gap-8">
          
          {/* Top Breadcrumb & Product info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()} 
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-[#D4AF37] transition-all text-[#D4AF37]"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-wide">{title}</h1>
                <p className="text-xs text-gray-400 font-mono tracking-widest uppercase mt-1">{subtitle}</p>
              </div>
            </div>

            {/* Quick Summary Badge */}
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 font-medium">
                Style: <strong className="text-[#D4AF37]">{selectedNeck}</strong>
              </span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 font-medium">
                Sleeve: <strong className="text-[#D4AF37]">{selectedSleeve}</strong>
              </span>
            </div>
          </div>

          {!isSuccess ? (
            <>
              {/* Wizard Steps Navigation */}
              <div className="hidden md:grid grid-cols-5 gap-3 bg-white/[0.02] p-2 border border-white/5 rounded-2xl">
                {STEPS.map((step, idx) => {
                  const isActive = idx === currentStepIdx;
                  const isCompleted = idx < currentStepIdx;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStepIdx(idx)}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl transition-all text-left ${
                        isActive 
                          ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-white' 
                          : isCompleted 
                            ? 'text-gray-300 border border-transparent hover:bg-white/5' 
                            : 'text-gray-500 border border-transparent'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-mono tracking-widest font-bold">Step 0{idx + 1}</span>
                      <span className="text-xs font-bold font-display truncate w-full flex items-center gap-1.5">
                        {step.name}
                        {isCompleted && <Check size={12} className="text-[#D4AF37]" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Step indicator */}
              <div className="md:hidden flex justify-between items-center bg-white/5 p-4 border border-white/10 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] font-bold">Step {currentStepIdx + 1} of 5</span>
                  <h3 className="font-display font-bold text-white text-sm">{STEPS[currentStepIdx].name}</h3>
                </div>
                <p className="text-xs text-gray-400 italic">{STEPS[currentStepIdx].description}</p>
              </div>

              {/* Panel Container (Framer Motion) */}
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 sm:p-8 min-h-[380px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-3xl pointer-events-none rounded-full"></div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStepIdx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 flex flex-col"
                  >
                    
                    {/* STEP 1: Neck Style selection */}
                    {currentStepIdx === 0 && (
                      <div className="flex flex-col gap-6">
                        <div>
                          <h2 className="text-xl font-display font-bold text-[#D4AF37] flex items-center gap-2">
                            <Scissors size={20} />
                            Choose Neck Pattern
                          </h2>
                          <p className="text-sm text-gray-400 mt-1">Select the designer layout for your blouse neck profile.</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {NECK_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setSelectedNeck(opt.id)}
                              className={`p-5 rounded-2xl border text-left transition-all relative flex gap-4 items-start cursor-pointer group ${
                                selectedNeck === opt.id 
                                  ? 'bg-[#D4AF37]/5 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5' 
                                  : 'bg-white/[0.02] border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
                              }`}
                            >
                              <div className="text-3xl p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-[#D4AF37]/30 transition-colors">
                                {opt.preview}
                              </div>
                              <div>
                                <h4 className="font-bold text-white group-hover:text-[#D4AF37] transition-colors">{opt.name}</h4>
                                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{opt.desc}</p>
                              </div>
                              {selectedNeck === opt.id && (
                                <div className="absolute top-3 right-3 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#0A0A0A]">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STEP 2: Sleeve Style selection */}
                    {currentStepIdx === 1 && (
                      <div className="flex flex-col gap-6">
                        <div>
                          <h2 className="text-xl font-display font-bold text-[#D4AF37] flex items-center gap-2">
                            <Sparkles size={20} />
                            Select Sleeve Styles
                          </h2>
                          <p className="text-sm text-gray-400 mt-1">Pick the sleeve profile and drape that complements the design.</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {SLEEVE_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setSelectedSleeve(opt.id)}
                              className={`p-5 rounded-2xl border text-left transition-all relative flex gap-4 items-start cursor-pointer group ${
                                selectedSleeve === opt.id 
                                  ? 'bg-[#D4AF37]/5 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5' 
                                  : 'bg-white/[0.02] border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
                              }`}
                            >
                              <div className="text-3xl p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-[#D4AF37]/30 transition-colors">
                                {opt.preview}
                              </div>
                              <div>
                                <h4 className="font-bold text-white group-hover:text-[#D4AF37] transition-colors">{opt.name}</h4>
                                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{opt.desc}</p>
                              </div>
                              {selectedSleeve === opt.id && (
                                <div className="absolute top-3 right-3 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center text-[#0A0A0A]">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STEP 3: Padding & Opening */}
                    {currentStepIdx === 2 && (
                      <div className="flex flex-col gap-8">
                        <div>
                          <h2 className="text-xl font-display font-bold text-[#D4AF37] flex items-center gap-2">
                            <Maximize2 size={20} />
                            Padding & Opening Configuration
                          </h2>
                          <p className="text-sm text-gray-400 mt-1">Configure internal padding preferences and external closure placements.</p>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <span className="block text-xs font-mono uppercase tracking-widest text-gray-400 mb-3 font-bold">Padding Options</span>
                            <div className="grid sm:grid-cols-2 gap-4">
                              {PADDING_OPTIONS.map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => setSelectedPadding(opt.id)}
                                  className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                    selectedPadding === opt.id 
                                      ? 'bg-[#D4AF37]/5 border-[#D4AF37]' 
                                      : 'bg-white/[0.01] border-white/5 hover:border-white/20'
                                  }`}
                                >
                                  <div>
                                    <h4 className="font-bold text-sm text-white">{opt.name}</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                                  </div>
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                    selectedPadding === opt.id ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-white/30'
                                  }`}>
                                    {selectedPadding === opt.id && <Check size={10} className="text-[#0A0A0A]" strokeWidth={4} />}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="block text-xs font-mono uppercase tracking-widest text-gray-400 mb-3 font-bold">Opening / Closure Options</span>
                            <div className="grid sm:grid-cols-3 gap-4">
                              {OPENING_OPTIONS.map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => setSelectedOpening(opt.id)}
                                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-4 cursor-pointer ${
                                    selectedOpening === opt.id 
                                      ? 'bg-[#D4AF37]/5 border-[#D4AF37]' 
                                      : 'bg-white/[0.01] border-white/5 hover:border-white/20'
                                  }`}
                                >
                                  <div className="flex justify-between w-full items-start">
                                    <h4 className="font-bold text-sm text-white">{opt.name}</h4>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      selectedOpening === opt.id ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-white/30'
                                    }`}>
                                      {selectedOpening === opt.id && <Check size={8} className="text-[#0A0A0A]" strokeWidth={4} />}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-400 leading-snug">{opt.desc}</p>
                                </button>
                              ))}
                            </div>
                        </div>
                      </div>
                    </div>
                  )}

                    {/* STEP 4: Measurements Grid */}
                    {currentStepIdx === 3 && (
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h2 className="text-xl font-display font-bold text-[#D4AF37] flex items-center gap-2">
                              <Ruler size={20} />
                              Body Measurements
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">Provide your measurements. Use your best fitting blouse as a guide.</p>
                          </div>
                          
                          {/* Unit Swapper */}
                          <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                            <button
                              onClick={() => handleUnitToggle('inches')}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wider ${
                                unit === 'inches' ? 'bg-[#D4AF37] text-[#0A0A0A]' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Inches
                            </button>
                            <button
                              onClick={() => handleUnitToggle('cm')}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wider ${
                                unit === 'cm' ? 'bg-[#D4AF37] text-[#0A0A0A]' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              cm
                            </button>
                          </div>
                        </div>

                        {/* Saved Profile Loader */}
                        {savedProfiles.length > 0 && (
                          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <span className="block text-xs font-bold text-white">Load Saved Sizing Profile</span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">Quick-load previously verified measurements.</span>
                            </div>
                            <select
                              value={selectedProfileId}
                              onChange={(e) => {
                                const profId = e.target.value;
                                setSelectedProfileId(profId);
                                const selected = savedProfiles.find(p => p.id === profId);
                                if (selected) {
                                  setMeasurements({
                                    bust: Number(selected.bust) || DEFAULT_MEASUREMENTS.bust,
                                    waist: Number(selected.waist) || DEFAULT_MEASUREMENTS.waist,
                                    shoulder: Number(selected.shoulder) || DEFAULT_MEASUREMENTS.shoulder,
                                    frontNeckDepth: Number(selected.front_neck_depth) || DEFAULT_MEASUREMENTS.frontNeckDepth,
                                    backNeckDepth: Number(selected.back_neck_depth) || DEFAULT_MEASUREMENTS.backNeckDepth,
                                    sleeveLength: Number(selected.sleeve_length) || DEFAULT_MEASUREMENTS.sleeveLength,
                                    armHole: Number(selected.sleeve_round) || DEFAULT_MEASUREMENTS.armHole,
                                  });
                                  setUnit(selected.unit || 'inches');
                                }
                              }}
                              className="bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#D4AF37]"
                            >
                              <option value="">-- Select Profile --</option>
                              {savedProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.profile_label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Measurement Inputs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-white/[0.01] p-5 rounded-2xl border border-white/5">
                          {(Object.keys(measurements) as Array<MeasurementKey>).map((key) => {
                            const labelMap: Record<MeasurementKey, string> = {
                              bust: 'Bust / Chest',
                              waist: 'Waist Size',
                              shoulder: 'Shoulder Width',
                              frontNeckDepth: 'Front Neck Depth',
                              backNeckDepth: 'Back Neck Depth',
                              sleeveLength: 'Sleeve Length',
                              armHole: 'Arm Hole circumference'
                            };
                            return (
                              <div key={key} className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold flex items-center gap-1">
                                  {labelMap[key]}
                                  <span className="text-white/50 lowercase">({unit})</span>
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={measurements[key]}
                                  onChange={(e) => handleInputChange(key, e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#D4AF37] focus:outline-none rounded-xl px-4 py-3 text-white text-sm font-semibold transition-all font-mono"
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Save as New Profile Toggle */}
                        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-300">
                            <input
                              type="checkbox"
                              checked={saveAsProfile}
                              onChange={(e) => setSaveAsProfile(e.target.checked)}
                              className="accent-[#D4AF37] w-4 h-4"
                            />
                            <span>Save these measurements as a reusable profile</span>
                          </label>
                          {saveAsProfile && (
                            <div className="flex flex-col gap-2 mt-1">
                              <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">Profile Label Name</label>
                              <input
                                type="text"
                                value={profileLabel}
                                onChange={(e) => setProfileLabel(e.target.value)}
                                placeholder="e.g. Bridal Trousseau Sizing, Sister Fit"
                                className="bg-[#1A1A1A] border border-white/10 focus:border-[#D4AF37] focus:outline-none rounded-lg px-3 py-2 text-xs text-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* STEP 5: Summary & Submit */}
                    {currentStepIdx === 4 && (
                      <div className="flex flex-col gap-6">
                        <div>
                          <h2 className="text-xl font-display font-bold text-[#D4AF37] flex items-center gap-2">
                            <Check size={20} />
                            Confirm Customizations
                          </h2>
                          <p className="text-sm text-gray-400 mt-1">Review the configurations created by you before locking them in.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 bg-white/[0.01] p-6 rounded-2xl border border-white/5">
                          <div className="space-y-4">
                            <h4 className="text-xs uppercase font-mono tracking-widest text-[#D4AF37] border-b border-white/5 pb-2 font-bold">Selected Styles</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-gray-400">Neckline Style:</span><span className="font-bold text-white">{selectedNeck}</span></div>
                              <div className="flex justify-between"><span className="text-gray-400">Sleeve Profile:</span><span className="font-bold text-white">{selectedSleeve}</span></div>
                              <div className="flex justify-between"><span className="text-gray-400">Inner Padding:</span><span className="font-bold text-white">{selectedPadding}</span></div>
                              <div className="flex justify-between"><span className="text-gray-400">Closure Open:</span><span className="font-bold text-white">{selectedOpening}</span></div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-xs uppercase font-mono tracking-widest text-[#D4AF37] border-b border-white/5 pb-2 font-bold">Measurements ({unit})</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div>Bust: <strong className="text-white">{measurements.bust}</strong></div>
                              <div>Waist: <strong className="text-white">{measurements.waist}</strong></div>
                              <div>Shoulder: <strong className="text-white">{measurements.shoulder}</strong></div>
                              <div>Front Neck: <strong className="text-white">{measurements.frontNeckDepth}</strong></div>
                              <div>Back Neck: <strong className="text-white">{measurements.backNeckDepth}</strong></div>
                              <div>Sleeve L: <strong className="text-white">{measurements.sleeveLength}</strong></div>
                              <div>Arm Hole: <strong className="text-white">{measurements.armHole}</strong></div>
                            </div>
                          </div>
                        </div>

                        {/* Extra Instructions */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs uppercase font-mono tracking-widest text-gray-400 font-bold">Add Additional Styling Notes (Optional)</label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="E.g., front closure hook styling preference, contrast thread highlight details..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#D4AF37] focus:outline-none rounded-xl p-4 text-white text-sm leading-relaxed"
                          />
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons inside Panel */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                  <button
                    onClick={() => setCurrentStepIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentStepIdx === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:border-white/30 transition-all text-sm font-semibold"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>

                  {currentStepIdx < STEPS.length - 1 ? (
                    <button
                      onClick={() => setCurrentStepIdx(prev => Math.min(STEPS.length - 1, prev + 1))}
                      className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#D4AF37]/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Continue
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveCustomization}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90 disabled:bg-[#D4AF37]/50 disabled:pointer-events-none px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#D4AF37]/20 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer text-sm"
                    >
                      {isSubmitting ? 'Saving Customization...' : 'Lock and Save Specifications'}
                      <Sparkles size={16} />
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Success State screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111111] border border-[#D4AF37]/30 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-6 shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-3xl pointer-events-none rounded-full"></div>
              
              <div className="w-20 h-20 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center border border-[#D4AF37]/30">
                <Check size={36} strokeWidth={2.5} />
              </div>

              <div>
                <h2 className="text-3xl font-display font-bold text-white">Specifications Confirmed!</h2>
                <p className="text-gray-400 mt-2 text-sm max-w-md mx-auto leading-relaxed">
                  Your customization and measurement details have been successfully mapped to your profile.
                </p>
              </div>

              {contextType === 'order_item' ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-md text-left text-xs font-mono space-y-2 mt-2">
                  <div className="text-[#D4AF37] font-bold uppercase tracking-wider border-b border-white/5 pb-2 mb-2 font-display">Customization details</div>
                  <div className="flex justify-between"><span>Customization ID:</span><span className="text-white select-all">{submissionId}</span></div>
                  <div className="flex justify-between"><span>Blouse Style:</span><span className="text-white">{selectedNeck} - {selectedSleeve}</span></div>
                  <div className="flex justify-between"><span>Unit:</span><span className="text-white">{unit}</span></div>
                </div>
              ) : (
                <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-4 w-full max-w-md text-left text-xs space-y-2 mt-2 leading-relaxed text-gray-300">
                  <strong className="text-white block font-display mb-1">Local Config Saved:</strong>
                  Your style preference is now saved. Proceed to add this item to your cart. Stitching fee will be calculated at checkout.
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full max-w-md">
                {contextType === 'product' ? (
                  <button
                    onClick={handleAddToCartWithCustomization}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90 px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-[#D4AF37]/15 hover:scale-[1.02]"
                  >
                    <ShoppingBag size={18} />
                    Add to Cart (+ ₹1,500)
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/account')}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 text-white px-6 py-4 rounded-xl font-bold transition-all hover:scale-[1.02]"
                  >
                    Go to Dashboard
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setCurrentStepIdx(0);
                  }}
                  className="px-6 py-4 rounded-xl border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all text-sm font-semibold"
                >
                  Edit Options
                </button>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Side: Product Details & Fit Guarantee Card */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6 lg:sticky lg:top-28">
          
          {/* Product Preview Card */}
          {productData && (
            <div className="bg-[#111111] border border-white/10 rounded-3xl overflow-hidden p-4 flex flex-col gap-4">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/5 border border-white/5">
                <img 
                  src={productData.images?.[0] || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600'} 
                  alt={productData.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] font-bold">Customizable Masterpiece</span>
                  <h3 className="font-display font-bold text-white text-lg mt-1 line-clamp-1">{productData.title}</h3>
                </div>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-gray-400 text-sm">Base Price</span>
                <span className="text-white font-bold font-mono">₹{productData.price?.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Fit Guarantee Trust Card */}
          <div className="bg-gradient-to-br from-[#161616] to-[#0D0D0D] border border-[#D4AF37]/30 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 blur-2xl pointer-events-none rounded-full"></div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-base">Perfect Fit Guarantee</h3>
                <p className="text-[10px] text-[#D4AF37] font-mono tracking-widest uppercase font-bold">Deeprastore Boutique Policy</p>
              </div>
            </div>

            <p className="text-gray-300 text-xs leading-relaxed mb-4">
              Our master drapers and tailors ensure every piece is sculpted to perfection. Under our exclusive boutique policy:
            </p>

            <div className="space-y-3 border-t border-white/5 pt-4">
              <div className="flex gap-3">
                <div className="w-4 h-4 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Check size={10} strokeWidth={3} />
                </div>
                <p className="text-xs text-gray-300">
                  <strong className="text-white">Free Alterations</strong> within 2 months of delivery.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-4 h-4 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Check size={10} strokeWidth={3} />
                </div>
                <p className="text-xs text-gray-300">
                  <strong className="text-white">Dedicated Stylist support</strong> for sizing validation over WhatsApp.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-4 h-4 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Check size={10} strokeWidth={3} />
                </div>
                <p className="text-xs text-gray-300">
                  <strong className="text-white">Easy adjustments</strong> via courier at no extra tailoring cost.
                </p>
              </div>
            </div>
            
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex gap-2.5 items-start mt-5">
              <Info size={14} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-gray-400 leading-normal">
                Measurements can be updated before stitching begins. Contact our support team if you make a mistake.
              </p>
            </div>
          </div>

        </div>

      </div>

      <Footer globalSettings={globalSettings} />
      <CartDrawer />
    </main>
  );
}
