<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * Admin Authentication Controller
 * Handles /admins/login and /admins/logout with session management, CSRF validation, and flash feedback.
 */
class Auth extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('Auth_model');
        $this->load->library('form_validation');
    }

    /**
     * GET /admins/login - Display login form
     * POST /admins/login - Authenticate credentials & establish session
     */
    public function login()
    {
        // 1. If already logged in, redirect directly to dashboard
        if ($this->session->userdata('logged_in')) {
            redirect('admins/dashboard');
            return;
        }

        // 2. Set Validation Rules
        $this->form_validation->set_rules('identity', 'Username or Email', 'trim|required', array(
            'required' => 'Please enter your username or registered email address.'
        ));
        $this->form_validation->set_rules('password', 'Password', 'trim|required', array(
            'required' => 'Please enter your account password.'
        ));

        // 3. Process Authentication on Form Submission
        if ($this->form_validation->run() === TRUE) {
            $identity = $this->input->post('identity', TRUE);
            $password = $this->input->post('password');
            $remember = (bool) $this->input->post('remember');

            $result = $this->Auth_model->login($identity, $password, $remember);

            if ($result['status'] === TRUE) {
                // Successful Login
                $this->session->set_flashdata('message', 'Welcome back, ' . html_escape($result['user']->first_name ?: $result['user']->username) . '!');
                
                // Redirect to deep-linked requested page or default dashboard
                $requested_page = $this->session->userdata('requested_page');
                if (!empty($requested_page) && $requested_page !== 'admins/login' && $requested_page !== 'admins/logout') {
                    $this->session->unset_userdata('requested_page');
                    redirect($requested_page);
                } else {
                    redirect('admins/dashboard');
                }
                return;
            } else {
                // Failed Login
                $this->session->set_flashdata('error', $result['message']);
                redirect('admins/login');
                return;
            }
        }

        // 4. Render Login View
        $data = array(
            'title'     => 'AuraSupply Admin - Login',
            'error'     => validation_errors() ? validation_errors() : $this->session->flashdata('error'),
            'message'   => $this->session->flashdata('message')
        );

        $this->load->view('admins/auth/login', $data);
    }

    /**
     * GET/POST /admins/logout - Destroy session & redirect to login
     */
    public function logout()
    {
        $this->Auth_model->logout();
        $this->session->set_flashdata('message', 'You have been signed out successfully.');
        redirect('admins/login');
    }
}
