const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_employees_working_promote",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_type_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"position_id","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"department_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"promoted_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"promoted_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"status","type":"char","auto":false,"nullable":false,"hasDefault":true},
    {"name":"employee_level","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"official_promote","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
