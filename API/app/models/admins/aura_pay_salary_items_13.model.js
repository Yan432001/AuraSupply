const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pay_salary_items_13",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"salary_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"net_salary","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"annual_leave","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"al_rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"al_amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"subtotal","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"paid","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_status","type":"char","auto":false,"nullable":true,"hasDefault":true},
  ],
});
