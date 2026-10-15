const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_templates",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"template","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
