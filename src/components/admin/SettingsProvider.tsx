"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type UIConfig = {
    hideProducts: boolean;
    hideComplaints: boolean;
    tabLabels: Record<string, string>;
    warningDays: number;
};

const defaultUIConfig: UIConfig = {
    hideProducts: false,
    hideComplaints: false,
    tabLabels: {
        overview: 'Overview',
        orders: 'Orders',
        workflow: 'Workflow',
        products: 'Products',
        customers: 'Customers CRM',
        complaints: 'Complaints',
        analytics: 'Analytics',
        settings: 'Settings',
    },
    warningDays: 2,
};

const SettingsContext = createContext<{ config: UIConfig; refreshConfig: () => void }>({ config: defaultUIConfig, refreshConfig: () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<UIConfig>(defaultUIConfig);

    useEffect(() => {
        refreshConfig();
    }, []);

    async function refreshConfig() {
        try {
            const { data, error } = await supabase.from('store_ui_settings').select('*').eq('key', 'admin_ui').single();
            if (data && data.value) {
                setConfig({ ...defaultUIConfig, ...data.value });
            }
        } catch (e) {
            console.log('Using default UI settings', e);
        }
    }

    return (
        <SettingsContext.Provider value={{ config, refreshConfig }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
