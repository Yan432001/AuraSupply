<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * Admin Dashboard Controller
 * Protected by Admin_Controller (session & permissions)
 */
class Dashboard extends Admin_Controller
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * GET /admins and /admins/dashboard
     */
    public function index()
    {
        $data = array(
            'title' => 'Dashboard Overview',
            'active_tab' => 'dashboard'
        );

        $this->page_construct('admins/dashboard/index', $data);
    }
}
