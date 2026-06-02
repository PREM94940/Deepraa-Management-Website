-- Migration: Support Schema Admin Notes
-- Adds a strictly private staff-only column for internal ticket notes

ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS admin_notes text;
