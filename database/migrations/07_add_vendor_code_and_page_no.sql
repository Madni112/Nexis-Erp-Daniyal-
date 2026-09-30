-- ====================================================================
-- NOOR HORIZON TECHNOLOGIES ERP - MIGRATION
-- Migration: 07_add_vendor_code_and_page_no.sql
-- Description: Add vendor_code and page_no columns to vendors table
-- ====================================================================

ALTER TABLE IF EXISTS vendors ADD COLUMN IF NOT EXISTS vendor_code text;
ALTER TABLE IF EXISTS vendors ADD COLUMN IF NOT EXISTS "vendorCode" text;
ALTER TABLE IF EXISTS vendors ADD COLUMN IF NOT EXISTS page_no text;
ALTER TABLE IF EXISTS vendors ADD COLUMN IF NOT EXISTS "pageNo" text;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
