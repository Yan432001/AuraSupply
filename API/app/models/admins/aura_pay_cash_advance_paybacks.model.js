const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_pay_cash_advance_paybacks",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_code","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cash_advance_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"paid_by","type":"varchar","auto":false,"nullable":false,"hasDefault":false},
    {"name":"cheque_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cc_no","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cc_holder","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cc_month","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cc_year","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"cc_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"actual_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"attachment","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"note","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"currencies","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"updated_at","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"benefit_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
