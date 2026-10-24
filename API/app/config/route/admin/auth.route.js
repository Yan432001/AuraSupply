const { 
  profile, 
  register, 
  login, 
  logout,
  activity,
  token_key_login 
} = require("../../../controller/admin/auth.controller");
const adminAuthCtrl = require("../../../controller/admin/adminAuth.controller");
const { verifyAdminSession } = require("../../../middleware/auth.middleware");

module.exports = (app) => {
  // 1. Admin Login endpoints
  app.post("/api/admin/auth/login", login);
  app.post("/api/admin/login", login);

  // 2. Admin Logout endpoints
  app.post("/api/admin/auth/logout", logout);
  app.post("/api/admin/logout", logout);

  // 3. Admin Profile & Session endpoints
  app.get("/api/admin/auth/session", verifyAdminSession, profile);
  app.get("/api/admin/auth/profile", verifyAdminSession, profile);
  app.post("/api/admin/auth/profile", verifyAdminSession, profile);
  app.get("/api/admin/profile", verifyAdminSession, profile);
  app.post("/api/admin/profile", verifyAdminSession, profile);

  // 4. Admin Session Refresh & Heartbeat Activity
  app.post("/api/admin/auth/refresh", adminAuthCtrl.refreshToken);
  app.post("/api/admin/auth/activity", verifyAdminSession, activity);
};
