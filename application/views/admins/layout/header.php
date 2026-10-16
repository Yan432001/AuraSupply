<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($title) ? html_escape($title) . ' | AuraSupply Admin' : 'AuraSupply ERP Admin'; ?></title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        :root {
            --sidebar-width: 260px;
            --primary-color: #0284c7;
            --sidebar-bg: #0f172a;
            --sidebar-text: #94a3b8;
            --sidebar-hover: #1e293b;
            --sidebar-active: #0284c7;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f8fafc;
            min-height: 100vh;
        }
        #sidebar-wrapper {
            width: var(--sidebar-width);
            background: var(--sidebar-bg);
            min-height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
            transition: all 0.3s;
            overflow-y: auto;
        }
        .sidebar-brand {
            padding: 1.25rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: #ffffff;
            font-weight: 700;
            font-size: 1.15rem;
            text-decoration: none;
            border-bottom: 1px solid #1e293b;
        }
        .nav-section-title {
            padding: 1rem 1.5rem 0.4rem;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
        }
        .sidebar-nav {
            list-style: none;
            padding: 0.5rem 0;
            margin: 0;
        }
        .sidebar-nav li a {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.65rem 1.5rem;
            color: var(--sidebar-text);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        .sidebar-nav li a:hover {
            color: #ffffff;
            background-color: var(--sidebar-hover);
        }
        .sidebar-nav li a.active {
            color: #ffffff;
            background-color: var(--sidebar-active);
            font-weight: 600;
        }
        .sidebar-nav li a i {
            font-size: 1.1rem;
        }
        #page-content-wrapper {
            margin-left: var(--sidebar-width);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .top-navbar {
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            padding: 0.75rem 1.75rem;
        }
        .main-content {
            padding: 1.75rem;
            flex-grow: 1;
        }
        .badge-role {
            font-size: 0.75rem;
            padding: 0.35em 0.65em;
            border-radius: 9999px;
        }
    </style>
</head>
<body>

<div class="d-flex">
    <!-- Sidebar -->
    <div id="sidebar-wrapper">
        <a href="<?= site_url('admins/dashboard'); ?>" class="sidebar-brand">
            <i class="bi bi-boxes text-info"></i>
            <span>AuraSupply ERP</span>
        </a>

        <!-- User Role Summary Badge -->
        <div class="px-3 py-3 mx-3 my-2 rounded" style="background: #1e293b;">
            <div class="text-white small fw-bold text-truncate"><?= html_escape($this->session->userdata('username')); ?></div>
            <div class="mt-1">
                <?php if ($this->session->userdata('role_id') == 1): ?>
                    <span class="badge bg-danger badge-role"><i class="bi bi-star-fill me-1"></i> Owner</span>
                <?php elseif ($this->session->userdata('role_id') == 2): ?>
                    <span class="badge bg-primary badge-role"><i class="bi bi-shield-check me-1"></i> Admin</span>
                <?php else: ?>
                    <span class="badge bg-secondary badge-role"><?= html_escape($this->session->userdata('role_name')); ?></span>
                <?php endif; ?>
            </div>
        </div>

        <ul class="sidebar-nav">
            <li class="nav-section-title">Core</li>
            <li>
                <a href="<?= site_url('admins/dashboard'); ?>" class="<?= (isset($active_tab) && $active_tab === 'dashboard') ? 'active' : ''; ?>">
                    <i class="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                </a>
            </li>

            <!-- Catalog & Products: Conditional upon 'products-index' -->
            <?php if (has_permission('products-index')): ?>
                <li class="nav-section-title">Catalog & Inventory</li>
                <li>
                    <a href="<?= site_url('admins/products'); ?>" class="<?= (isset($active_tab) && $active_tab === 'products') ? 'active' : ''; ?>">
                        <i class="bi bi-box-seam"></i>
                        <span>Products List</span>
                    </a>
                </li>
                <?php if (has_permission('products-add')): ?>
                <li>
                    <a href="<?= site_url('admins/products/add'); ?>">
                        <i class="bi bi-plus-circle"></i>
                        <span>Add Product</span>
                    </a>
                </li>
                <?php endif; ?>
            <?php endif; ?>

            <!-- Commercial Operations: Conditional upon permissions -->
            <?php if (has_permission('sales-index') || has_permission('purchases-index') || has_permission('quotes-index')): ?>
                <li class="nav-section-title">Commerce</li>
                <?php if (has_permission('sales-index')): ?>
                <li>
                    <a href="#" class="text-muted" title="Sales Orders">
                        <i class="bi bi-receipt"></i>
                        <span>Sales Orders</span>
                    </a>
                </li>
                <?php endif; ?>
                <?php if (has_permission('purchases-index')): ?>
                <li>
                    <a href="#" class="text-muted" title="Purchases">
                        <i class="bi bi-cart-check"></i>
                        <span>Purchases</span>
                    </a>
                </li>
                <?php endif; ?>
                <?php if (has_permission('quotes-index')): ?>
                <li>
                    <a href="#" class="text-muted" title="Quotations">
                        <i class="bi bi-chat-square-quote"></i>
                        <span>Quotations</span>
                    </a>
                </li>
                <?php endif; ?>
            <?php endif; ?>

            <!-- Partners / CRM -->
            <?php if (has_permission('customers-index') || has_permission('suppliers-index')): ?>
                <li class="nav-section-title">People & Partners</li>
                <?php if (has_permission('customers-index')): ?>
                <li>
                    <a href="#" class="text-muted">
                        <i class="bi bi-people"></i>
                        <span>Customers</span>
                    </a>
                </li>
                <?php endif; ?>
                <?php if (has_permission('suppliers-index')): ?>
                <li>
                    <a href="#" class="text-muted">
                        <i class="bi bi-truck"></i>
                        <span>Suppliers</span>
                    </a>
                </li>
                <?php endif; ?>
            <?php endif; ?>

            <!-- Administration & Governance -->
            <?php if (has_permission('group_permissions-index') || has_permission('users-index') || has_permission('system_settings-index')): ?>
                <li class="nav-section-title">Administration</li>
                
                <?php if (has_permission('group_permissions-index')): ?>
                <li>
                    <a href="<?= site_url('admins/permissions'); ?>" class="<?= (isset($active_tab) && $active_tab === 'settings') ? 'active' : ''; ?>">
                        <i class="bi bi-shield-lock"></i>
                        <span>Roles & Permissions</span>
                    </a>
                </li>
                <?php endif; ?>

                <?php if (has_permission('users-index')): ?>
                <li>
                    <a href="#" class="text-muted">
                        <i class="bi bi-person-badge"></i>
                        <span>Staff Users</span>
                    </a>
                </li>
                <?php endif; ?>
            <?php endif; ?>
        </ul>

        <!-- Bottom Session Logout Link -->
        <div class="p-3 mt-auto">
            <a href="<?= site_url('admins/logout'); ?>" class="btn btn-outline-danger btn-sm w-100">
                <i class="bi bi-box-arrow-left me-1"></i> Sign Out
            </a>
        </div>
    </div>

    <!-- Main Content Area -->
    <div id="page-content-wrapper">
        <!-- Top Navbar -->
        <nav class="navbar top-navbar d-flex justify-content-between align-items-center">
            <div>
                <span class="fs-5 fw-bold text-dark"><?= isset($title) ? html_escape($title) : 'Dashboard'; ?></span>
            </div>
            <div class="d-flex align-items-center gap-3">
                <span class="text-secondary small">
                    Signed in as <strong><?= html_escape($this->session->userdata('username')); ?></strong>
                    (<?= html_escape($this->session->userdata('role_name') ?: 'Staff'); ?>)
                </span>
                <a href="<?= site_url('admins/logout'); ?>" class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-power"></i> Logout
                </a>
            </div>
        </nav>

        <!-- Flash Notifications -->
        <div class="container-fluid px-4 pt-3">
            <?php if ($this->session->flashdata('message')): ?>
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <i class="bi bi-check-circle-fill me-2"></i><?= $this->session->flashdata('message'); ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>

            <?php if ($this->session->flashdata('error')): ?>
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i><?= $this->session->flashdata('error'); ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>

            <?php if ($this->session->flashdata('warning')): ?>
                <div class="alert alert-warning alert-dismissible fade show" role="alert">
                    <i class="bi bi-exclamation-circle-fill me-2"></i><?= $this->session->flashdata('warning'); ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <?php endif; ?>
        </div>

        <!-- Main View Content Injected Here -->
        <main class="main-content">
