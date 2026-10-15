const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_kpi_measures",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"kpi_type","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"name_kh","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"min_percentage","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"max_percentage","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"color","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"increase_salary","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
