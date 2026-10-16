<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * Roles & Permissions Management Controller
 * Cloned and adapted from AURA_v1's System_settings::permissions concept.
 * Protected by Admin_Controller session verification and 'group_permissions-index' permission check.
 */
class Permissions extends Admin_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('Permission_model');

        // Enforce permission: only users with 'group_permissions-index' (or Owner/Admin) can manage roles
        $this->check_permission('group_permissions-index');
    }

    /**
     * GET /admins/permissions - List all roles
     */
    public function index()
    {
        $groups = $this->Permission_model->get_groups();

        $data = array(
            'title'      => 'Roles & Permissions Management',
            'active_tab' => 'settings',
            'groups'     => $groups
        );

        $this->page_construct('admins/permissions/index', $data);
    }

    /**
     * GET/POST /admins/permissions/edit/:id - Edit permission matrix for a role
     * 
     * @param int $group_id
     */
    public function edit($group_id = NULL)
    {
        $group_id = (int) $group_id;
        $group = $this->Permission_model->get_group($group_id);

        if (!$group) {
            $this->session->set_flashdata('error', 'Specified role was not found.');
            redirect('admins/permissions');
            return;
        }

        // Cannot edit Super Admin (Owner) role permissions directly as they are universally granted
        if ($group_id === 1) {
            $this->session->set_flashdata('warning', 'The Owner role has full, irrevocable system privileges by default.');
        }

        $schema = $this->Permission_model->get_matrix_schema();

        // Handle POST update
        if ($this->input->post('save_permissions')) {
            $permissions_data = array();

            foreach ($schema as $module_key => $module_info) {
                foreach ($module_info['actions'] as $action_key => $action_label) {
                    $field_name = ($action_key === 'group_permissions-index') ? $action_key : "{$module_key}-{$action_key}";
                    $permissions_data[$field_name] = $this->input->post($field_name) ? 1 : 0;
                }
            }

            $this->Permission_model->update_permissions($group_id, $permissions_data);
            $this->session->set_flashdata('message', 'Permissions for "' . html_escape($group->description) . '" updated successfully.');
            redirect('admins/permissions/edit/' . $group_id);
            return;
        }

        // Retrieve current permissions record
        $current_permissions = $this->Permission_model->get_permissions($group_id);

        $data = array(
            'title'               => 'Edit Permissions: ' . $group->description,
            'active_tab'          => 'settings',
            'group'               => $group,
            'schema'              => $schema,
            'current_permissions' => $current_permissions ? (array)$current_permissions : array()
        );

        $this->page_construct('admins/permissions/edit', $data);
    }
}
