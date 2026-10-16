<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h4 class="fw-bold mb-1">
            <i class="bi bi-sliders text-primary me-2"></i> Role Permissions: <?= html_escape($group->description); ?>
        </h4>
        <span class="text-muted small">
            System Identifier: <code><?= html_escape($group->name); ?></code> (Role ID #<?= (int)$group->id; ?>)
        </span>
    </div>
    <div>
        <a href="<?= site_url('admins/permissions'); ?>" class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-arrow-left me-1"></i> Back to Roles
        </a>
    </div>
</div>

<div class="card border-0 shadow-sm rounded-3">
    <div class="card-header bg-white py-3 border-bottom">
        <ul class="nav nav-pills card-header-pills" id="permTabs" role="tablist">
            <?php $first = true; foreach ($schema as $module_key => $module_info): ?>
                <li class="nav-item" role="presentation">
                    <button class="nav-link <?= $first ? 'active' : ''; ?> text-capitalize" 
                            id="tab-btn-<?= $module_key; ?>" 
                            data-bs-toggle="pill" 
                            data-bs-target="#tab-<?= $module_key; ?>" 
                            type="button" role="tab">
                        <?= html_escape($module_info['title']); ?>
                    </button>
                </li>
            <?php $first = false; endforeach; ?>
        </ul>
    </div>

    <?= form_open(current_url(), array('id' => 'permissionsForm')); ?>
        <input type="hidden" name="save_permissions" value="1">
        
        <div class="card-body p-4">
            <div class="tab-content" id="permTabsContent">
                <?php $first = true; foreach ($schema as $module_key => $module_info): ?>
                    <div class="tab-pane fade <?= $first ? 'show active' : ''; ?>" id="tab-<?= $module_key; ?>" role="tabpanel">
                        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <h6 class="fw-bold text-dark mb-0"><?= html_escape($module_info['title']); ?> Permissions</h6>
                            <div class="btn-group btn-group-sm">
                                <button type="button" class="btn btn-outline-primary btn-sm" onclick="toggleModuleCheckboxes('tab-<?= $module_key; ?>', true)">
                                    <i class="bi bi-check-all"></i> Select All
                                </button>
                                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="toggleModuleCheckboxes('tab-<?= $module_key; ?>', false)">
                                    <i class="bi bi-x"></i> Deselect All
                                </button>
                            </div>
                        </div>

                        <div class="row g-3">
                            <?php foreach ($module_info['actions'] as $action_key => $action_label): ?>
                                <?php 
                                    $field_name = ($action_key === 'group_permissions-index') ? $action_key : "{$module_key}-{$action_key}";
                                    $is_checked = isset($current_permissions[$field_name]) && ((int)$current_permissions[$field_name] === 1);
                                ?>
                                <div class="col-md-6 col-lg-4">
                                    <div class="p-3 border rounded-3 bg-light-subtle h-100 d-flex align-items-start">
                                        <div class="form-check form-switch me-3 mt-1">
                                            <input class="form-check-input perm-switch" type="checkbox" role="switch" 
                                                   id="chk_<?= str_replace('-', '_', $field_name); ?>" 
                                                   name="<?= html_escape($field_name); ?>" 
                                                   value="1" 
                                                   <?= $is_checked ? 'checked' : ''; ?>>
                                        </div>
                                        <div>
                                            <label class="form-check-label fw-bold text-dark mb-0" for="chk_<?= str_replace('-', '_', $field_name); ?>">
                                                <?= html_escape($action_label); ?>
                                            </label>
                                            <div class="text-muted small">
                                                <code><?= html_escape($field_name); ?></code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php $first = false; endforeach; ?>
            </div>
        </div>

        <div class="card-footer bg-white p-3 border-top d-flex justify-content-between align-items-center">
            <span class="text-muted small">
                Changes take effect immediately upon next request for active users.
            </span>
            <button type="submit" class="btn btn-success px-4">
                <i class="bi bi-check-lg me-1"></i> Save Permission Matrix
            </button>
        </div>
    <?= form_close(); ?>
</div>

<script>
function toggleModuleCheckboxes(containerId, checkState) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var checkboxes = container.querySelectorAll('input.perm-switch');
    checkboxes.forEach(function(cb) {
        cb.checked = checkState;
    });
}
</script>
