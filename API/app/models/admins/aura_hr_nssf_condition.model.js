const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_nssf_condition",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"min_salary","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"max_salary","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"contributory_wage","type":"float","auto":false,"nullable":false,"hasDefault":true},
    {"name":"or_rate","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"hc_rate","type":"float","auto":false,"nullable":false,"hasDefault":false},
  ],
});
