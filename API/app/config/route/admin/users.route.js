const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getRoles
} = require('../../../controller/admin/users.controller');
const { authenticate, requireRole } = require('../../../middleware/auth.middleware');

module.exports = (app) => {
  // Roles listing (available to authenticated admins)
  app.get('/api/admin/roles', authenticate, getRoles);
  app.get('/api/admin/groups', authenticate, getRoles);

  // User CRUD endpoints (Requires admin or owner role)
  app.get('/api/admin/users', authenticate, requireRole('owner', 'admin', 'branch'), getUsers);
  app.get('/api/admin/users/:id', authenticate, requireRole('owner', 'admin', 'branch'), getUserById);
  app.post('/api/admin/users', authenticate, requireRole('owner', 'admin'), createUser);
  app.put('/api/admin/users/:id', authenticate, requireRole('owner', 'admin'), updateUser);
  app.put('/api/admin/users/:id/status', authenticate, requireRole('owner', 'admin'), toggleUserStatus);
  app.delete('/api/admin/users/:id', authenticate, requireRole('owner', 'admin'), deleteUser);
};
