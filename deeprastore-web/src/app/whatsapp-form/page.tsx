"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Upload, Camera } from 'lucide-react';
import MeasurementsForm from '@/components/admin/MeasurementsForm';

export default function WhatsAppOrderForm() {
    const [step, setStep] = useState(1);
    
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [measurements, setMeasurements] = useState<Record<string, any>>({});
    const [notes, setNotes] = useState('');
    
    const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
    
    const [submitting, setSubmitting] = useState(false);
    const [successId, setSuccessId] = useState<string | null>(null);

    async function uploadFile(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `pay-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('order-attachments').upload(fileName, file);
        if (error || !data) return null;
        return supabase.storage.from('order-attachments').getPublicUrl(data.path).data.publicUrl;
    }

    async function handleSubmit() {
        if (!fullName || !phone) {
            alert("Please provide your name and phone number.");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Find or create customer
            let customerId = null;
            const { data: existingCust } = await supabase.from('customers').select('id').eq('phone_number', phone).single();
            if (existingCust) {
                customerId = existingCust.id;
            } else {
                const { data: newCust, error: custErr } = await supabase.from('customers').insert([
                    { full_name: fullName, phone_number: phone }
                ]).select().single();
                if (custErr) throw custErr;
                customerId = newCust.id;
            }

            // 2. Upload payment screenshot if provided
            let paymentUrl = null;
            if (paymentScreenshot) {
                paymentUrl = await uploadFile(paymentScreenshot);
            }

            // 3. Create order
            const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
            const { data: order, error: orderErr } = await supabase.from('orders').insert([{
                order_number: orderNumber,
                customer_id: customerId, 
                total_amount: 0, // Admin will update this later
                status: 'Pending Verification',
                approval_status: 'Pending Approval',
                payment_status: 'Pending',
                source: 'whatsapp',
                payment_screenshot: paymentUrl,
                notes: notes,
                measurements: measurements
            }]).select().single();
            
            if (orderErr) throw orderErr;

            setSuccessId(order.id);
        } catch (err: any) {
            alert("Error submitting form: " + err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (successId) {
        return (
            <div style={{ maxWidth: '500px', margin: '40px auto', padding: '40px 20px', textAlign: 'center', background: '#FFF', minHeight: '100vh' }}>
                <CheckCircle size={64} color="#10B981" style={{ margin: '0 auto 20px' }} />
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '12px' }}>Order Submitted!</h1>
                <p style={{ color: '#64748B', marginBottom: '24px' }}>Thank you, {fullName}. Your details and measurements have been sent securely to Deeprastore.</p>
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'inline-block' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>Reference Number</span>
                    <span style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.2rem', color: '#0F172A' }}>{successId.slice(0,8)}</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '20px 16px', fontFamily: 'var(--font-geist-sans)' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto', background: '#FFF', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '24px', background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)', color: '#FFF', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Deeprastore</h1>
                    <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>Secure Order & Measurement Form</p>
                </div>

                <div style={{ padding: '24px' }}>
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: '#0F172A' }}>Your Details</h2>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>Full Name *</label>
                                <input 
                                    type="text" 
                                    value={fullName} 
                                    onChange={e => setFullName(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '1rem' }}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>WhatsApp Number *</label>
                                <input 
                                    type="tel" 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '1rem' }}
                                    placeholder="+91 00000 00000"
                                />
                            </div>

                            <button 
                                onClick={() => setStep(2)}
                                disabled={!fullName || !phone}
                                style={{ width: '100%', padding: '14px', borderRadius: '8px', background: (!fullName || !phone) ? '#CBD5E1' : '#0F172A', color: '#FFF', fontWeight: 600, border: 'none', cursor: (!fullName || !phone) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                            >
                                Next Step
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: '#0F172A' }}>Measurements</h2>
                            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '20px' }}>Please provide your exact measurements. Leave blank if not applicable.</p>
                            
                            <div style={{ marginBottom: '24px' }}>
                                <MeasurementsForm initialData={measurements} onChange={setMeasurements} />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setStep(1)}
                                    style={{ flex: 1, padding: '14px', borderRadius: '8px', background: '#FFF', color: '#0F172A', fontWeight: 600, border: '1px solid #E2E8F0', cursor: 'pointer' }}
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={() => setStep(3)}
                                    style={{ flex: 2, padding: '14px', borderRadius: '8px', background: '#0F172A', color: '#FFF', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                    Next Step
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: '#0F172A' }}>Final Details</h2>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>Items Requested / Additional Notes</label>
                                <textarea 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)}
                                    rows={4}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '1rem', resize: 'none' }}
                                    placeholder="Describe what you are looking to order..."
                                />
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>Payment Screenshot (Optional)</label>
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', borderRadius: '12px', border: '2px dashed #CBD5E1', background: '#F8FAFC', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Upload size={32} color="#94A3B8" style={{ marginBottom: '12px' }} />
                                    <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>{paymentScreenshot ? paymentScreenshot.name : 'Tap to upload screenshot'}</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={e => e.target.files && setPaymentScreenshot(e.target.files[0])}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setStep(2)}
                                    style={{ flex: 1, padding: '14px', borderRadius: '8px', background: '#FFF', color: '#0F172A', fontWeight: 600, border: '1px solid #E2E8F0', cursor: 'pointer' }}
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    style={{ flex: 2, padding: '14px', borderRadius: '8px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFF', fontWeight: 600, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}
                                >
                                    {submitting ? 'Submitting...' : 'Complete Order'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}
