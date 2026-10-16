<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<div class="row justify-content-center">
    <div class="col-md-8 col-lg-6">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="fw-bold mb-0"><i class="bi bi-plus-circle text-primary me-2"></i> Add New Product</h4>
            <a href="<?= site_url('admins/products'); ?>" class="btn btn-outline-secondary btn-sm">
                <i class="bi bi-arrow-left me-1"></i> Back to Products
            </a>
        </div>

        <div class="card border-0 shadow-sm rounded-3">
            <div class="card-body p-4">
                <?= form_open('admins/products/add'); ?>
                    <input type="hidden" name="save_product" value="1">

                    <div class="mb-3">
                        <label for="code" class="form-label fw-semibold small text-secondary">Product Code / SKU</label>
                        <input type="text" class="form-control" id="code" name="code" placeholder="e.g. PRD-001" required>
                    </div>

                    <div class="mb-3">
                        <label for="name" class="form-label fw-semibold small text-secondary">Product Name</label>
                        <input type="text" class="form-control" id="name" name="name" placeholder="e.g. Aura Wireless Keyboard" required>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label for="price" class="form-label fw-semibold small text-secondary">Unit Price ($)</label>
                            <input type="number" step="0.01" class="form-control" id="price" name="price" placeholder="0.00" required>
                        </div>
                        <div class="col-md-6">
                            <label for="quantity" class="form-label fw-semibold small text-secondary">Initial Stock Quantity</label>
                            <input type="number" step="1" class="form-control" id="quantity" name="quantity" placeholder="10" required>
                        </div>
                    </div>

                    <div class="d-flex justify-content-end gap-2 mt-4">
                        <a href="<?= site_url('admins/products'); ?>" class="btn btn-outline-secondary">Cancel</a>
                        <button type="submit" class="btn btn-primary px-4">
                            <i class="bi bi-check-lg me-1"></i> Save Product
                        </button>
                    </div>
                <?= form_close(); ?>
            </div>
        </div>
    </div>
</div>
