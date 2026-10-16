const { 
  profile, 
  register, 
  login, 
  logout,
  token_key_login 
} = require("../../../controller/admin/auth.controller");
const { authenticate } = require("../../../middleware/permission.middleware");

module.exports = (app) => {
  // Login endpoints
  app.post("/api/admin/auth/login", login);
  app.post("/api/admin/login", login);
  app.post("/api/auth/login", login);

  // Logout endpoints
  app.post("/api/admin/auth/logout", logout);
  app.post("/api/admin/logout", logout);
  app.post("/api/auth/logout", logout);

  // Profile & Session endpoints
  app.get("/api/admin/auth/session", token_key_login(), profile);
  app.get("/api/admin/auth/profile", token_key_login(), profile);
  app.post("/api/admin/auth/profile", token_key_login(), profile);
  app.get("/api/admin/profile", token_key_login(), profile);
  app.post("/api/admin/profile", token_key_login(), profile);
  app.get("/api/auth/profile", token_key_login(), profile);
  app.post("/api/auth/profile", token_key_login(), profile);

  // User Registration
  app.post("/api/admin/auth/register", authenticate, register);
  app.post("/api/admin/register", authenticate, register);
  app.post("/api/auth/register", authenticate, register);
};