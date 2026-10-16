<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * Authentication Model (CI_Model)
 * Handles user credentials verification, session storage, and permissions hydration.
 */
class Auth_model extends CI_Model
{
    protected $table_users       = 'users';
    protected $table_groups      = 'groups';
    protected $table_permissions = 'permissions';

    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Authenticate user credentials and create session
     * 
     * @param string $identity  Username or Email address
     * @param string $password  Plain-text password to verify
     * @param bool   $remember  Remember-me flag
     * @return array ['status' => bool, 'message' => string, 'user' => object|null]
     */
    public function login($identity, $password, $remember = FALSE)
    {
        $identity = trim($identity);

        // 1. Query active user by username or email
        $this->db->group_start()
                 ->where('username', $identity)
                 ->or_where('email', $identity)
                 ->group_end();
        $this->db->where('active', 1);
        $this->db->order_by('id', 'ASC');
        $query = $this->db->get($this->table_users, 1);

        if ($query->num_rows() < 1) {
            return array('status' => FALSE, 'message' => 'Invalid username or password.');
        }

        $user = $query->row();

        // 3. Verify password (dual algorithm: modern password_verify + legacy ion_auth sha1 upgrade)
        $password_matches = FALSE;

        if (password_verify($password, $user->password)) {
            $password_matches = TRUE;
        } elseif (substr($user->password, 0, 4) === '$2a$' || substr($user->password, 0, 4) === '$2b$' || substr($user->password, 0, 4) === '$2y$') {
            // Standard bcrypt hash verification
            if (password_verify($password, $user->password)) {
                $password_matches = TRUE;
            }
        } elseif (strlen($user->password) === 40) {
            // Legacy Ion Auth Salted SHA1 fallback
            $salt = substr($user->password, 0, 10);
            $candidate = $salt . substr(sha1($salt . $password), 0, 30);
            if ($candidate === $user->password) {
                $password_matches = TRUE;
                // Upgrade hash transparently to modern bcrypt
                $new_hash = password_hash($password, PASSWORD_BCRYPT);
                $this->db->update($this->table_users, array('password' => $new_hash), array('id' => $user->id));
            }
        }

        if (!$password_matches) {
            return array('status' => FALSE, 'message' => 'Invalid username or password.');
        }

        // 4. Retrieve Group / Role
        $role_name = 'user';
        $role_desc = 'User';
        $group_q = $this->db->get_where($this->table_groups, array('id' => $user->group_id), 1);
        if ($group_q->num_rows() > 0) {
            $grp = $group_q->row();
            $role_name = $grp->name;
            $role_desc = $grp->description;
        }

        // 5. Retrieve Permissions for Group
        $permissions = array();
        $perm_q = $this->db->get_where($this->table_permissions, array('group_id' => $user->group_id), 1);
        if ($perm_q->num_rows() > 0) {
            $perm_row = $perm_q->row_array();
            foreach ($perm_row as $key => $val) {
                if ($key !== 'id' && $key !== 'group_id') {
                    $permissions[$key] = (int)$val;
                }
            }
        }

        // 6. Set CodeIgniter Session Data
        $session_data = array(
            'user_id'     => (int) $user->id,
            'username'    => $user->username,
            'email'       => $user->email,
            'first_name'  => $user->first_name,
            'last_name'   => $user->last_name,
            'role_id'     => (int) $user->group_id,
            'role_name'   => $role_name,
            'role_desc'   => $role_desc,
            'permissions' => $permissions,
            'logged_in'   => TRUE
        );
        $this->session->set_userdata($session_data);

        // 7. Update Last Login
        $this->update_last_login($user->id);

        return array('status' => TRUE, 'message' => 'Login successful', 'user' => $user);
    }

    /**
     * Destroy user session
     */
    public function logout()
    {
        $this->session->unset_userdata(array(
            'user_id', 'username', 'email', 'first_name', 'last_name',
            'role_id', 'role_name', 'role_desc', 'permissions', 'logged_in'
        ));
        if (session_id()) {
            $this->session->sess_destroy();
        }
        return TRUE;
    }

    /**
     * Update last login timestamp and IP
     * 
     * @param int $user_id
     */
    public function update_last_login($user_id)
    {
        $this->db->update(
            $this->table_users,
            array(
                'last_login'      => time(),
                'last_ip_address' => $this->input->ip_address()
            ),
            array('id' => $user_id)
        );
    }

    /**
     * Get user details by ID
     * 
     * @param int $id
     * @return object|null
     */
    public function get_user_by_id($id)
    {
        $q = $this->db->get_where($this->table_users, array('id' => (int)$id), 1);
        return ($q->num_rows() > 0) ? $q->row() : NULL;
    }
}
