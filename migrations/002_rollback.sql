-- ============================================================================
-- ROLLBACK SCRIPT: 002_rollback.sql
-- PROJECT: Aura Supply B2B ERP
-- OBJECTIVE:
--   Safely reverse migration 002 without data loss to original core tables.
-- ============================================================================

-- 1. Drop created custom tables
DROP TABLE IF EXISTS `aura_user_sessions`;
DROP TABLE IF EXISTS `aura_activity_logs`;
DROP TABLE IF EXISTS `aura_license`;
DROP TABLE IF EXISTS `aura_sub_module_settings`;
DROP TABLE IF EXISTS `aura_module_settings`;
DROP TABLE IF EXISTS `aura_site_settings`;

-- 2. Drop performance indexes on aura_users
ALTER TABLE `aura_users`
  DROP INDEX IF EXISTS `idx_users_role`,
  DROP INDEX IF EXISTS `idx_users_status`,
  DROP INDEX IF EXISTS `idx_users_level`,
  DROP INDEX IF EXISTS `idx_users_deleted_at`;

-- 3. Drop added columns on aura_users (preserve original group_id, active, etc.)
ALTER TABLE `aura_users`
  DROP COLUMN IF EXISTS `deleted_at`,
  DROP COLUMN IF EXISTS `updated_at`,
  DROP COLUMN IF EXISTS `created_at`,
  DROP COLUMN IF EXISTS `last_login_ip`,
  DROP COLUMN IF EXISTS `last_login_at`,
  DROP COLUMN IF EXISTS `theme`,
  DROP COLUMN IF EXISTS `status`,
  DROP COLUMN IF EXISTS `permissions`,
  DROP COLUMN IF EXISTS `level`,
  DROP COLUMN IF EXISTS `role`;

-- ============================================================================
-- END OF ROLLBACK 002
-- ============================================================================
