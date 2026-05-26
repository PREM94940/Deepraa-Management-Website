import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface MeasurementsFormProps {
    initialData?: Record<string, any>;
    onChange: (data: Record<string, any>) => void;
}

export default function MeasurementsForm({ initialData = {}, onChange }: MeasurementsFormProps) {
    const [data, setData] = useState<Record<string, any>>(initialData);
    const [newFieldName, setNewFieldName] = useState('');

    const standardFields = {
        blouse: [
            'Shoulder', 'Shoulder Full length', 'Front neck Depth', 'Chest Around',
            'Waist Around', 'Back Neck Depth', 'Blouse Front Side Length', 'Sleeve Length',
            'Sleeve length Around', 'Armhole around', 'Blouse Apex Point'
        ],
        lehenga: [
            'Waist', 'Hips', 'Length'
        ],
        options: [
            'Blouse pattern same as model?', 'Blouse with Breast pads?', 'Blouse Opening (Back hooks/Side zip)'
        ]
    };

    // Get custom fields that are not in standardFields
    const customFields = Object.keys(data).filter(
        key => !standardFields.blouse.includes(key) && 
               !standardFields.lehenga.includes(key) && 
               !standardFields.options.includes(key) &&
               key !== 'Extra Note'
    );

    useEffect(() => {
        onChange(data);
    }, [data, onChange]);

    const handleChange = (key: string, value: string) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const handleAddCustomField = () => {
        if (newFieldName.trim() && !(newFieldName in data)) {
            setData(prev => ({ ...prev, [newFieldName.trim()]: '' }));
            setNewFieldName('');
        }
    };

    const handleRemoveCustomField = (key: string) => {
        const newData = { ...data };
        delete newData[key];
        setData(newData);
    };

    return (
        <div className="measurements-form" style={{ padding: '20px', background: '#F8FAFC', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>Lehenga Choli Measurements</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Blouse Section */}
                <div>
                    <h4 style={{ fontWeight: 600, color: '#3B82F6', marginBottom: '12px' }}>Blouse</h4>
                    {standardFields.blouse.map(field => (
                        <div key={field} style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>{field}</label>
                            <input 
                                type="text"
                                value={data[field] || ''}
                                onChange={e => handleChange(field, e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                                placeholder="e.g. 14 inches"
                            />
                        </div>
                    ))}
                </div>

                {/* Lehenga & Options Section */}
                <div>
                    <h4 style={{ fontWeight: 600, color: '#10B981', marginBottom: '12px' }}>Lehenga Skirt</h4>
                    {standardFields.lehenga.map(field => (
                        <div key={field} style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>{field}</label>
                            <input 
                                type="text"
                                value={data[field] || ''}
                                onChange={e => handleChange(field, e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                                placeholder="e.g. 38 inches"
                            />
                        </div>
                    ))}

                    <h4 style={{ fontWeight: 600, color: '#8B5CF6', marginTop: '24px', marginBottom: '12px' }}>Additional Details</h4>
                    {standardFields.options.map(field => (
                        <div key={field} style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>{field}</label>
                            <input 
                                type="text"
                                value={data[field] || ''}
                                onChange={e => handleChange(field, e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                                placeholder="Yes / No / Note"
                            />
                        </div>
                    ))}

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>Extra Note</label>
                        <textarea 
                            value={data['Extra Note'] || ''}
                            onChange={e => handleChange('Extra Note', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            {/* Custom Fields Section */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                <h4 style={{ fontWeight: 600, color: '#F59E0B', marginBottom: '12px' }}>Additional Addon Measurements</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    {customFields.map(field => (
                        <div key={field} style={{ position: 'relative' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>{field}</label>
                            <input 
                                type="text"
                                value={data[field] || ''}
                                onChange={e => handleChange(field, e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                            />
                            <button 
                                onClick={() => handleRemoveCustomField(field)}
                                style={{ position: 'absolute', top: '2px', right: '0', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', maxWidth: '300px' }}>
                    <input 
                        type="text"
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                        placeholder="e.g. Kurti Length"
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px' }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomField())}
                    />
                    <button 
                        type="button"
                        onClick={handleAddCustomField}
                        className="btn btn-primary btn-sm" 
                        style={{ padding: '8px 12px' }}
                    >
                        <Plus size={16} /> Add
                    </button>
                </div>
            </div>
        </div>
    );
}
