'use client';

/**
 * useCMSContent.ts
 * Deeprastore — CMS Data Hooks
 *
 * Provides typed React hooks for fetching CMS table data from Supabase.
 * All hooks are client-side only (use-client directive is file-level).
 *
 * Exports:
 *   useTrackingMessages()  → { stages, loading }
 *   useSupportTemplates()  → { templates, loading }
 *   useSiteSettings()      → { settings, loading }
 *   usePolicyContent(key)  → { policy, loading }
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────
// TypeScript Interfaces
// ─────────────────────────────────────────────────────────────

export interface TrackingMessage {
  id: string;
  stage_key: string;
  label: string;
  description: string;
  reassurance_notice: string | null;
  sort_order: number;
  created_at: string;
}

export interface SupportTemplate {
  id: string;
  category_id: string;
  title: string;
  description: string;
  intent_message: string;
  badge: string | null;
  badge_color: string | null;
  sort_order: number;
  created_at: string;
}

export interface PolicyContent {
  id: string;
  policy_key: string;
  title: string;
  content: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NavigationItem {
  label: string;
  url: string;
  submenus?: NavigationItem[];
}

export interface NavigationManager {
  id: string;
  menu_type: string;
  items: NavigationItem[];
  spacing: string;
  padding: string;
  created_at: string;
}

export interface FooterManager {
  id: string;
  copyright_text: string;
  social_links: Record<string, string>;
  legal_links: Array<{ label: string; url: string }>;
  created_at: string;
}

export interface NotificationTemplate {
  id: string;
  trigger_event: string;
  channel: string;
  body: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Hook: useTrackingMessages
// Returns all order tracking stage messages sorted by sort_order
// ─────────────────────────────────────────────────────────────

export interface UseTrackingMessagesReturn {
  stages: TrackingMessage[];
  loading: boolean;
  error: string | null;
}

export function useTrackingMessages(): UseTrackingMessagesReturn {
  const [stages, setStages] = useState<TrackingMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStages(): Promise<void> {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('tracking_messages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (supabaseError) {
        setError(supabaseError.message);
        setStages([]);
      } else {
        setStages((data as TrackingMessage[]) ?? []);
      }

      setLoading(false);
    }

    fetchStages();

    return () => {
      cancelled = true;
    };
  }, []);

  return { stages, loading, error };
}

// ─────────────────────────────────────────────────────────────
// Hook: useSupportTemplates
// Returns all WhatsApp support category templates sorted by sort_order
// ─────────────────────────────────────────────────────────────

export interface UseSupportTemplatesReturn {
  templates: SupportTemplate[];
  loading: boolean;
  error: string | null;
}

export function useSupportTemplates(): UseSupportTemplatesReturn {
  const [templates, setTemplates] = useState<SupportTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates(): Promise<void> {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('support_templates')
        .select('*')
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (supabaseError) {
        setError(supabaseError.message);
        setTemplates([]);
      } else {
        setTemplates((data as SupportTemplate[]) ?? []);
      }

      setLoading(false);
    }

    fetchTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  return { templates, loading, error };
}

// ─────────────────────────────────────────────────────────────
// Hook: useSiteSettings
// Returns a flat Record<string, any> keyed by setting key
// e.g. settings['store_name'] → { text: 'Deeprastore' }
// ─────────────────────────────────────────────────────────────

export interface UseSiteSettingsReturn {
  settings: Record<string, Record<string, unknown>>;
  loading: boolean;
  error: string | null;
}

export function useSiteSettings(): UseSiteSettingsReturn {
  const [settings, setSettings] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSettings(): Promise<void> {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('site_settings')
        .select('key, value');

      if (cancelled) return;

      if (supabaseError) {
        setError(supabaseError.message);
        setSettings({});
      } else {
        const mapped: Record<string, Record<string, unknown>> = {};
        (data as Pick<SiteSetting, 'key' | 'value'>[]).forEach((row) => {
          mapped[row.key] = row.value;
        });
        setSettings(mapped);
      }

      setLoading(false);
    }

    fetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading, error };
}

// ─────────────────────────────────────────────────────────────
// Hook: usePolicyContent
// Returns a single policy row by policy_key
// ─────────────────────────────────────────────────────────────

export interface UsePolicyContentReturn {
  policy: PolicyContent | null;
  loading: boolean;
  error: string | null;
}

export function usePolicyContent(policyKey: string): UsePolicyContentReturn {
  const [policy, setPolicy] = useState<PolicyContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!policyKey) {
      setPolicy(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPolicy(): Promise<void> {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('policy_content')
        .select('*')
        .eq('policy_key', policyKey)
        .single();

      if (cancelled) return;

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          // No row found — not an error, just empty
          setPolicy(null);
        } else {
          setError(supabaseError.message);
          setPolicy(null);
        }
      } else {
        setPolicy(data as PolicyContent);
      }

      setLoading(false);
    }

    fetchPolicy();

    return () => {
      cancelled = true;
    };
  }, [policyKey]);

  return { policy, loading, error };
}

// ─────────────────────────────────────────────────────────────
// Hook: useNavigationManager
// Returns navigation items for a given menu_type ('header' | 'footer_links')
// ─────────────────────────────────────────────────────────────

export interface UseNavigationManagerReturn {
  nav: NavigationManager | null;
  loading: boolean;
  error: string | null;
}

export function useNavigationManager(menuType: string): UseNavigationManagerReturn {
  const [nav, setNav] = useState<NavigationManager | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!menuType) {
      setNav(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchNav(): Promise<void> {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('navigation_manager')
        .select('*')
        .eq('menu_type', menuType)
        .single();

      if (cancelled) return;

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          setNav(null);
        } else {
          setError(supabaseError.message);
          setNav(null);
        }
      } else {
        setNav(data as NavigationManager);
      }

      setLoading(false);
    }

    fetchNav();

    return () => {
      cancelled = true;
    };
  }, [menuType]);

  return { nav, loading, error };
}

// ─────────────────────────────────────────────────────────────
// Hook: useFooterManager
// Returns the single footer configuration row
// ─────────────────────────────────────────────────────────────

export interface UseFooterManagerReturn {
  footer: FooterManager | null;
  loading: boolean;
  error: string | null;
}

export function useFooterManager(): UseFooterManagerReturn {
  const [footer, setFooter] = useState<FooterManager | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFooter(): Promise<void> {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('footer_manager')
        .select('*')
        .limit(1)
        .single();

      if (cancelled) return;

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          setFooter(null);
        } else {
          setError(supabaseError.message);
          setFooter(null);
        }
      } else {
        setFooter(data as FooterManager);
      }

      setLoading(false);
    }

    fetchFooter();

    return () => {
      cancelled = true;
    };
  }, []);

  return { footer, loading, error };
}

// ─────────────────────────────────────────────────────────────
// Hook: useNotificationTemplates
// Returns all notification templates
// ─────────────────────────────────────────────────────────────

export interface UseNotificationTemplatesReturn {
  notificationTemplates: NotificationTemplate[];
  loading: boolean;
  error: string | null;
}

export function useNotificationTemplates(): UseNotificationTemplatesReturn {
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates(): Promise<void> {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('notification_templates')
        .select('*')
        .order('trigger_event', { ascending: true });

      if (cancelled) return;

      if (supabaseError) {
        setError(supabaseError.message);
        setNotificationTemplates([]);
      } else {
        setNotificationTemplates((data as NotificationTemplate[]) ?? []);
      }

      setLoading(false);
    }

    fetchTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  return { notificationTemplates, loading, error };
}
