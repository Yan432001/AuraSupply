-- Migration: Stock Received Module Enhancement
-- Preserves existing aura_stock_received & aura_stock_received_items schema while adding
-- total_qty, total_amount, quantity_ordered, quantity_rejected, batch_no for full GRN support.

ALTER TABLE `aura_stock_received`
  ADD COLUMN IF NOT EXISTS `total_qty` DOUBLE NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `total_amount` DOUBLE NULL DEFAULT 0;

ALTER TABLE `aura_stock_received_items`
  ADD COLUMN IF NOT EXISTS `quantity_ordered` DOUBLE NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `quantity_rejected` DOUBLE NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `batch_no` VARCHAR(100) NULL;
