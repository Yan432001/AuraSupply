const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pay_payment_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"payment_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"tax_paid","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"salary_paid","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
