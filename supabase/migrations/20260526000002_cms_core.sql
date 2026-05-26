-- supabase/migrations/20260526000002_cms_core.sql
-- Create full dynamic CMS core tables

-- 1. site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. page_sections
CREATE TABLE IF NOT EXISTS public.page_sections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page_identifier text NOT NULL, -- e.g. 'homepage', 'about'
    type text NOT NULL, -- e.g. 'hero_banner', 'bento_grid'
    variant text DEFAULT 'default',
    settings jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. homepage_blocks
CREATE TABLE IF NOT EXISTS public.homepage_blocks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    layout_config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. theme_configs
CREATE TABLE IF NOT EXISTS public.theme_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    theme_name text UNIQUE NOT NULL, -- 'classic', 'editorial_boutique'
    tokens jsonb DEFAULT '{}'::jsonb NOT NULL, -- custom colors, typography, spacing
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. support_templates
CREATE TABLE IF NOT EXISTS public.support_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id text UNIQUE NOT NULL, -- 'fitting_adjustment', etc
    title text NOT NULL,
    description text NOT NULL,
    intent_message text NOT NULL,
    badge text,
    badge_color text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. tracking_messages
CREATE TABLE IF NOT EXISTS public.tracking_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_key text UNIQUE NOT NULL, -- 'confirmed', 'sourcing', etc
    label text NOT NULL,
    description text NOT NULL,
    reassurance_notice text,
    sort_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. policy_content
CREATE TABLE IF NOT EXISTS public.policy_content (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_key text UNIQUE NOT NULL, -- 'fitting_alterations', 'returns_window'
    title text NOT NULL,
    content text NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. notification_templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trigger_event text UNIQUE NOT NULL, -- 'order_confirmed', 'delay_alert'
    channel text NOT NULL, -- 'WhatsApp', 'SMS', 'Email'
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. navigation_manager
CREATE TABLE IF NOT EXISTS public.navigation_manager (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_type text NOT NULL, -- 'header', 'footer_quick_links'
    items jsonb DEFAULT '[]'::jsonb, -- array of {label, url, submenus}
    spacing text DEFAULT 'gap-4',
    padding text DEFAULT 'py-4',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. footer_manager
CREATE TABLE IF NOT EXISTS public.footer_manager (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    copyright_text text,
    social_links jsonb DEFAULT '{}'::jsonb,
    legal_links jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for all tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_manager ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_manager ENABLE ROW LEVEL SECURITY;

-- Setup policy permissions (Public read, Staff edit)
CREATE POLICY "Allow public select on site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow staff updates on site_settings" ON public.site_settings FOR ALL USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

CREATE POLICY "Allow public select on page_sections" ON public.page_sections FOR SELECT USING (true);
CREATE POLICY "Allow staff updates on page_sections" ON public.page_sections FOR ALL USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

CREATE POLICY "Allow public select on homepage_blocks" ON public.homepage_blocks FOR SELECT USING (true);
CREATE POLICY "Allow staff updates on homepage_blocks" ON public.homepage_blocks FOR ALL USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

CREATE POLICY "Allow public select on theme_configs" ON public.theme_configs FOR SELECT USING (true);
CREATE POLICY "Allow staff updates on theme_configs" ON public.theme_configs FOR ALL USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

CREATE POLICY "Allow public select on support_templates" ON public.support_templates FOR SELECT USING (true);
CREATE POLICY "Allow staff updates on support_templates" ON public.support_templates FOR ALL USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

CREATE POLICY "Allow public select on tracking_messages" ON public.tracking_messages FOR SELECT USING (true);
CREATE POLICY "Allow staff updates on tracking_messages" ON public.tracking_messages FOR ALL USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

CREATE POLICY "Allow public select on policy_content" ON public.policy_content FOR SELECT USING (true);
CREATE POLICY "Allow staff updates on policy_content" ON public.policy_content FOR ALL USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

CREATE POLICY "Allow public select on notification_templates" ON public.notification_templates FOR SELECT USING (true);
CREATE POLICY "Allow staff updates on notification_templates" ON public.notification_templates FOR ALL USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

CREATE POLICY "Allow public select on navigation_manager" ON public.navigation_manager FOR SELECT USING (true);
CREATE POLICY "Allow staff updates on navigation_manager" ON public.navigation_manager FOR ALL USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));

CREATE POLICY "Allow public select on footer_manager" ON public.footer_manager FOR SELECT USING (true);
CREATE POLICY "Allow staff updates on footer_manager" ON public.footer_manager FOR ALL USING ((SELECT role FROM public.staff_roles WHERE id = auth.uid()) IN ('Staff', 'Manager'));
