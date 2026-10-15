-- ============================================================================
-- Migration: 001_telegram_store_dedicated_bots.sql
-- Description: Multi-Store Dedicated Telegram Bots, Chat Groups & Order Tracking
-- ============================================================================

-- 1. Ensure `stores` (and `companies`) table has dedicated Telegram configuration columns
ALTER TABLE `aura_stores`
  ADD COLUMN IF NOT EXISTS `telegram_bot_token` VARCHAR(512) NULL COMMENT 'AES-256 encrypted Telegram bot token for this store',
  ADD COLUMN IF NOT EXISTS `telegram_group_chat_id` VARCHAR(100) NULL COMMENT 'Dedicated Telegram group chat ID (e.g. -100...)',
  ADD COLUMN IF NOT EXISTS `telegram_bot_username` VARCHAR(100) NULL COMMENT 'Telegram bot handle (e.g. @store_bot)',
  ADD COLUMN IF NOT EXISTS `telegram_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Active, 0 = Disabled',
  ADD COLUMN IF NOT EXISTS `telegram_webhook_secret` VARCHAR(100) NULL COMMENT 'Secret token for store-specific webhook route';

-- Also ensure compatibility with `companies` table if aliased
ALTER TABLE `aura_companies`
  ADD COLUMN IF NOT EXISTS `telegram_bot_token` VARCHAR(512) NULL,
  ADD COLUMN IF NOT EXISTS `telegram_group_chat_id` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `telegram_bot_username` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `telegram_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `telegram_webhook_secret` VARCHAR(100) NULL;

-- 2. Add customer Telegram tracking and notification lifecycle columns to `orders` (and `sales`)
ALTER TABLE `aura_orders`
  ADD COLUMN IF NOT EXISTS `customer_telegram_id` BIGINT NULL COMMENT 'Telegram user ID of the customer placing the order',
  ADD COLUMN IF NOT EXISTS `notify_group_status` VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'Status of invoice sent to store group: pending, sent, failed',
  ADD COLUMN IF NOT EXISTS `notify_customer_status` VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'Status of invoice sent to customer: pending, sent, failed, user_not_started',
  ADD COLUMN IF NOT EXISTS `notify_error` TEXT NULL COMMENT 'Error message or diagnostic log if message delivery failed',
  ADD COLUMN IF NOT EXISTS `group_message_id` INT NULL COMMENT 'Message ID in store Telegram group chat',
  ADD COLUMN IF NOT EXISTS `customer_message_id` INT NULL COMMENT 'Message ID in customer private Telegram chat',
  ADD COLUMN IF NOT EXISTS `notification_retry_count` INT NOT NULL DEFAULT 0 COMMENT 'Number of retries attempted for notification dispatch';

-- Also ensure compatibility with `sales` table if used by ERP
ALTER TABLE `aura_sales`
  ADD COLUMN IF NOT EXISTS `customer_telegram_id` BIGINT NULL,
  ADD COLUMN IF NOT EXISTS `notify_group_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS `notify_customer_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS `notify_error` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `group_message_id` INT NULL,
  ADD COLUMN IF NOT EXISTS `customer_message_id` INT NULL,
  ADD COLUMN IF NOT EXISTS `notification_retry_count` INT NOT NULL DEFAULT 0;

-- 3. Create indices for fast lookup
CREATE INDEX IF NOT EXISTS `idx_stores_tg_enabled` ON `aura_stores` (`telegram_enabled`);
CREATE INDEX IF NOT EXISTS `idx_orders_cust_tg_id` ON `aura_orders` (`customer_telegram_id`);
CREATE INDEX IF NOT EXISTS `idx_orders_notify_group` ON `aura_orders` (`notify_group_status`);
CREATE INDEX IF NOT EXISTS `idx_orders_notify_cust` ON `aura_orders` (`notify_customer_status`);
