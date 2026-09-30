-- ====================================================================
-- NOOR HORIZON TECHNOLOGIES ERP - MIGRATION
-- Migration: 06_add_customer_freight_liability.sql
-- Description: Add freight_account_code to customers table and support Customer Freight Liability COA
-- ====================================================================

ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS freight_account_code text;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "freightAccountCode" text;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
