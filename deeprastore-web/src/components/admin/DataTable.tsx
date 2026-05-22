"use client";
import React, { useState } from 'react';
import { LayoutGrid, List, Download, Search, Trash2 } from 'lucide-react';

type ColumnDef<T> = {
    key: keyof T | string;
    header: string;
    render?: (row: T) => React.ReactNode;
    sortable?: boolean;
};

type DataTableProps<T> = {
    data: T[];
    columns: ColumnDef<T>[];
    searchKey?: keyof T;
    onDeleteSelected?: (ids: string[]) => void;
    renderGridCard?: (row: T) => React.ReactNode;
    filename?: string;
    emptyMessage?: string;
    getId: (row: T) => string;
};

export default function DataTable<T>({ 
    data, 
    columns, 
    searchKey, 
    onDeleteSelected, 
    renderGridCard, 
    filename = 'export.csv',
    emptyMessage = 'No records found.',
    getId
}: DataTableProps<T>) {
    const [view, setView] = useState<'table' | 'grid'>('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: string, dir: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let dir: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.dir === 'asc') dir = 'desc';
        setSortConfig({ key, dir });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(data.map(getId)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleDelete = () => {
        if (onDeleteSelected && selectedIds.size > 0) {
            if (confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) {
                onDeleteSelected(Array.from(selectedIds));
                setSelectedIds(new Set());
            }
        }
    };

    const exportToCSV = () => {
        // Extremely basic CSV export
        const headers = columns.map(c => c.header).join(',');
        const rows = processedData.map(row => 
            columns.map(c => {
                let val = c.key in (row as any) ? (row as any)[c.key] : '';
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',')
        ).join('\n');
        
        const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    let processedData = [...data];

    if (searchQuery && searchKey) {
        processedData = processedData.filter(row => 
            String((row as any)[searchKey]).toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (sortConfig) {
        processedData.sort((a: any, b: any) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return (
        <div className="data-table-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {searchKey && (
                        <div style={{ display: 'flex', alignItems: 'center', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0 12px' }}>
                            <Search size={16} color="#94A3B8" />
                            <input 
                                type="text"
                                placeholder={`Search...`}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ border: 'none', outline: 'none', padding: '10px', fontSize: '0.9rem', width: '200px' }}
                            />
                        </div>
                    )}
                    {selectedIds.size > 0 && onDeleteSelected && (
                        <button onClick={handleDelete} className="btn btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Trash2 size={16}/> Delete ({selectedIds.size})
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={exportToCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}>
                        <Download size={16} /> Export
                    </button>
                    {renderGridCard && (
                        <div style={{ display: 'flex', background: '#E2E8F0', padding: '2px', borderRadius: '6px' }}>
                            <button onClick={() => setView('table')} style={{ background: view === 'table' ? '#FFF' : 'transparent', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', boxShadow: view === 'table' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
                                <List size={16} />
                            </button>
                            <button onClick={() => setView('grid')} style={{ background: view === 'grid' ? '#FFF' : 'transparent', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', boxShadow: view === 'grid' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {processedData.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                    {emptyMessage}
                </div>
            ) : view === 'table' ? (
                <div style={{ overflowX: 'auto', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <table className="admin-table" style={{ margin: 0 }}>
                        <thead>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.size === data.length && data.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {columns.map((col, i) => (
                                    <th 
                                        key={i} 
                                        onClick={() => col.sortable && handleSort(col.key as string)}
                                        style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                                    >
                                        {col.header}
                                        {sortConfig?.key === col.key && (
                                            <span style={{ marginLeft: '4px', fontSize: '0.8em' }}>{sortConfig.dir === 'asc' ? '▲' : '▼'}</span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.map((row, i) => {
                                const id = getId(row);
                                return (
                                    <tr key={id} style={{ background: selectedIds.has(id) ? '#F0F9FF' : 'transparent' }}>
                                        <td style={{ textAlign: 'center' }}>
                                            <input 
                                                type="checkbox"
                                                checked={selectedIds.has(id)}
                                                onChange={() => handleSelectOne(id)}
                                            />
                                        </td>
                                        {columns.map((col, j) => (
                                            <td key={j}>
                                                {col.render ? col.render(row) : String((row as any)[col.key] || '')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {processedData.map((row) => (
                        <div key={getId(row)} style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.has(getId(row))}
                                    onChange={() => handleSelectOne(getId(row))}
                                    style={{ transform: 'scale(1.2)' }}
                                />
                            </div>
                            {renderGridCard && renderGridCard(row)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
