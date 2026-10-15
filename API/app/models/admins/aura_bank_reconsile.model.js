const BaseModel = require('../core/BaseModel');

module.exports = new BaseModel({
  table: "aura_bank_reconsile",
  primaryKey: ["id"],
  hidden: [],
  columns: [
    {"name":"id","type":"int","auto":true,"nullable":false,"hasDefault":false},
    {"name":"account_code","type":"int","auto":false,"nullable":false,"hasDefault":false},
    {"name":"start_date","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"end_date","type":"date","auto":false,"nullable":false,"hasDefault":false},
    {"name":"balance_bank","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"balance_book","type":"decimal","auto":false,"nullable":false,"hasDefault":false},
    {"name":"biller_id","type":"int","auto":false,"nullable":true,"hasDefault":true},
    {"name":"created_by","type":"int","auto":false,"nullable":true,"hasDefault":true},
  ],
});
