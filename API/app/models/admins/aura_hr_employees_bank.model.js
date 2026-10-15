const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_hr_employees_bank",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"employee_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"bank_account","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_name","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_currency","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"description","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"date_opened","type":"date","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date_issued","type":"date","auto":false,"nullable":true,"hasDefault":true},
  ],
});
