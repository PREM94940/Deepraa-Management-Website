-- Migration: Customer Measurements
-- Adds a JSONB column to the customers table to store custom bespoke measurements
-- MVP: Single measurement profile per customer.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS measurements jsonb DEFAULT '{}'::jsonb;
