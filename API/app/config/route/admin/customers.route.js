const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require("../../../controller/admin/customers.controller");

module.exports = (app) => {
  app.get("/api/admin/customers", getCustomers);
  app.get("/api/admin/customers/:id", getCustomerById);
  app.post("/api/admin/customers", createCustomer);
  app.put("/api/admin/customers/:id", updateCustomer);
  app.delete("/api/admin/customers/:id", deleteCustomer);
};
