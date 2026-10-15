const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_expense_items",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"expense_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"category_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"category_code","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"category_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"unit_cost","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"quantity","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"subtotal","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
