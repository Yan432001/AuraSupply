const { 
  profile, 
  register, 
  login, 
  token_key_login 
} = require("../../../controller/admin/auth.controller");

module.exports = (app) => {
  // Login endpoints
  app.post("/api/auth/login", login);
  app.post("/api/admin/login", login);
  app.post("/api/admin/auth/login", login);

  // Profile endpoints
  app.get("/api/auth/profile", token_key_login(), profile);
  app.post("/api/auth/profile", token_key_login(), profile);
  app.get("/api/admin/profile", token_key_login(), profile);
  app.post("/api/admin/profile", token_key_login(), profile);

  // Register
  app.post("/api/auth/register", token_key_login(), register);
  app.post("/api/admin/register", token_key_login(), register);
};