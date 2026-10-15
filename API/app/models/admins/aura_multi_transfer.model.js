const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_multi_transfer",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"tran_no","type":"tinyint","auto":false,"nullable":false,"hasDefault":false},
    {"name":"tran_type","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"tran_date","type":"datetime","auto":false,"nullable":true,"hasDefault":true},
    {"name":"account_code","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"amount","type":"decimal","auto":false,"nullable":true,"hasDefault":true},
    {"name":"narrative","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"reference_no","type":"varchar","auto":false,"nullable":false,"hasDefault":true},
    {"name":"description","type":"varchar","auto":false,"nullable":true,"hasDefault":true},
    {"name":"biller_id","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
