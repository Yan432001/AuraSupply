const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_employees_on_boardng",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"joining_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"probation_periods","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"probation_end_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"received_asset","type":"tinyint","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
  ],
});
