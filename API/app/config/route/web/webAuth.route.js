const webAuthCtrl = require("../../../controller/web/webAuth.controller");
const { verifyWebSession } = require("../../../middleware/auth.middleware");

module.exports = (app) => {
  // 1. Website Login & Logout
  app.post("/api/web/auth/login", webAuthCtrl.login);
  app.post("/api/auth/web-login", webAuthCtrl.login);
  app.post("/api/web/auth/logout", webAuthCtrl.logout);
  app.post("/api/auth/web-logout", webAuthCtrl.logout);

  // 2. Website Customer Registration & Email Verification
  app.post("/api/web/auth/register", webAuthCtrl.register);
  app.post("/api/auth/register", webAuthCtrl.register);
  app.post("/api/web/auth/verify-email", webAuthCtrl.verifyEmail);

  // 3. Website Session & Customer Profile
  app.get("/api/web/auth/session", verifyWebSession, webAuthCtrl.profile);
  app.get("/api/web/auth/profile", verifyWebSession, webAuthCtrl.profile);
  app.get("/api/auth/profile", verifyWebSession, webAuthCtrl.profile);

  // 4. Inactivity Activity Heartbeat
  app.post("/api/web/auth/activity", verifyWebSession, webAuthCtrl.activity);
};
