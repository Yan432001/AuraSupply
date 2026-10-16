<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<div class="row justify-content-center py-5">
    <div class="col-md-8 col-lg-6 text-center">
        <div class="mb-4">
            <span class="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle p-4">
                <i class="bi bi-shield-x display-1"></i>
            </span>
        </div>
        <h1 class="display-5 fw-bold text-dark mb-2">403 - Access Denied</h1>
        <p class="lead text-secondary mb-4">
            You do not have sufficient permissions to access this administrative module or perform this action.
        </p>

        <?php if (!empty($missing_permission)): ?>
            <div class="card bg-light border-0 mb-4 p-3 text-start">
                <div class="d-flex align-items-center justify-content-between">
                    <span class="text-secondary small fw-bold">Required Permission Key:</span>
                    <span class="badge bg-danger fs-6 font-monospace"><?= html_escape($missing_permission); ?></span>
                </div>
                <?php if (!empty($requested_url)): ?>
                    <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
                        <span class="text-secondary small fw-bold">Target URI:</span>
                        <code class="small text-truncate"><?= html_escape($requested_url); ?></code>
                    </div>
                <?php endif; ?>
                <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
                    <span class="text-secondary small fw-bold">Current Assigned Role:</span>
                    <span class="badge bg-secondary"><?= html_escape($this->session->userdata('role_name') ?: 'Unknown'); ?></span>
                </div>
            </div>
        <?php endif; ?>

        <div class="d-flex justify-content-center gap-3">
            <a href="<?= site_url('admins/dashboard'); ?>" class="btn btn-primary">
                <i class="bi bi-house-door me-1"></i> Return to Dashboard
            </a>
            <a href="javascript:history.back()" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-1"></i> Go Back
            </a>
        </div>
    </div>
</div>
