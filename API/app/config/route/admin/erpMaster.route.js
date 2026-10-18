const { authenticate, checkModuleEnabled, requireRole, requirePermission, branchScopeFilter } = require('../../../middleware/permission.middleware');

// Controllers
const authCtrl = require('../../../controller/admin/adminAuth.controller');
const userCtrl = require('../../../controller/admin/adminUsers.controller');
const accessCtrl = require('../../../controller/admin/adminAccessControl.controller');
const webAuthCtrl = require('../../../controller/web/webAuth.controller');
const modCtrl = require('../../../controller/admin/adminModules.controller');
const dashCtrl = require('../../../controller/admin/adminDashboard.controller');
const invCtrl = require('../../../controller/admin/adminInventory.controller');
const ordCtrl = require('../../../controller/admin/adminOrders.controller');
const crmCtrl = require('../../../controller/admin/adminCrm.controller');
const setCtrl = require('../../../controller/admin/adminSettings.controller');
const hrCtrl = require('../../../controller/admin/adminHr.controller');
const { db } = require('../../utill/helper');
const { sendSuccess, sendError, sendPaginated } = require('../../utill/response');

module.exports = (app) => {
  // --------------------------------------------------------------------------
  // 1. ADMINISTRATIVE AUTHENTICATION & SESSION LIFECYCLE (/admins)
  // --------------------------------------------------------------------------
  app.post('/api/admin/auth/login', authCtrl.login);
  app.post('/api/admin/login', authCtrl.login);
  app.post('/api/admin/auth/logout', authenticate, authCtrl.logout);
  app.post('/api/admin/auth/refresh', authCtrl.refreshToken);
  app.get('/api/admin/auth/session', authenticate, authCtrl.getProfile);
  app.get('/api/admin/auth/profile', authenticate, authCtrl.getProfile);
  app.put('/api/admin/auth/profile', authenticate, authCtrl.updateProfile);
  app.post('/api/admin/auth/profile', authenticate, authCtrl.updateProfile);
  app.get('/api/admin/profile', authenticate, authCtrl.getProfile);
  app.put('/api/admin/profile', authenticate, authCtrl.updateProfile);
  app.post('/api/admin/auth/change-password', authenticate, authCtrl.changePassword);
  app.put('/api/admin/auth/change-password', authenticate, authCtrl.changePassword);
  app.post('/api/admin/auth/forgot-password', authCtrl.forgotPassword);
  app.post('/api/admin/auth/reset-password', authCtrl.resetPassword);

  // --------------------------------------------------------------------------
  // 2. PUBLIC WEBSITE AUTHENTICATION & REGISTRATION (/shop, B2B Portal)
  // --------------------------------------------------------------------------
  app.post('/api/web/auth/register', webAuthCtrl.register);
  app.post('/api/auth/register', webAuthCtrl.register);
  app.post('/api/web/auth/login', webAuthCtrl.login);
  app.post('/api/auth/web-login', webAuthCtrl.login);
  app.post('/api/web/auth/verify-email', webAuthCtrl.verifyEmail);

  // --------------------------------------------------------------------------
  // 3. ACCESS CONTROL & ROLE GOVERNANCE (aura_groups, aura_group_permissions)
  // --------------------------------------------------------------------------
  app.get('/api/admin/access/groups', authenticate, requirePermission('system_settings'), accessCtrl.getGroups);
  app.put('/api/admin/access/groups/:id', authenticate, requireRole('owner', 'admin'), accessCtrl.updateGroup);

  app.get('/api/admin/access/permission-keys', authenticate, accessCtrl.getPermissionKeys);
  app.get('/api/admin/access/groups/:id/permissions', authenticate, accessCtrl.getGroupPermissions);
  app.put('/api/admin/access/groups/:id/permissions', authenticate, requireRole('owner', 'admin'), accessCtrl.updateGroupPermissions);

  app.get('/api/admin/access/users/:id/overrides', authenticate, accessCtrl.getUserOverrides);
  app.put('/api/admin/access/users/:id/overrides', authenticate, requireRole('owner', 'admin'), accessCtrl.updateUserOverrides);

  app.get('/api/admin/access/users/:id/branches', authenticate, accessCtrl.getUserBranches);
  app.put('/api/admin/access/users/:id/branches', authenticate, requireRole('owner', 'admin'), accessCtrl.updateUserBranches);

  // Branches / Stores / Shops (aura_companies by company_type)
  app.get('/api/admin/access/branches', authenticate, accessCtrl.getBranches);
  app.get('/api/admin/branches', authenticate, accessCtrl.getBranches);
  app.post('/api/admin/access/branches', authenticate, requireRole('owner', 'admin'), accessCtrl.createBranch);
  app.put('/api/admin/access/branches/:id', authenticate, requireRole('owner', 'admin'), accessCtrl.updateBranch);

  // Pending Supplier Approvals
  app.get('/api/admin/access/suppliers/pending', authenticate, requirePermission('suppliers-index'), accessCtrl.getPendingSuppliers);
  app.get('/api/admin/suppliers/pending', authenticate, requirePermission('suppliers-index'), accessCtrl.getPendingSuppliers);
  app.put('/api/admin/access/suppliers/:id/approve', authenticate, requireRole('owner', 'admin'), accessCtrl.approveSupplier);
  app.put('/api/admin/suppliers/:id/approve', authenticate, requireRole('owner', 'admin'), accessCtrl.approveSupplier);
  app.put('/api/admin/access/suppliers/:id/reject', authenticate, requireRole('owner', 'admin'), accessCtrl.rejectSupplier);

  // Login History & Audit Trails
  app.get('/api/admin/access/logs/logins', authenticate, requireRole('owner', 'admin', 'audit'), accessCtrl.getLoginHistory);
  app.get('/api/admin/logs/logins', authenticate, requireRole('owner', 'admin', 'audit'), accessCtrl.getLoginHistory);
  app.get('/api/admin/access/logs/audit-trails', authenticate, requireRole('owner', 'admin', 'audit'), accessCtrl.getAuditTrails);
  app.get('/api/admin/logs/audit-trails', authenticate, requireRole('owner', 'admin', 'audit'), accessCtrl.getAuditTrails);

  // --------------------------------------------------------------------------
  // 4. USER MANAGEMENT (aura_users & aura_groups)
  // --------------------------------------------------------------------------
  app.get('/api/admin/users/roles', authenticate, accessCtrl.getGroups);
  app.get('/api/admin/roles', authenticate, accessCtrl.getGroups);
  app.get('/api/admin/users', authenticate, checkModuleEnabled('settings'), requirePermission('users-index'), userCtrl.listUsers);
  app.get('/api/admin/users/:id', authenticate, checkModuleEnabled('settings'), requirePermission('users-index'), userCtrl.getUser);
  app.post('/api/admin/users', authenticate, checkModuleEnabled('settings'), requireRole('owner', 'admin'), userCtrl.createUser);
  app.put('/api/admin/users/:id', authenticate, checkModuleEnabled('settings'), requireRole('owner', 'admin'), userCtrl.updateUser);
  app.put('/api/admin/users/:id/status', authenticate, checkModuleEnabled('settings'), requireRole('owner', 'admin'), userCtrl.toggleUserStatus);
  app.delete('/api/admin/users/:id', authenticate, checkModuleEnabled('settings'), requireRole('owner', 'admin'), userCtrl.deleteUser);

  // --------------------------------------------------------------------------
  // 5. ERP MODULE SWITCHBOARD & LICENSE
  // --------------------------------------------------------------------------
  app.get('/api/admin/modules', authenticate, modCtrl.listModules);
  app.post('/api/admin/modules/verify-license', authenticate, modCtrl.verifyLicense);
  app.post('/api/admin/modules/toggle', authenticate, requireRole('owner', 'admin'), modCtrl.toggleModule);
  app.post('/api/admin/modules/bulk-update', authenticate, requireRole('owner', 'admin'), modCtrl.bulkUpdateModules);
  app.post('/api/admin/modules/submodule/toggle', authenticate, requireRole('owner', 'admin'), modCtrl.toggleSubmodule);
  app.get('/api/admin/modules/license', authenticate, modCtrl.getLicense);
  app.post('/api/admin/modules/license', authenticate, requireRole('owner', 'admin'), modCtrl.updateLicense);
  app.post('/api/admin/modules/website-template', authenticate, requireRole('owner', 'admin'), modCtrl.updateWebsiteTemplate);
  app.get('/api/public/website-status', modCtrl.getPublicWebsiteStatus);

  // Module Permissions Management
  app.get('/api/admin/modules/:moduleKey/permissions', authenticate, modCtrl.getModulePermissions);
  app.post('/api/admin/modules/:moduleKey/permissions', authenticate, requireRole('owner', 'admin'), modCtrl.createModulePermission);
  app.put('/api/admin/modules/:moduleKey/permissions', authenticate, requireRole('owner', 'admin'), modCtrl.updateModulePermissions);
  app.delete('/api/admin/modules/:moduleKey/permissions/:permissionKey', authenticate, requireRole('owner', 'admin'), modCtrl.deleteModulePermission);

  // --------------------------------------------------------------------------
  // 6. ERP DASHBOARD & TELEMETRY
  // --------------------------------------------------------------------------
  app.get('/api/admin/dashboard', authenticate, branchScopeFilter, dashCtrl.getDashboardData);
  app.get('/api/admin/dashboard/stats', authenticate, branchScopeFilter, dashCtrl.getDashboardData);

  // --------------------------------------------------------------------------
  // 7. INVENTORY & PRODUCT CATALOG (Scoped by branches & permissions)
  // --------------------------------------------------------------------------
  app.get('/api/admin/inventory/products', authenticate, checkModuleEnabled('inventory'), requirePermission('products-index'), branchScopeFilter, invCtrl.listProducts);
  app.get('/api/admin/products', authenticate, checkModuleEnabled('inventory'), requirePermission('products-index'), branchScopeFilter, invCtrl.listProducts);
  app.get('/api/admin/inventory/products/:id', authenticate, checkModuleEnabled('inventory'), requirePermission('products-index'), invCtrl.getProduct);
  app.post('/api/admin/inventory/products', authenticate, checkModuleEnabled('inventory'), requirePermission('products-add'), invCtrl.createProduct);
  app.post('/api/admin/products', authenticate, checkModuleEnabled('inventory'), requirePermission('products-add'), invCtrl.createProduct);
  app.put('/api/admin/inventory/products/:id', authenticate, checkModuleEnabled('inventory'), requirePermission('products-edit'), invCtrl.updateProduct);
  app.put('/api/admin/products/:id', authenticate, checkModuleEnabled('inventory'), requirePermission('products-edit'), invCtrl.updateProduct);
  app.delete('/api/admin/inventory/products/:id', authenticate, checkModuleEnabled('inventory'), requirePermission('products-delete'), invCtrl.deleteProduct);
  app.delete('/api/admin/products/:id', authenticate, checkModuleEnabled('inventory'), requirePermission('products-delete'), invCtrl.deleteProduct);
  app.get('/api/admin/inventory/export', authenticate, checkModuleEnabled('inventory'), requirePermission('products-export'), invCtrl.exportProductsCSV);

  // --------------------------------------------------------------------------
  // 8. SALES ORDERS & PURCHASES
  // --------------------------------------------------------------------------
  app.get('/api/admin/sales', authenticate, checkModuleEnabled('sales'), requirePermission('sales-index'), branchScopeFilter, ordCtrl.listSales);
  app.get('/api/admin/orders', authenticate, checkModuleEnabled('sales'), requirePermission('sales-index'), branchScopeFilter, ordCtrl.listSales);
  app.get('/api/admin/orders/:id', authenticate, checkModuleEnabled('sales'), requirePermission('sales-index'), ordCtrl.getSaleDetails);
  app.put('/api/admin/orders/:id/status', authenticate, checkModuleEnabled('sales'), requirePermission('sales-edit'), ordCtrl.updateSaleStatus);
  app.get('/api/admin/purchases', authenticate, checkModuleEnabled('purchases'), requirePermission('purchases-index'), branchScopeFilter, ordCtrl.listPurchases);

  // --------------------------------------------------------------------------
  // 9. CRM DIRECTORY (Buyers & Suppliers strictly from aura_users)
  // --------------------------------------------------------------------------
  app.get('/api/admin/crm/buyers', authenticate, checkModuleEnabled('crm'), requirePermission('customers-index'), crmCtrl.listBuyers);
  app.get('/api/admin/customers', authenticate, checkModuleEnabled('crm'), requirePermission('customers-index'), crmCtrl.listBuyers);
  app.post('/api/admin/customers', authenticate, checkModuleEnabled('crm'), requirePermission('customers-add'), crmCtrl.createBuyer);
  app.get('/api/admin/crm/suppliers', authenticate, checkModuleEnabled('crm'), requirePermission('suppliers-index'), crmCtrl.listSuppliers);
  app.get('/api/admin/suppliers', authenticate, checkModuleEnabled('crm'), requirePermission('suppliers-index'), crmCtrl.listSuppliers);
  app.post('/api/admin/suppliers', authenticate, checkModuleEnabled('crm'), requirePermission('suppliers-add'), crmCtrl.createSupplier);

  // --------------------------------------------------------------------------
  // 10. SITE SETTINGS & BRANDING
  // --------------------------------------------------------------------------
  app.get('/api/admin/settings', authenticate, requirePermission('system_settings'), setCtrl.getSettings);
  app.put('/api/admin/settings', authenticate, requireRole('owner', 'admin'), setCtrl.updateSettings);

  // --------------------------------------------------------------------------
  // 11. HR, ATTENDANCE, PAYROLL, NOTIFICATIONS, CALENDAR
  // --------------------------------------------------------------------------
  app.get('/api/admin/hr/employees', authenticate, checkModuleEnabled('hr'), requirePermission('hr-index'), hrCtrl.listEmployees);
  app.get('/api/admin/attendance', authenticate, checkModuleEnabled('attendance'), requirePermission('attendance-index'), hrCtrl.listAttendance);
  app.get('/api/admin/payroll', authenticate, checkModuleEnabled('payroll'), requirePermission('payroll-index'), hrCtrl.listPayroll);
  app.get('/api/admin/notifications', authenticate, hrCtrl.listNotifications);
  app.get('/api/admin/calendar', authenticate, hrCtrl.listEvents);

  console.log('[Route] Mounted ERP Master Layered Routes (/api/admin/* & /api/web/*)');
};
