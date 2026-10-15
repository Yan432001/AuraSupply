const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_employees_contract",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"position_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"employee_type_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"basic_salary","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"contract_title","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"contract_type","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"start_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"end_date","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"severance","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"month","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"group_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"salary_review_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
