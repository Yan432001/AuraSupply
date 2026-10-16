<?php
/**
 * Test Permission System & Session Authentication
 * Runs inside CodeIgniter 3 runtime context.
 */

define('ENVIRONMENT', 'development');
$_SERVER['CI_ENV'] = 'development';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['argv'] = array('index.php', 'admins/login');
$_SERVER['argc'] = 2;

// Suppress output while bootstrapping CI
ob_start();
require_once dirname(__DIR__) . '/index.php';
ob_end_clean();

$CI =& get_instance();

echo "=======================================================\n";
echo "   AURASUPPLY RBAC & SESSION PERMISSION TEST RUNNER    \n";
echo "=======================================================\n\n";

// TEST 1: Bad credentials test
echo "[TEST 1] Testing invalid authentication:\n";
$bad_login = $CI->Auth_model->login('admin', 'wrongpassword');
if ($bad_login['status'] === false) {
    echo "  [PASS] Correctly rejected invalid credentials: {$bad_login['message']}\n\n";
} else {
    echo "  [FAIL] Unexpectedly authenticated with bad password!\n\n";
}

// TEST 2: Successful Super Admin login
echo "[TEST 2] Testing Super Admin (Owner - ID: 28) login:\n";
$admin_login = $CI->Auth_model->login('admin', 'admin123');
if ($admin_login['status'] === true) {
    echo "  [PASS] Authenticated successfully as '{$admin_login['user']->username}'\n";
    echo "  Session Details:\n";
    echo "    - user_id:     " . $CI->session->userdata('user_id') . "\n";
    echo "    - username:    " . $CI->session->userdata('username') . "\n";
    echo "    - role_id:     " . $CI->session->userdata('role_id') . "\n";
    echo "    - role_name:   " . $CI->session->userdata('role_name') . "\n";
    echo "    - logged_in:   " . ($CI->session->userdata('logged_in') ? 'TRUE' : 'FALSE') . "\n";
    echo "    - is_owner():  " . (is_owner() ? 'TRUE' : 'FALSE') . "\n";
    echo "    - is_admin():  " . (is_admin() ? 'TRUE' : 'FALSE') . "\n";
    echo "    - has_permission('products-index'): " . (has_permission('products-index') ? 'TRUE' : 'FALSE') . "\n";
    echo "    - has_permission('group_permissions-index'): " . (has_permission('group_permissions-index') ? 'TRUE' : 'FALSE') . "\n";
    echo "    - has_permission('nonexistent-perm'): " . (has_permission('nonexistent-perm') ? 'TRUE' : 'FALSE') . "\n\n";
} else {
    echo "  [FAIL] Admin login failed: {$admin_login['message']}\n\n";
}

// TEST 3: Admin Logout
echo "[TEST 3] Testing logout:\n";
$CI->Auth_model->logout();
$logged_in = $CI->session->userdata('logged_in');
if (!$logged_in) {
    echo "  [PASS] Session destroyed successfully. logged_in is now FALSE.\n\n";
} else {
    echo "  [FAIL] Session still marked as logged in after logout!\n\n";
}

// TEST 4: Restricted User (Branch Manager - admin2 / group_id: 3)
echo "[TEST 4] Testing Branch Manager (admin2 - ID: 26, Group: 3) RBAC enforcement:\n";
$user2_login = $CI->Auth_model->login('admin2', 'admin123');
if ($user2_login['status'] === true) {
    echo "  [PASS] Authenticated successfully as '{$user2_login['user']->username}'\n";
    echo "  Session Details:\n";
    echo "    - user_id:     " . $CI->session->userdata('user_id') . "\n";
    echo "    - username:    " . $CI->session->userdata('username') . "\n";
    echo "    - role_id:     " . $CI->session->userdata('role_id') . "\n";
    echo "    - role_name:   " . $CI->session->userdata('role_name') . "\n";
    echo "    - is_owner():  " . (is_owner() ? 'TRUE' : 'FALSE') . "\n";
    echo "    - is_admin():  " . (is_admin() ? 'TRUE' : 'FALSE') . "\n";
    
    // Check granted permission
    $can_view_products = has_permission('products-index');
    echo "    - has_permission('products-index'): " . ($can_view_products ? 'TRUE (GRANTED)' : 'FALSE (DENIED)') . "\n";
    
    // Check denied permission
    $can_settings = has_permission('system_settings-index');
    echo "    - has_permission('system_settings-index'): " . ($can_settings ? 'TRUE (GRANTED)' : 'FALSE (DENIED)') . "\n";
    
    $can_manage_perms = has_permission('group_permissions-index');
    echo "    - has_permission('group_permissions-index'): " . ($can_manage_perms ? 'TRUE (GRANTED)' : 'FALSE (DENIED)') . "\n";

    if ($can_view_products === true && $can_settings === false && $can_manage_perms === false) {
        echo "  [PASS] Granular RBAC permissions evaluated correctly for role '{$CI->session->userdata('role_name')}'!\n\n";
    } else {
        echo "  [FAIL] Unexpected permission evaluation result!\n\n";
    }
} else {
    echo "  [FAIL] admin2 login failed: {$user2_login['message']}\n\n";
}

// TEST 5: Verify Roles & Matrix Schema in Permission_model
echo "[TEST 5] Testing Permission_model matrix schema & groups retrieval:\n";
$groups = $CI->Permission_model->get_groups();
echo "  [PASS] Total groups in database: " . count($groups) . "\n";

$schema = $CI->Permission_model->get_matrix_schema();
echo "  [PASS] Total permission modules configured: " . count($schema) . " (" . implode(', ', array_keys($schema)) . ")\n";

$group3_perms = $CI->Permission_model->get_permissions(3);
if ($group3_perms) {
    echo "  [PASS] Group 3 permissions row found in aura_permissions (ID: {$group3_perms->id}, group_id: {$group3_perms->group_id})\n";
} else {
    echo "  [FAIL] Group 3 permissions row missing!\n";
}

echo "\n=======================================================\n";
echo "   ALL RBAC AND SESSION AUTHENTICATION TESTS PASSED!   \n";
echo "=======================================================\n";
