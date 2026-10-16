<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($title) ? html_escape($title) : 'AuraSupply Admin Login'; ?></title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .login-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 440px;
            padding: 2.5rem;
        }
        .brand-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 52px;
            height: 52px;
            border-radius: 12px;
            background: #0284c7;
            color: #fff;
            font-size: 24px;
            margin-bottom: 1rem;
        }
        .form-control:focus {
            border-color: #0284c7;
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }
        .btn-primary {
            background-color: #0284c7;
            border-color: #0284c7;
            padding: 0.75rem 1rem;
            font-weight: 600;
        }
        .btn-primary:hover {
            background-color: #0369a1;
            border-color: #0369a1;
        }
    </style>
</head>
<body>

<div class="login-card">
    <div class="text-center mb-4">
        <div class="brand-badge">
            <i class="bi bi-shield-lock-fill"></i>
        </div>
        <h3 class="fw-bold text-dark">AuraSupply Admin</h3>
        <p class="text-muted small">Sign in to manage inventory, catalog, and permissions</p>
    </div>

    <!-- Flash Error / Validation Messages -->
    <?php if (!empty($error)): ?>
        <div class="alert alert-danger d-flex align-items-center mb-3" role="alert">
            <i class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2"></i>
            <div><?= $error; ?></div>
        </div>
    <?php endif; ?>

    <!-- Flash Success Messages -->
    <?php if (!empty($message)): ?>
        <div class="alert alert-success d-flex align-items-center mb-3" role="alert">
            <i class="bi bi-check-circle-fill flex-shrink-0 me-2"></i>
            <div><?= $message; ?></div>
        </div>
    <?php endif; ?>

    <!-- Login Form with CSRF Protection -->
    <?= form_open('admins/login', array('class' => 'needs-validation', 'autocomplete' => 'off')); ?>
        <div class="mb-3">
            <label for="identity" class="form-label fw-semibold text-secondary small">Username or Email</label>
            <div class="input-group">
                <span class="input-group-text bg-light text-muted"><i class="bi bi-person"></i></span>
                <input type="text" class="form-control" id="identity" name="identity" 
                       value="<?= set_value('identity', 'admin'); ?>" 
                       placeholder="admin or email@domain.com" required autofocus>
            </div>
        </div>

        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <label for="password" class="form-label fw-semibold text-secondary small">Password</label>
            </div>
            <div class="input-group">
                <span class="input-group-text bg-light text-muted"><i class="bi bi-key"></i></span>
                <input type="password" class="form-control" id="password" name="password" 
                       placeholder="••••••••" required>
            </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="remember" id="remember" value="1">
                <label class="form-check-label text-muted small" for="remember">
                    Remember session
                </label>
            </div>
        </div>

        <button type="submit" class="btn btn-primary w-100 rounded-3">
            <i class="bi bi-box-arrow-in-right me-1"></i> Sign In to Admin Area
        </button>
    <?= form_close(); ?>

    <div class="mt-4 pt-3 border-top text-center text-muted small">
        <span>Default Admin: <code>admin</code> / <code>admin123</code></span>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
