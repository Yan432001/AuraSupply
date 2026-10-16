<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<div class="row g-4 mb-4">
    <!-- Active User Card -->
    <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-3 h-100">
            <div class="card-body p-4">
                <div class="d-flex align-items-center mb-3">
                    <div class="p-3 bg-primary bg-opacity-10 rounded-circle text-primary me-3">
                        <i class="bi bi-person-badge fs-3"></i>
                    </div>
                    <div>
                        <h6 class="text-muted text-uppercase mb-1 small fw-bold">Active User</h6>
                        <h4 class="mb-0 fw-bold"><?= html_escape($username); ?></h4>
                    </div>
                </div>
                <div class="border-top pt-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-secondary small">User ID:</span>
                        <span class="fw-semibold small">#<?= (int)$user_id; ?></span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-secondary small">Role:</span>
                        <span class="fw-semibold small text-primary"><?= html_escape($role_name); ?></span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span class="text-secondary small">Access Mode:</span>
                        <span class="fw-semibold small <?= ($Owner || $Admin) ? 'text-success' : 'text-info'; ?>">
                            <?= ($Owner || $Admin) ? 'Full System Bypass' : 'Granular RBAC'; ?>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Active Permissions Count Card -->
    <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-3 h-100">
            <div class="card-body p-4">
                <div class="d-flex align-items-center mb-3">
                    <div class="p-3 bg-success bg-opacity-10 rounded-circle text-success me-3">
                        <i class="bi bi-shield-check fs-3"></i>
                    </div>
                    <div>
                        <h6 class="text-muted text-uppercase mb-1 small fw-bold">Session Security</h6>
                        <h4 class="mb-0 fw-bold"><?= ($Owner || $Admin) ? 'Universal' : count(array_filter($permissions)) . ' Granted'; ?></h4>
                    </div>
                </div>
                <div class="border-top pt-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-secondary small">Session Driver:</span>
                        <span class="fw-semibold small">CI3 Native Files</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-secondary small">CSRF Protection:</span>
                        <span class="fw-semibold small text-success">Enabled (Cookie)</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span class="text-secondary small">Architecture:</span>
                        <span class="fw-semibold small">AURA_v1 Cloned</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Navigation Gate Card -->
    <div class="col-md-4">
        <div class="card border-0 shadow-sm rounded-3 h-100">
            <div class="card-body p-4">
                <div class="d-flex align-items-center mb-3">
                    <div class="p-3 bg-info bg-opacity-10 rounded-circle text-info me-3">
                        <i class="bi bi-layers fs-3"></i>
                    </div>
                    <div>
                        <h6 class="text-muted text-uppercase mb-1 small fw-bold">Quick Actions</h6>
                        <h4 class="mb-0 fw-bold">Modules</h4>
                    </div>
                </div>
                <div class="d-grid gap-2 pt-2">
                    <?php if (has_permission('products-index')): ?>
                        <a href="<?= site_url('admins/products'); ?>" class="btn btn-outline-primary btn-sm text-start">
                            <i class="bi bi-box-seam me-2"></i> Manage Products
                        </a>
                    <?php endif; ?>
                    <?php if (has_permission('group_permissions-index')): ?>
                        <a href="<?= site_url('admins/permissions'); ?>" class="btn btn-outline-dark btn-sm text-start">
                            <i class="bi bi-shield-lock me-2"></i> Configure Permissions
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Dynamic RBAC Overview Table -->
<div class="card border-0 shadow-sm rounded-3">
    <div class="card-header bg-white py-3">
        <h5 class="card-title mb-0 fw-bold text-dark">
            <i class="bi bi-key-fill text-warning me-2"></i> Active Session Permissions Diagnostic
        </h5>
    </div>
    <div class="card-body">
        <p class="text-muted small mb-3">
            The table below reflects the dynamic permissions verified by <code>Admin_Controller</code> and <code>has_permission()</code> for this session:
        </p>
        <div class="table-responsive">
            <table class="table table-bordered table-striped align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th style="width: 30%;">Permission Key</th>
                        <th style="width: 40%;">Description</th>
                        <th style="width: 30%;" class="text-center">Status For Current User</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>products-index</code></td>
                        <td>Browse products catalog in /admins/products</td>
                        <td class="text-center">
                            <?php if (has_permission('products-index')): ?>
                                <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> GRANTED</span>
                            <?php else: ?>
                                <span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i> DENIED (403)</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <td><code>products-add</code></td>
                        <td>Create new inventory items in /admins/products/add</td>
                        <td class="text-center">
                            <?php if (has_permission('products-add')): ?>
                                <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> GRANTED</span>
                            <?php else: ?>
                                <span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i> DENIED (403)</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <td><code>products-delete</code></td>
                        <td>Delete products from catalog</td>
                        <td class="text-center">
                            <?php if (has_permission('products-delete')): ?>
                                <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> GRANTED</span>
                            <?php else: ?>
                                <span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i> DENIED (403)</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <td><code>group_permissions-index</code></td>
                        <td>View and adjust group permission matrices in /admins/permissions</td>
                        <td class="text-center">
                            <?php if (has_permission('group_permissions-index')): ?>
                                <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> GRANTED</span>
                            <?php else: ?>
                                <span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i> DENIED (403)</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <td><code>sales-index</code></td>
                        <td>View sales transactions and commercial orders</td>
                        <td class="text-center">
                            <?php if (has_permission('sales-index')): ?>
                                <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> GRANTED</span>
                            <?php else: ?>
                                <span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i> DENIED (403)</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <td><code>system_settings-index</code></td>
                        <td>Global system settings and server configurations</td>
                        <td class="text-center">
                            <?php if (has_permission('system_settings-index')): ?>
                                <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> GRANTED</span>
                            <?php else: ?>
                                <span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i> DENIED (403)</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
