<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h4 class="fw-bold mb-1"><i class="bi bi-box-seam text-primary me-2"></i> Products Catalog</h4>
        <span class="text-muted small">Live catalog loaded from <code>aura_products</code> (Protected by <code>products-index</code>)</span>
    </div>
    <div>
        <?php if (has_permission('products-add')): ?>
            <a href="<?= site_url('admins/products/add'); ?>" class="btn btn-primary">
                <i class="bi bi-plus-lg me-1"></i> Add New Product
            </a>
        <?php endif; ?>
    </div>
</div>

<div class="card border-0 shadow-sm rounded-3">
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th style="width: 70px;" class="text-center">ID</th>
                        <th style="width: 120px;">Code</th>
                        <th>Product Name</th>
                        <th style="width: 150px;">Category</th>
                        <th style="width: 120px;" class="text-end">Price</th>
                        <th style="width: 100px;" class="text-center">Stock</th>
                        <th style="width: 140px;" class="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($products)): ?>
                        <?php foreach ($products as $prod): ?>
                            <tr>
                                <td class="text-center text-muted fw-bold">#<?= (int)$prod->id; ?></td>
                                <td><code><?= html_escape($prod->code ?: '-'); ?></code></td>
                                <td class="fw-semibold text-dark"><?= html_escape($prod->name); ?></td>
                                <td class="text-secondary small"><?= html_escape($prod->category_name ?: 'General'); ?></td>
                                <td class="text-end font-monospace fw-bold">$<?= number_format((float)$prod->price, 2); ?></td>
                                <td class="text-center">
                                    <span class="badge <?= ($prod->quantity > 0) ? 'bg-success' : 'bg-secondary'; ?>">
                                        <?= (float)$prod->quantity; ?>
                                    </span>
                                </td>
                                <td class="text-center">
                                    <div class="btn-group btn-group-sm">
                                        <?php if (has_permission('products-edit')): ?>
                                            <a href="<?= site_url('admins/products/edit/' . $prod->id); ?>" class="btn btn-outline-primary" title="Edit">
                                                <i class="bi bi-pencil"></i>
                                            </a>
                                        <?php endif; ?>
                                        
                                        <?php if (has_permission('products-delete')): ?>
                                            <a href="<?= site_url('admins/products/delete/' . $prod->id); ?>" 
                                               class="btn btn-outline-danger" 
                                               onclick="return confirm('Are you sure you want to delete this product?');"
                                               title="Delete">
                                                <i class="bi bi-trash"></i>
                                            </a>
                                        <?php endif; ?>

                                        <?php if (!has_permission('products-edit') && !has_permission('products-delete')): ?>
                                            <span class="badge bg-light text-muted border">Read Only</span>
                                        <?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="7" class="text-center py-5 text-muted">No products found.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
