const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pay_pre_salaries",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":false,"hasDefault":true},
    {"name":"month","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"year","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_gross_salary","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"total_paid","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"position_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"department_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"group_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"payment_status","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"attachment","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"status","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"type","type":"char","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
  ],
});
