<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<div class="card border-0 shadow-sm rounded-3">
    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <div>
            <h5 class="card-title mb-0 fw-bold text-dark">
                <i class="bi bi-shield-lock-fill text-primary me-2"></i> User Roles & Access Control
            </h5>
            <small class="text-muted">Manage group roles and module-level permissions cloned from AURA_v1 architecture</small>
        </div>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th style="width: 80px;" class="text-center">Role ID</th>
                        <th style="width: 200px;">Internal Name</th>
                        <th>Display Name / Description</th>
                        <th style="width: 180px;" class="text-center">Privilege Level</th>
                        <th style="width: 150px;" class="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($groups)): ?>
                        <?php foreach ($groups as $group): ?>
                            <tr>
                                <td class="text-center fw-bold text-secondary">#<?= (int)$group->id; ?></td>
                                <td>
                                    <code><?= html_escape($group->name); ?></code>
                                </td>
                                <td>
                                    <strong><?= html_escape($group->description); ?></strong>
                                    <?php if ($group->id == 1): ?>
                                        <span class="badge bg-danger ms-2">Super Admin</span>
                                    <?php elseif ($group->id == 2): ?>
                                        <span class="badge bg-primary ms-2">Admin</span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-center">
                                    <?php if ($group->id == 1): ?>
                                        <span class="badge bg-danger-subtle text-danger border border-danger-subtle">
                                            Universal Bypass
                                        </span>
                                    <?php elseif ($group->id == 2): ?>
                                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                                            Admin Bypass
                                        </span>
                                    <?php else: ?>
                                        <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                                            Matrix Configured
                                        </span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-center">
                                    <?php if ($group->id == 1): ?>
                                        <button class="btn btn-sm btn-outline-secondary" disabled title="Owner role has full privileges by default">
                                            <i class="bi bi-lock-fill"></i> Locked
                                        </button>
                                    <?php else: ?>
                                        <a href="<?= site_url('admins/permissions/edit/' . $group->id); ?>" class="btn btn-sm btn-primary">
                                            <i class="bi bi-sliders me-1"></i> Edit Matrix
                                        </a>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="5" class="text-center py-4 text-muted">No roles found in <code>aura_groups</code>.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
