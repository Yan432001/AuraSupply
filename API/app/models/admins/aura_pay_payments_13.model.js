const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pay_payments_13",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"salary_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"text","auto":false,"nullable":true,"hasDefault":false},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_code","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"double","auto":false,"nullable":true,"hasDefault":true},
    {"name":"year","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
