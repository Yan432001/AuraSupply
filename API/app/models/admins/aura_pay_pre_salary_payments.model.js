const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pay_pre_salary_payments",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"pre_salary_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"decimal","auto":false,"nullable":false,"hasDefault":true},
    {"name":"month","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"year","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"paid_by","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_at","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
  ],
});
