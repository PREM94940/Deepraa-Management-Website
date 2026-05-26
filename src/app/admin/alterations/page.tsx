"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Scissors, 
  Ruler, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  History, 
  Save, 
  MessageSquare,
  Bookmark,
  TrendingUp,
  Clock
} from 'lucide-react';

interface AlterationJob {
  id: string;
  order_id: string;
  complaint_details: string;
  adjustment_notes: string;
  tailor_remarks: string;
  status: string;
  created_at: string;
  orders: {
    id: string;
    notes: string;
    measurements: any;
    customers: {
      full_name: string;
    }
  };
}

export default function AlterationConsolePage() {
  const [jobs, setJobs] = useState<AlterationJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<AlterationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for selected job
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [tailorRemarks, setTailorRemarks] = useState('');
  const [status, setStatus] = useState('Requested');

  // Load alterations history
  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('alterations_history')
          .select(`
            id,
            order_id,
            complaint_details,
            adjustment_notes,
            tailor_remarks,
            status,
            created_at,
            orders (
              id,
              notes,
              measurements,
              customers (
                full_name
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setJobs(data as any[]);
          if (data.length > 0 && !selectedJob) {
            const firstJob = data[0] as any;
            setSelectedJob(firstJob);
            setAdjustmentNotes(firstJob.adjustment_notes || '');
            setTailorRemarks(firstJob.tailor_remarks || '');
            setStatus(firstJob.status || 'Requested');
          }
        }
      } catch (err) {
        console.error("Failed to load alterations history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const handleSelectJob = (job: AlterationJob) => {
    setSelectedJob(job);
    setAdjustmentNotes(job.adjustment_notes || '');
    setTailorRemarks(job.tailor_remarks || '');
    setStatus(job.status || 'Requested');
  };

  const handleSaveAlteration = async () => {
    if (!selectedJob) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('alterations_history')
        .update({
          adjustment_notes: adjustmentNotes,
          tailor_remarks: tailorRemarks,
          status: status
        })
        .eq('id', selectedJob.id);

      if (error) throw error;

      // Update local state
      setJobs(prev => prev.map(j => {
        if (j.id === selectedJob.id) {
          return {
            ...j,
            adjustment_notes: adjustmentNotes,
            tailor_remarks: tailorRemarks,
            status: status
          };
        }
        return j;
      }));

      // Update selected job state
      setSelectedJob(prev => prev ? {
        ...prev,
        adjustment_notes: adjustmentNotes,
        tailor_remarks: tailorRemarks,
        status: status
      } : null);

      alert("Fitting memory updated successfully!");
    } catch (err: any) {
      console.error("Failed to update alteration:", err);
      alert(`Error updating alteration: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-mono font-bold">Loading fitting memory console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 p-6 md:p-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2 text-[#D4AF37] font-medium tracking-wider text-xs uppercase mb-1">
            <History size={14} /> Fitting Memory & Alterations CRM
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white font-serif">
            Artisan <span className="text-[#D4AF37]">Alteration Console</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Track customer sizing complaints, apply tailored adjustments, and save corrections into Fitting Memory.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Alterations Request Queue */}
        <div className="lg:col-span-1 bg-[#121212] border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-4 shadow-lg shadow-black/40">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-3 flex items-center gap-2">
            <Clock size={16} className="text-[#D4AF37]" />
            <span>Requests Queue ({jobs.length})</span>
          </h3>

          {jobs.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 border border-dashed border-zinc-900 rounded-lg">
              <AlertCircle size={24} className="mx-auto mb-2 text-zinc-600" />
              <p className="text-xs">No active alteration requests found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh]">
              {jobs.map(job => {
                const isActive = selectedJob?.id === job.id;
                const custName = job.orders?.customers?.full_name || 'Valued Client';
                return (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`w-full p-4 rounded-lg border text-left transition-all flex flex-col gap-2 ${
                      isActive 
                        ? 'bg-[#D4AF37]/5 border-[#D4AF37] shadow-md shadow-[#D4AF37]/5' 
                        : 'bg-[#181818] border-zinc-850 hover:border-zinc-700/80'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
                        Job ID: {job.id.slice(0, 8)}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                        job.status === 'Resolved' 
                          ? 'border-emerald-500/20 text-emerald-400 bg-emerald-950/20' 
                          : job.status === 'Alteration_In_Progress'
                            ? 'border-amber-500/20 text-amber-400 bg-amber-950/20'
                            : 'border-rose-500/20 text-rose-400 bg-rose-950/20'
                      }`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-white text-xs font-bold font-serif">{custName}</h4>
                      <p className="text-zinc-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                        {job.complaint_details}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Side-by-Side Review & Adjustments Console */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedJob ? (
            <div className="bg-[#121212] border border-zinc-800/80 rounded-xl p-6 flex flex-col gap-6 shadow-lg shadow-black/40">
              
              {/* Card Title */}
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold">Review Console</span>
                  <h2 className="text-2xl font-serif text-white font-light mt-1">
                    Fit Correction for <span className="text-[#D4AF37]">{selectedJob.orders?.customers?.full_name || 'Client'}</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs font-mono">Status:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-[#1A1A1A] border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Requested">Requested</option>
                    <option value="Alteration_In_Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Side-by-Side Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel 1: Sizing History (Measurements & Complaint) */}
                <div className="flex flex-col gap-4 bg-zinc-950/20 border border-zinc-900 rounded-xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-2">
                    <Ruler size={14} className="text-[#D4AF37]" />
                    <span>Client Measurements</span>
                  </h3>
                  
                  {/* Measurement parameters */}
                  {selectedJob.orders?.measurements ? (
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      {Object.entries(selectedJob.orders.measurements).map(([key, val]) => {
                        if (typeof val === 'object') return null;
                        return (
                          <div key={key} className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                            <span className="text-zinc-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="text-white font-bold">{String(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No sizing parameters logged on order.</p>
                  )}

                  {/* Complaint Details box */}
                  <div className="mt-4 border-t border-zinc-900 pt-4 flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                      <AlertCircle size={12} /> Sizing Complaint Details
                    </span>
                    <div className="bg-rose-950/5 border border-rose-500/10 rounded-lg p-3 text-xs leading-relaxed text-zinc-300 italic">
                      "{selectedJob.complaint_details}"
                    </div>
                  </div>
                </div>

                {/* Panel 2: Master Tailor Adjustments Form */}
                <div className="flex flex-col gap-5 bg-zinc-950/20 border border-zinc-900 rounded-xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2 flex items-center gap-2">
                    <Scissors size={14} className="text-[#D4AF37]" />
                    <span>Tailor Adjustments</span>
                  </h3>

                  {/* Adjustments notes input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">
                      Measurement Corrections (Fitting Memory)
                    </label>
                    <textarea
                      value={adjustmentNotes}
                      onChange={(e) => setAdjustmentNotes(e.target.value)}
                      placeholder="e.g. Reduce blouse chest by 0.5 inches. Keep shoulder width at 14 inches."
                      rows={4}
                      className="w-full bg-[#161616] border border-zinc-800 hover:border-zinc-700/80 focus:border-[#D4AF37] focus:outline-none rounded-lg p-3 text-xs leading-relaxed text-white"
                    />
                    <span className="text-[9px] text-zinc-500">
                      These notes will load automatically for cutters on all subsequent orders.
                    </span>
                  </div>

                  {/* Tailor remarks input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold">
                      Artisan/Tailor Remarks
                    </label>
                    <input
                      type="text"
                      value={tailorRemarks}
                      onChange={(e) => setTailorRemarks(e.target.value)}
                      placeholder="e.g. Master Ramesh cutting pattern, Altaf Bhai executing seams"
                      className="w-full bg-[#161616] border border-zinc-800 hover:border-zinc-700/80 focus:border-[#D4AF37] focus:outline-none rounded-lg px-3 py-2.5 text-xs text-white"
                    />
                  </div>

                  {/* Save button */}
                  <button
                    onClick={handleSaveAlteration}
                    disabled={saving}
                    className="w-full bg-[#D4AF37] hover:bg-[#b8952d] text-black font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#D4AF37]/10 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{saving ? 'Saving Fitting Memory...' : 'Save to Sizing History'}</span>
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 bg-[#121212] border border-zinc-800/80 rounded-xl p-12 text-center text-zinc-500 flex flex-col items-center justify-center shadow-lg shadow-black/40 min-h-[50vh]">
              <History size={36} className="text-zinc-700 mb-3 animate-pulse" />
              <h3 className="text-white font-serif text-lg font-light">No Sizing Job Selected</h3>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">Select an active request from the queue list on the left to begin fitting evaluation.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
