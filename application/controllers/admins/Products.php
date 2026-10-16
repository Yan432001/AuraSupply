<?php
defined('BASEPATH') or exit('No direct script access allowed');

/**
 * Admin Products Controller
 * Demonstrates granular permission checks on individual methods:
 * - index()  -> requires 'products-index'
 * - add()    -> requires 'products-add'
 * - edit()   -> requires 'products-edit'
 * - delete() -> requires 'products-delete'
 */
class Products extends Admin_Controller
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * GET /admins/products
     */
    public function index()
    {
        // Enforce view permission
        $this->check_permission('products-index');

        $this->db->select('p.id, p.code, p.name, p.price, p.quantity, p.image, c.name as category_name');
        $this->db->from('products p');
        $this->db->join('categories c', 'c.id = p.category_id', 'left');
        $this->db->limit(50);
        $products = $this->db->get()->result();

        $data = array(
            'title'      => 'Products Management',
            'active_tab' => 'products',
            'products'   => $products
        );

        $this->page_construct('admins/products/index', $data);
    }

    /**
     * GET/POST /admins/products/add
     */
    public function add()
    {
        // Enforce add permission
        $this->check_permission('products-add');

        if ($this->input->post('save_product')) {
            $product_data = array(
                'code'        => $this->input->post('code', TRUE),
                'name'        => $this->input->post('name', TRUE),
                'price'       => (float) $this->input->post('price'),
                'category_id' => (int) $this->input->post('category_id'),
                'quantity'    => (float) $this->input->post('quantity')
            );
            $this->db->insert('products', $product_data);
            $this->session->set_flashdata('message', 'Product added successfully.');
            redirect('admins/products');
            return;
        }

        $data = array(
            'title'      => 'Add Product',
            'active_tab' => 'products'
        );

        $this->page_construct('admins/products/add', $data);
    }

    /**
     * GET/POST /admins/products/edit/:id
     */
    public function edit($id = NULL)
    {
        // Enforce edit permission
        $this->check_permission('products-edit');

        $id = (int)$id;
        $product = $this->db->get_where('products', array('id' => $id), 1)->row();
        if (!$product) {
            $this->session->set_flashdata('error', 'Product not found.');
            redirect('admins/products');
            return;
        }

        if ($this->input->post('update_product')) {
            $product_data = array(
                'code'        => $this->input->post('code', TRUE),
                'name'        => $this->input->post('name', TRUE),
                'price'       => (float) $this->input->post('price'),
                'category_id' => (int) $this->input->post('category_id'),
                'quantity'    => (float) $this->input->post('quantity')
            );
            $this->db->update('products', $product_data, array('id' => $id));
            $this->session->set_flashdata('message', 'Product updated successfully.');
            redirect('admins/products');
            return;
        }

        $data = array(
            'title'      => 'Edit Product: ' . $product->name,
            'active_tab' => 'products',
            'product'    => $product
        );

        $this->page_construct('admins/products/edit', $data);
    }

    /**
     * POST /admins/products/delete/:id
     */
    public function delete($id = NULL)
    {
        // Enforce delete permission
        $this->check_permission('products-delete');

        $id = (int)$id;
        $this->db->delete('products', array('id' => $id));
        $this->session->set_flashdata('message', 'Product deleted successfully.');
        redirect('admins/products');
    }
}
