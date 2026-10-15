const { authenticate, checkModuleEnabled, requireRole, requirePermission } = require('../../../middleware/permission.middleware');

// Controllers
const authCtrl = require('../../../controller/admin/adminAuth.controller');
const userCtrl = require('../../../controller/admin/adminUsers.controller');
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
  // 1. AUTHENTICATION & SESSION LIFECYCLE
  // --------------------------------------------------------------------------
  app.post('/api/admin/auth/login', authCtrl.login);
  app.post('/api/auth/login', authCtrl.login);
  app.post('/api/admin/login', authCtrl.login);
  app.post('/api/admin/auth/logout', authenticate, authCtrl.logout);
  app.post('/api/admin/auth/refresh', authCtrl.refreshToken);
  app.get('/api/admin/auth/profile', authenticate, authCtrl.getProfile);
  app.get('/api/admin/profile', authenticate, authCtrl.getProfile);
  app.get('/api/auth/profile', authenticate, authCtrl.getProfile);
  app.post('/api/admin/auth/forgot-password', authCtrl.forgotPassword);
  app.post('/api/admin/auth/reset-password', authCtrl.resetPassword);

  // --------------------------------------------------------------------------
  // 2. USER MANAGEMENT & ACCESS CONTROL (Solely aura_users)
  // --------------------------------------------------------------------------
  app.get('/api/admin/users/roles', authenticate, userCtrl.getRoles);
  app.get('/api/admin/roles', authenticate, userCtrl.getRoles);
  app.get('/api/admin/users', authenticate, checkModuleEnabled('settings'), requirePermission('settings', 'view'), userCtrl.listUsers);
  app.get('/api/admin/users/:id', authenticate, checkModuleEnabled('settings'), requirePermission('settings', 'view'), userCtrl.getUser);
  app.post('/api/admin/users', authenticate, checkModuleEnabled('settings'), requireRole('owner', 'admin'), userCtrl.createUser);
  app.put('/api/admin/users/:id', authenticate, checkModuleEnabled('settings'), requireRole('owner', 'admin'), userCtrl.updateUser);
  app.put('/api/admin/users/:id/status', authenticate, checkModuleEnabled('settings'), requireRole('owner', 'admin'), userCtrl.toggleUserStatus);
  app.delete('/api/admin/users/:id', authenticate, checkModuleEnabled('settings'), requireRole('owner', 'admin'), userCtrl.deleteUser);
  app.get('/api/admin/users/:id/activity', authenticate, checkModuleEnabled('settings'), userCtrl.getUserActivity);

  // --------------------------------------------------------------------------
  // 3. ERP MODULE SWITCHBOARD & LICENSE
  // --------------------------------------------------------------------------
  app.get('/api/admin/modules', authenticate, modCtrl.listModules);
  app.post('/api/admin/modules/toggle', authenticate, requireRole('owner', 'admin'), modCtrl.toggleModule);
  app.post('/api/admin/modules/submodule/toggle', authenticate, requireRole('owner', 'admin'), modCtrl.toggleSubmodule);
  app.get('/api/admin/modules/license', authenticate, modCtrl.getLicense);
  app.post('/api/admin/modules/license', authenticate, requireRole('owner', 'admin'), modCtrl.updateLicense);

  // --------------------------------------------------------------------------
  // 4. ERP DASHBOARD & TELEMETRY
  // --------------------------------------------------------------------------
  app.get('/api/admin/dashboard', authenticate, dashCtrl.getDashboardData);
  app.get('/api/admin/dashboard/stats', authenticate, dashCtrl.getDashboardData);

  // --------------------------------------------------------------------------
  // 5. INVENTORY & PRODUCT CATALOG
  // --------------------------------------------------------------------------
  app.get('/api/admin/inventory/products', authenticate, checkModuleEnabled('inventory'), requirePermission('inventory', 'view'), invCtrl.listProducts);
  app.get('/api/admin/products', authenticate, checkModuleEnabled('inventory'), requirePermission('inventory', 'view'), invCtrl.listProducts);
  app.get('/api/admin/inventory/products/:id', authenticate, checkModuleEnabled('inventory'), requirePermission('inventory', 'view'), invCtrl.getProduct);
  app.post('/api/admin/inventory/products', authenticate, checkModuleEnabled('inventory'), requirePermission('inventory', 'create'), invCtrl.createProduct);
  app.post('/api/admin/products', authenticate, checkModuleEnabled('inventory'), requirePermission('inventory', 'create'), invCtrl.createProduct);
  app.put('/api/admin/inventory/products/:id', authenticate, checkModuleEnabled('inventory'), requirePermission('inventory', 'edit'), invCtrl.updateProduct);
  app.put('/api/admin/products/:id', authenticate, checkModuleEnabled('inventory'), requirePermission('inventory', 'edit'), invCtrl.updateProduct);
  app.delete('/api/admin/inventory/products/:id', authenticate, checkModuleEnabled('inventory'), requirePermission('inventory', 'delete'), invCtrl.deleteProduct);
  app.delete('/api/admin/products/:id', authenticate, checkModuleEnabled('inventory'), requirePermission('inventory', 'delete'), invCtrl.deleteProduct);
  app.get('/api/admin/inventory/export', authenticate, checkModuleEnabled('inventory'), requirePermission('inventory', 'export'), invCtrl.exportProductsCSV);

  // --------------------------------------------------------------------------
  // 6. SALES ORDERS & PURCHASES
  // --------------------------------------------------------------------------
  app.get('/api/admin/sales', authenticate, checkModuleEnabled('sales'), requirePermission('sales', 'view'), ordCtrl.listSales);
  app.get('/api/admin/orders', authenticate, checkModuleEnabled('sales'), requirePermission('sales', 'view'), ordCtrl.listSales);
  app.get('/api/admin/orders/:id', authenticate, checkModuleEnabled('sales'), requirePermission('sales', 'view'), ordCtrl.getSaleDetails);
  app.put('/api/admin/orders/:id/status', authenticate, checkModuleEnabled('sales'), requirePermission('sales', 'edit'), ordCtrl.updateSaleStatus);
  app.get('/api/admin/purchases', authenticate, checkModuleEnabled('purchases'), requirePermission('purchases', 'view'), ordCtrl.listPurchases);

  // --------------------------------------------------------------------------
  // 7. CRM DIRECTORY (Buyers & Suppliers strictly from aura_users)
  // --------------------------------------------------------------------------
  app.get('/api/admin/crm/buyers', authenticate, checkModuleEnabled('crm'), requirePermission('crm', 'view'), crmCtrl.listBuyers);
  app.get('/api/admin/customers', authenticate, checkModuleEnabled('crm'), requirePermission('crm', 'view'), crmCtrl.listBuyers);
  app.post('/api/admin/customers', authenticate, checkModuleEnabled('crm'), requirePermission('crm', 'create'), crmCtrl.createBuyer);
  app.get('/api/admin/crm/suppliers', authenticate, checkModuleEnabled('crm'), requirePermission('crm', 'view'), crmCtrl.listSuppliers);
  app.get('/api/admin/suppliers', authenticate, checkModuleEnabled('crm'), requirePermission('crm', 'view'), crmCtrl.listSuppliers);
  app.post('/api/admin/suppliers', authenticate, checkModuleEnabled('crm'), requirePermission('crm', 'create'), crmCtrl.createSupplier);

  // --------------------------------------------------------------------------
  // 8. SITE SETTINGS & BRANDING
  // --------------------------------------------------------------------------
  app.get('/api/admin/settings', authenticate, setCtrl.getSettings);
  app.put('/api/admin/settings', authenticate, requireRole('owner', 'admin'), setCtrl.updateSettings);

  // --------------------------------------------------------------------------
  // 9. HR, ATTENDANCE, PAYROLL, NOTIFICATIONS, CALENDAR
  // --------------------------------------------------------------------------
  app.get('/api/admin/hr/employees', authenticate, checkModuleEnabled('hr'), requirePermission('hr', 'view'), hrCtrl.listEmployees);
  app.get('/api/admin/attendance', authenticate, checkModuleEnabled('attendance'), requirePermission('attendance', 'view'), hrCtrl.listAttendance);
  app.get('/api/admin/payroll', authenticate, checkModuleEnabled('payroll'), requirePermission('payroll', 'view'), hrCtrl.listPayroll);
  app.get('/api/admin/notifications', authenticate, hrCtrl.listNotifications);
  app.get('/api/admin/calendar', authenticate, hrCtrl.listEvents);

  // --------------------------------------------------------------------------
  // 10. ACTIVITY AUDIT TRAIL LOGS
  // --------------------------------------------------------------------------
  app.get('/api/admin/activity-logs', authenticate, requireRole('owner', 'admin', 'audit'), async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
      const offset = (page - 1) * limit;

      const [countRows] = await db.query('SELECT COUNT(*) AS total FROM aura_activity_logs');
      const total = countRows?.[0]?.total || 0;

      const [logs] = await db.query(`
        SELECT id, user_id, username, role, action, table_name, record_id,
               old_values, new_values, ip_address, user_agent, created_at
        FROM aura_activity_logs
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      return sendPaginated(res, logs || [], total, page, limit);
    } catch (err) {
      return sendError(res, 'Failed to fetch audit logs', 500, err.message);
    }
  });

  console.log('[Route] Mounted ERP Master Layered Routes (/api/admin/*)');
};
