<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * AuraSupply Permission Helper
 * Used in views, navigation bars, and templates to dynamically show or hide menu items
 */

if (!function_exists('has_permission')) {
    /**
     * Check if authenticated user has permission for a specific module/action
     * 
     * @param string $permission_key (e.g. 'products-index', 'sales-add', 'system_settings-index')
     * @return bool
     */
    function has_permission($permission_key)
    {
        $CI =& get_instance();
        
        $role_id = (int) $CI->session->userdata('role_id');
        $role_name = strtolower((string) $CI->session->userdata('role_name'));
        
        // Owner (1) and Admin (2) bypass all permission restrictions
        if ($role_id === 1 || $role_name === 'owner' || $role_id === 2 || $role_name === 'admin') {
            return TRUE;
        }

        $permissions = $CI->session->userdata('permissions');
        if (is_array($permissions) && isset($permissions[$permission_key])) {
            return ((int) $permissions[$permission_key] === 1);
        }

        return FALSE;
    }
}

if (!function_exists('is_owner')) {
    /**
     * Check if currently logged in user is Owner (Super Admin)
     * @return bool
     */
    function is_owner()
    {
        $CI =& get_instance();
        $role_id = (int) $CI->session->userdata('role_id');
        $role_name = strtolower((string) $CI->session->userdata('role_name'));
        return ($role_id === 1 || $role_name === 'owner');
    }
}

if (!function_exists('is_admin')) {
    /**
     * Check if currently logged in user is an Administrator or Owner
     * @return bool
     */
    function is_admin()
    {
        $CI =& get_instance();
        $role_id = (int) $CI->session->userdata('role_id');
        $role_name = strtolower((string) $CI->session->userdata('role_name'));
        return ($role_id === 1 || $role_id === 2 || $role_name === 'owner' || $role_name === 'admin');
    }
}
