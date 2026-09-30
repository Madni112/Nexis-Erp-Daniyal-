-- ====================================================================
-- NOOR HORIZON TECHNOLOGIES ERP - MIGRATION
-- Migration: 05_add_customer_page_no.sql
-- Description: Add page_no column to customers table for physical ledger page tracking
-- ====================================================================

ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS page_no text;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "pageNo" text;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
