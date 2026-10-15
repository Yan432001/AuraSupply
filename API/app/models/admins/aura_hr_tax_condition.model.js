const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_tax_condition",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"min_salary","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"max_salary","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"tax_percent","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reduce_tax","type":"double","auto":false,"nullable":true,"hasDefault":true},
  ],
});
