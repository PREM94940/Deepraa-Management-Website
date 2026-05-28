-- Migration: Order Logistics tracking
-- Adds tracking number, courier, and target SLA to orders table

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS target_days integer DEFAULT 14;
