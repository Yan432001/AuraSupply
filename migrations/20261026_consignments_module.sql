-- Migration: Consignments Module Enhancement
-- Preserves existing aura_consignments & aura_consignment_items schema while adding
-- total_qty, destination, expected_return_date, dispatch_date, damage_qty, missing_qty, batch_no, unit_cost.

ALTER TABLE `aura_consignments`
  ADD COLUMN IF NOT EXISTS `total_qty` DOUBLE NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `destination` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `expected_return_date` DATE NULL,
  ADD COLUMN IF NOT EXISTS `dispatch_date` DATETIME NULL;

ALTER TABLE `aura_consignment_items`
  ADD COLUMN IF NOT EXISTS `damage_qty` DOUBLE NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `missing_qty` DOUBLE NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `batch_no` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `unit_cost` DOUBLE NULL DEFAULT 0;
