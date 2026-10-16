<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * Base Application Controller
 */
class MY_Controller extends CI_Controller
{
    public $data = array();

    public function __construct()
    {
        parent::__construct();
        $this->data['site_name'] = 'AuraSupply ERP';
    }
}

/**
 * Admin Base Controller
 * Cloned and adapted from AURA_v1 core architecture.
 * Protects all /admins controllers by verifying session, user role, and permissions.
 */
class Admin_Controller extends MY_Controller
{
    public $user_id;
    public $username;
    public $role_id;
    public $role_name;
    public $permissions = array();
    public $Owner = false;
    public $Admin = false;
    public $GP = array();

    public function __construct()
    {
        parent::__construct();

        // 1. Session Authentication Gate
        if (!$this->session->userdata('logged_in')) {
            $this->session->set_userdata('requested_page', $this->uri->uri_string());
            $this->session->set_flashdata('error', 'Session expired or not authenticated. Please sign in.');
            redirect('admins/login');
            exit();
        }

        // 2. Hydrate user session details
        $this->user_id      = $this->session->userdata('user_id');
        $this->username     = $this->session->userdata('username');
        $this->role_id      = (int) $this->session->userdata('role_id');
        $this->role_name    = $this->session->userdata('role_name');
        $this->permissions  = (array) $this->session->userdata('permissions');

        // 3. Evaluate Super Admin & Admin Flags
        $this->Owner = ($this->role_id === 1 || strtolower($this->role_name) === 'owner');
        $this->Admin = ($this->role_id === 2 || strtolower($this->role_name) === 'admin');
        $this->GP    = $this->permissions;

        // 4. Pass security context into view data
        $this->data['user_id']     = $this->user_id;
        $this->data['username']    = $this->username;
        $this->data['role_id']     = $this->role_id;
        $this->data['role_name']   = $this->role_name;
        $this->data['Owner']       = $this->Owner;
        $this->data['Admin']       = $this->Admin;
        $this->data['GP']          = $this->GP;
        $this->data['permissions'] = $this->permissions;
    }

    /**
     * Check if current user has permission for a specific action
     * Owner and Admin automatically bypass all permission restrictions.
     * 
     * @param string $permission_key (e.g. 'products-index', 'products-add', 'system_settings-index')
     * @param bool   $render_403     Whether to automatically render 403 page on denial
     * @return bool
     */
    public function check_permission($permission_key, $render_403 = TRUE)
    {
        // Owner and Admin bypass
        if ($this->Owner || $this->Admin) {
            return TRUE;
        }

        // Check if permission flag is set to 1
        if (isset($this->permissions[$permission_key]) && (int)$this->permissions[$permission_key] === 1) {
            return TRUE;
        }

        // Access denied
        if ($render_403) {
            $this->render_403($permission_key);
        }

        return FALSE;
    }

    /**
     * Render HTTP 403 Forbidden Access Denied Page
     * 
     * @param string $permission_key
     */
    public function render_403($permission_key = null)
    {
        $this->output->set_status_header(403);
        $data = $this->data;
        $data['title'] = '403 - Permission Denied';
        $data['missing_permission'] = $permission_key;
        $data['requested_url'] = current_url();

        $this->load->view('admins/layout/header', $data);
        $this->load->view('admins/errors/403', $data);
        $this->load->view('admins/layout/footer', $data);
        $this->output->_display();
        exit();
    }

    /**
     * Standard view wrapper method
     * 
     * @param string $view
     * @param array  $data
     */
    public function page_construct($view, $data = array())
    {
        $merged_data = array_merge($this->data, $data);
        $this->load->view('admins/layout/header', $merged_data);
        $this->load->view($view, $merged_data);
        $this->load->view('admins/layout/footer', $merged_data);
    }
}
