const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pay_benefit_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"benefit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"additions","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"deductions","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"total_addition","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_deduction","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cash_advanced","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cash_advance_ids","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
