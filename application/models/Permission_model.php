<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * Permission Model (CI_Model)
 * Handles role management, group querying, and permission assignments
 */
class Permission_model extends CI_Model
{
    protected $table_groups      = 'groups';
    protected $table_permissions = 'permissions';

    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Get all roles/groups
     * @return array
     */
    public function get_groups()
    {
        $this->db->order_by('id', 'ASC');
        $q = $this->db->get($this->table_groups);
        return $q->result();
    }

    /**
     * Get single group by ID
     * @param int $id
     * @return object|null
     */
    public function get_group($id)
    {
        $q = $this->db->get_where($this->table_groups, array('id' => (int)$id), 1);
        return ($q->num_rows() > 0) ? $q->row() : NULL;
    }

    /**
     * Get permissions row for specific group
     * @param int $group_id
     * @return object|null
     */
    public function get_permissions($group_id)
    {
        $q = $this->db->get_where($this->table_permissions, array('group_id' => (int)$group_id), 1);
        if ($q->num_rows() > 0) {
            return $q->row();
        }
        return NULL;
    }

    /**
     * Update permissions for a group
     * 
     * @param int   $group_id
     * @param array $permissions_data Key-value pairs (permission_key => 0|1)
     * @return bool
     */
    public function update_permissions($group_id, $permissions_data)
    {
        $group_id = (int) $group_id;
        $existing = $this->get_permissions($group_id);

        if ($existing) {
            return $this->db->update($this->table_permissions, $permissions_data, array('group_id' => $group_id));
        } else {
            $permissions_data['group_id'] = $group_id;
            return $this->db->insert($this->table_permissions, $permissions_data);
        }
    }

    /**
     * Get permission modules matrix structure for UI rendering
     * @return array
     */
    public function get_matrix_schema()
    {
        return array(
            'products' => array(
                'title' => 'Products & Catalog',
                'actions' => array(
                    'index'       => 'View Products List',
                    'add'         => 'Create New Product',
                    'edit'        => 'Edit Product Details',
                    'delete'      => 'Delete Product',
                    'cost'        => 'View Product Cost',
                    'price'       => 'View/Edit Selling Price',
                    'import'      => 'Import CSV/Excel Products',
                    'export'      => 'Export Products',
                    'adjustments' => 'Stock Quantity Adjustments'
                )
            ),
            'sales' => array(
                'title' => 'Sales & Commercial Orders',
                'actions' => array(
                    'index'      => 'View Sales List',
                    'add'        => 'Create Sale / Invoice',
                    'edit'       => 'Edit Sale',
                    'delete'     => 'Delete Sale',
                    'export'     => 'Export Sales Orders',
                    'payments'   => 'Record / Collect Payments',
                    'deliveries' => 'Manage Delivery Dispatches'
                )
            ),
            'purchases' => array(
                'title' => 'Purchases & Inbound Freight',
                'actions' => array(
                    'index'    => 'View Purchases',
                    'add'      => 'Create Purchase Order',
                    'edit'     => 'Edit Purchase Order',
                    'delete'   => 'Delete Purchase',
                    'payments' => 'Supplier Payment Vouchers'
                )
            ),
            'quotes' => array(
                'title' => 'Quotations & B2B Inquiries',
                'actions' => array(
                    'index'  => 'View Quotations',
                    'add'    => 'Create Quotation',
                    'edit'   => 'Edit Quotation',
                    'delete' => 'Delete Quotation'
                )
            ),
            'customers' => array(
                'title' => 'Customer Profiles',
                'actions' => array(
                    'index'  => 'View Customers',
                    'add'    => 'Register Customer',
                    'edit'   => 'Edit Customer',
                    'delete' => 'Delete Customer'
                )
            ),
            'suppliers' => array(
                'title' => 'Suppliers & Vendors',
                'actions' => array(
                    'index'  => 'View Suppliers',
                    'add'    => 'Register Supplier',
                    'edit'   => 'Edit Supplier',
                    'delete' => 'Delete Supplier'
                )
            ),
            'users' => array(
                'title' => 'User Accounts & Staff',
                'actions' => array(
                    'index'  => 'View Staff Accounts',
                    'add'    => 'Invite / Add Staff',
                    'edit'   => 'Edit Staff Account',
                    'delete' => 'Delete Staff Account'
                )
            ),
            'system_settings' => array(
                'title' => 'System Governance',
                'actions' => array(
                    'index' => 'Access System Settings',
                    'group_permissions-index' => 'Manage Role Permissions'
                )
            )
        );
    }
}
