const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pay_pre_salary_payment_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"pre_salary_item_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
